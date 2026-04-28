// XuSport — In-memory store backed by the API.
// `reload()` hydrates from /sync + /user/profile + /stats/dashboard.
// On 401 the token is cleared and `authed` flips to false so the page can
// redirect to /login.

'use client';

import { useEffect, useState } from 'react';
import { ApiError, api, auth } from './api';
import type {
  DashboardStats,
  Exercise,
  SessionLog,
  SessionModel,
  UserProfile,
  UserSettings,
} from './types';

interface StoreState {
  exercises: Exercise[];
  models: SessionModel[];
  history: SessionLog[];
  profile: UserProfile | null;
  dashboard: DashboardStats | null;
  ready: boolean;
  authed: boolean;
  error: string | null;
}

let state: StoreState = {
  exercises: [],
  models: [],
  history: [],
  profile: null,
  dashboard: null,
  ready: false,
  authed: false,
  error: null,
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const setState = (patch: Partial<StoreState>) => {
  state = { ...state, ...patch };
  notify();
};

export function useStore(): StoreState & {
  reload: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  setModels: (models: SessionModel[]) => void;
  prependLog: (log: SessionLog) => void;
  setProfile: (p: UserProfile | null) => void;
  setSettings: (s: UserSettings) => void;
} {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return {
    ...state,
    reload,
    refreshDashboard,
    setModels: (models) => setState({ models }),
    prependLog: (log) =>
      setState({ history: [log, ...state.history] }),
    setProfile: (profile) => setState({ profile }),
    setSettings: (settings) => {
      if (!state.profile) return;
      setState({ profile: { ...state.profile, settings } });
    },
  };
}

async function reload() {
  if (!auth.isAuthed()) {
    setState({ ready: true, authed: false });
    return;
  }
  try {
    const [sync, profile, dashboard] = await Promise.all([
      api.sync(),
      api.profile().catch(() => null),
      api.dashboard().catch(() => null),
    ]);
    setState({
      exercises: sync.exercises,
      models: sync.models,
      history: sync.history,
      profile,
      dashboard,
      ready: true,
      authed: true,
      error: null,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      auth.clearToken();
      setState({ ready: true, authed: false, error: null });
      return;
    }
    setState({
      ready: true,
      authed: true,
      error:
        err instanceof Error ? err.message : 'Erreur de chargement',
    });
  }
}

async function refreshDashboard() {
  if (!auth.isAuthed()) return;
  try {
    const dashboard = await api.dashboard();
    setState({ dashboard });
  } catch {
    /* best effort */
  }
}

// Helpers usable from any component
export const find = {
  exerciseById(exercises: Exercise[], id: Exercise['id']): Exercise | null {
    return exercises.find((e) => String(e.id) === String(id)) ?? null;
  },
  modelById(
    models: SessionModel[],
    id: SessionModel['id'],
  ): SessionModel | null {
    return models.find((m) => String(m.id) === String(id)) ?? null;
  },
  pbFor(history: SessionLog[], exerciseId: Exercise['id']): number {
    let max = 0;
    for (const log of history) {
      for (const pl of log.performance_logs) {
        if (
          String(pl.exercise_id) === String(exerciseId) &&
          pl.reps_done > max
        ) {
          max = pl.reps_done;
        }
      }
    }
    return max;
  },
  lastRepsFor(
    history: SessionLog[],
    exerciseId: Exercise['id'],
    setIdx: number,
  ): number | null {
    const sorted = [...history].sort((a, b) => {
      const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return db - da;
    });
    for (const log of sorted) {
      const sets = log.performance_logs
        .filter((pl) => String(pl.exercise_id) === String(exerciseId))
        .sort((a, b) => a.set_number - b.set_number);
      if (sets.length === 0) continue;
      return sets[setIdx]?.reps_done ?? sets[sets.length - 1]?.reps_done ?? null;
    }
    return null;
  },
};
