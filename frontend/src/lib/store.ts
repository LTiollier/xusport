// XuSport — Offline-first store.
// UI reads come from Dexie via useLiveQuery so they stay in sync with the
// underlying tables. Mutations write Dexie + enqueue an op + kick a
// best-effort syncAll() if we're online.

'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ApiError, api, auth } from './api';
import {
  type ModelInputPayload,
  type ModelRow,
  clearAllData,
  db,
  isLocalId,
  nowMs,
  tempId,
} from './db';
import { dashboardCache, enqueue, isOnline, syncAll } from './sync';
import type {
  DashboardStats,
  Exercise,
  SessionLog,
  SessionModel,
  UserProfile,
  UserSettings,
} from './types';

interface RuntimeState {
  ready: boolean;
  authed: boolean;
  syncing: boolean;
  error: string | null;
}

// Initialised to safe-for-SSR defaults. bootstrap() reads localStorage and
// sets the real values on mount, avoiding a hydration mismatch.
let runtime: RuntimeState = {
  ready: false,
  authed: false,
  syncing: false,
  error: null,
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const setRuntime = (patch: Partial<RuntimeState>) => {
  runtime = { ...runtime, ...patch };
  notify();
};

function useRuntime(): RuntimeState {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return runtime;
}

export interface StoreView {
  exercises: Exercise[];
  models: SessionModel[];
  history: SessionLog[];
  profile: UserProfile | null;
  dashboard: DashboardStats | null;
  pending: number;
  lastSyncAt: number | null;
  ready: boolean;
  authed: boolean;
  syncing: boolean;
  error: string | null;
}

export function useStore(): StoreView {
  const rt = useRuntime();

  const exercises =
    useLiveQuery(() => db().exercises.toArray(), [], []) ?? [];
  const models =
    useLiveQuery(() => db().models.toArray(), [], []) ?? [];
  const history =
    useLiveQuery(
      () => db().history.orderBy('completed_at').reverse().toArray(),
      [],
      [],
    ) ?? [];
  const profileRows =
    useLiveQuery(() => db().profile.toArray(), [], []) ?? [];
  const pending =
    useLiveQuery(() => db().sync_queue.count(), [], 0) ?? 0;
  const lastSync =
    useLiveQuery(
      async () => (await db().sync_meta.get('last_full_sync_at'))?.value ?? null,
      [],
      null,
    ) ?? null;

  const profile = profileRows[0] ?? null;
  const dashboard = dashboardCache.get();

  return {
    exercises,
    models,
    history,
    profile,
    dashboard,
    pending,
    lastSyncAt: lastSync,
    ready: rt.ready,
    authed: rt.authed,
    syncing: rt.syncing,
    error: rt.error,
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function bootstrap(): Promise<void> {
  // Marks ready as soon as we know the auth state. A network sync is kicked
  // off in the background but the UI doesn't wait for it — Dexie already
  // contains whatever was cached on the previous session.
  if (!auth.isAuthed()) {
    setRuntime({ ready: true, authed: false });
    return;
  }
  setRuntime({ ready: true, authed: true });
  void runSync();
}

export async function runSync(options?: {
  blocking?: boolean;
}): Promise<void> {
  if (!auth.isAuthed()) return;
  setRuntime({ syncing: true, error: null });
  const result = await syncAll();
  if (result.errors.includes('offline')) {
    setRuntime({ syncing: false });
    return;
  }
  if (result.errors.length > 0) {
    setRuntime({ syncing: false, error: result.errors[0] });
  } else {
    setRuntime({ syncing: false, error: null });
  }
  // returning to the caller in case they want to react (e.g. login flow)
  if (!options?.blocking) return;
}

export async function logoutAndReset(): Promise<void> {
  // Best-effort drain so unsynced work isn't lost.
  if (auth.isAuthed() && isOnline()) {
    try {
      await syncAll();
    } catch {
      /* ignore */
    }
  }
  try {
    await api.logout();
  } catch {
    /* token may already be invalid */
  }
  auth.clearToken();
  await clearAllData();
  dashboardCache.clear();
  setRuntime({ ready: true, authed: false, error: null });
}

export function markAuthed(): void {
  setRuntime({ ready: true, authed: true, error: null });
}

// ---------------------------------------------------------------------------
// Mutations (offline-first)
// ---------------------------------------------------------------------------

export async function saveModel(
  payload: ModelInputPayload,
  opts: { editingId?: SessionModel['id']; flavor?: Partial<SessionModel> },
): Promise<SessionModel> {
  const ts = nowMs();
  const exercises = await db().exercises.toArray();
  const blocks = payload.exercises.map((b, i) => ({
    id: -(i + 1),
    session_model_id: 0,
    exercise_id: b.exercise_id,
    sets_count: b.sets_count,
    goal_type: b.goal_type,
    goal_value: b.goal_value,
    rest_time: b.rest_time,
    order: b.order,
    exercise:
      exercises.find((e) => String(e.id) === String(b.exercise_id)) ?? {
        id: b.exercise_id,
        name: '',
        group: null,
        icon: null,
      },
  }));

  if (opts.editingId != null) {
    const existing = await db().models.get(opts.editingId);
    const next: ModelRow = {
      ...(existing ?? {}),
      id: opts.editingId,
      name: payload.name,
      exercises: blocks,
      color: opts.flavor?.color ?? existing?.color,
      subtitle: opts.flavor?.subtitle ?? existing?.subtitle,
      _local_updated_at: ts,
    };
    await db().models.put(next);
    await enqueue({
      kind: 'model.update',
      id: opts.editingId,
      payload,
      created_at: ts,
    });
    void kickSync();
    return next;
  }

  const id = tempId('model');
  const draft: ModelRow = {
    id,
    name: payload.name,
    exercises: blocks,
    color: opts.flavor?.color,
    subtitle: opts.flavor?.subtitle,
    _local_updated_at: ts,
  };
  await db().models.put(draft);
  await enqueue({
    kind: 'model.create',
    tempId: id,
    payload,
    created_at: ts,
  });
  void kickSync();
  return draft;
}

export async function deleteModel(id: SessionModel['id']): Promise<void> {
  const ts = nowMs();
  await db().models.delete(id);
  if (isLocalId(id)) {
    // The model was never pushed; remove its pending create op too.
    const queue = await db().sync_queue.toArray();
    for (const item of queue) {
      if (
        item.op.kind === 'model.create' &&
        item.op.tempId === id &&
        item.id != null
      ) {
        await db().sync_queue.delete(item.id);
      }
    }
    return;
  }
  await enqueue({ kind: 'model.delete', id, created_at: ts });
  void kickSync();
}

export async function saveExercise(
  payload: { name: string; group?: string | null; icon?: string | null },
  opts?: { editingId?: Exercise['id'] },
): Promise<Exercise> {
  const ts = nowMs();
  if (opts?.editingId != null) {
    const existing = await db().exercises.get(opts.editingId);
    const next: import('./db').ExerciseRow = {
      ...(existing ?? { id: opts.editingId, name: payload.name, group: null, icon: null }),
      ...payload,
      _local_updated_at: ts,
    };
    await db().exercises.put(next);
    await enqueue({
      kind: 'exercise.update',
      id: opts.editingId,
      payload,
      created_at: ts,
    });
    void kickSync();
    return next;
  }

  const id = tempId('exercise');
  const draft: import('./db').ExerciseRow = {
    id,
    ...payload,
    group: payload.group ?? null,
    icon: payload.icon ?? null,
    _local_updated_at: ts,
  };
  await db().exercises.put(draft);
  await enqueue({
    kind: 'exercise.create',
    tempId: id,
    payload,
    created_at: ts,
  });
  void kickSync();
  return draft;
}

export async function deleteExercise(id: Exercise['id']): Promise<void> {
  const ts = nowMs();
  await db().exercises.delete(id);
  if (isLocalId(id)) {
    const queue = await db().sync_queue.toArray();
    for (const item of queue) {
      if (
        item.op.kind === 'exercise.create' &&
        item.op.tempId === id &&
        item.id != null
      ) {
        await db().sync_queue.delete(item.id);
      }
    }
    return;
  }
  await enqueue({ kind: 'exercise.delete', id, created_at: ts });
  void kickSync();
}

export async function createLog(input: {
  session_model_id: SessionModel['id'];
  duration: number;
  completed_at: string;
  performance_logs: Array<{
    exercise_id: number | string;
    set_number: number;
    reps_done: number;
  }>;
  has_pb?: boolean;
}): Promise<SessionLog> {
  const ts = nowMs();
  const id = tempId('log');
  const profile = (await db().profile.toCollection().first()) ?? null;
  const log: SessionLog = {
    id,
    user_id: profile?.id ?? 0,
    session_model_id: input.session_model_id,
    duration: input.duration,
    completed_at: input.completed_at,
    synced_at: null,
    has_pb: input.has_pb ?? false,
    performance_logs: input.performance_logs.map((pl, i) => ({
      id: -(i + 1),
      session_log_id: 0,
      exercise_id: pl.exercise_id,
      set_number: pl.set_number,
      reps_done: pl.reps_done,
      is_pb: false,
    })),
  };
  await db().history.put(log);
  await enqueue({
    kind: 'log.create',
    tempId: id,
    payload: {
      session_model_id: input.session_model_id,
      duration: input.duration,
      completed_at: input.completed_at,
      performance_logs: input.performance_logs,
    },
    created_at: ts,
  });
  void kickSync();
  return log;
}

export async function updateLog(
  logId: SessionLog['id'],
  performanceLogs: Array<{
    exercise_id: number | string;
    set_number: number;
    reps_done: number;
  }>,
): Promise<void> {
  const ts = nowMs();
  const existing = await db().history.get(logId);
  if (!existing) return;

  const byKey = new Map(
    performanceLogs.map((pl) => [
      `${String(pl.exercise_id)}#${pl.set_number}`,
      pl,
    ]),
  );

  // Best-effort local recompute of is_pb for the affected exercises by
  // scanning *other* logs. The backend recomputes authoritatively on push.
  const otherLogs = await db().history.toArray();
  const otherMaxByExercise = new Map<string, number>();
  for (const log of otherLogs) {
    if (String(log.id) === String(logId)) continue;
    for (const pl of log.performance_logs) {
      const k = String(pl.exercise_id);
      const cur = otherMaxByExercise.get(k) ?? 0;
      if (pl.reps_done > cur) otherMaxByExercise.set(k, pl.reps_done);
    }
  }

  const nextLogs = existing.performance_logs.map((pl) => {
    const k = `${String(pl.exercise_id)}#${pl.set_number}`;
    const updated = byKey.get(k);
    if (!updated) return pl;
    const otherMax = otherMaxByExercise.get(String(pl.exercise_id)) ?? 0;
    return {
      ...pl,
      reps_done: updated.reps_done,
      is_pb: updated.reps_done > otherMax,
    };
  });

  await db().history.put({
    ...existing,
    performance_logs: nextLogs,
    has_pb: nextLogs.some((pl) => pl.is_pb),
    _local_updated_at: ts,
  });

  if (isLocalId(logId)) {
    // The create op hasn't been pushed yet. Patch the queued payload so the
    // upcoming POST already has the edited values — no separate update needed.
    const queue = await db().sync_queue.toArray();
    for (const item of queue) {
      if (
        item.op.kind === 'log.create' &&
        String(item.op.tempId) === String(logId) &&
        item.id != null
      ) {
        const patched = item.op.payload.performance_logs.map((pl) => {
          const k = `${String(pl.exercise_id)}#${pl.set_number}`;
          const upd = byKey.get(k);
          return upd ? { ...pl, reps_done: upd.reps_done } : pl;
        });
        await db().sync_queue.put({
          ...item,
          op: {
            ...item.op,
            payload: { ...item.op.payload, performance_logs: patched },
          },
        });
      }
    }
    void kickSync();
    return;
  }

  await enqueue({
    kind: 'log.update',
    id: logId,
    payload: {
      performance_logs: nextLogs.map((pl) => ({
        exercise_id: pl.exercise_id,
        set_number: pl.set_number,
        reps_done: pl.reps_done,
      })),
    },
    created_at: ts,
  });
  void kickSync();
}

export async function updateSettings(settings: UserSettings): Promise<void> {
  const ts = nowMs();
  const profile = await db().profile.toCollection().first();
  if (profile) {
    await db().profile.put({
      ...profile,
      settings,
      _local_updated_at: ts,
    });
  }
  await enqueue({ kind: 'settings.update', payload: settings, created_at: ts });
  void kickSync();
}

async function kickSync(): Promise<void> {
  if (!isOnline() || !auth.isAuthed()) return;
  try {
    await syncAll();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      auth.clearToken();
      setRuntime({ authed: false });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers (still used by screens)
// ---------------------------------------------------------------------------

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
  bestRepsForSet(
    history: SessionLog[],
    exerciseId: Exercise['id'],
    setNumber: number,
  ): number {
    let max = 0;
    for (const log of history) {
      for (const pl of log.performance_logs) {
        if (
          String(pl.exercise_id) === String(exerciseId) &&
          pl.set_number === setNumber &&
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
