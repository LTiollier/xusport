// XuSport — Offline-first sync engine.
//
// Strategy
// --------
// 1. syncPush(): drain `sync_queue` to the API. On a successful model/log
//    create, the server returns a real numeric ID and we rewrite every
//    Dexie row + remaining queue item that was referencing the local
//    `local:...` placeholder.
// 2. syncPull(): GET /sync, /user/profile, /stats/dashboard. Per-entity
//    merge keeps the "most recent" version: if a Dexie row is still being
//    edited locally (i.e. a pending op for it lives in the queue, OR its
//    _local_updated_at is greater than the server's updated_at when both
//    are present) we keep the local one — otherwise the server wins.
// 3. syncAll(): push then pull. Bumps sync_meta timestamps.
//
// We only call the API when navigator.onLine is true and a token is set.
// Errors are caught per-op so one bad mutation doesn't block the rest.

'use client';

import { ApiError, api, auth } from './api';
import {
  type LogRow,
  type ModelRow,
  type SyncOp,
  type SyncQueueItem,
  db,
  isLocalId,
  nowMs,
  setMeta,
} from './db';
import type {
  DashboardStats,
  Exercise,
  SessionLog,
  SessionModel,
  SyncBundle,
  UserProfile,
} from './types';

const MAX_ATTEMPTS = 5;

let inflight: Promise<SyncResult> | null = null;

export interface SyncResult {
  pushed: number;
  pulled: boolean;
  errors: string[];
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export async function enqueue(op: SyncOp): Promise<number> {
  const id = await db().sync_queue.add({ op, attempts: 0 });
  return id as number;
}

export async function pendingCount(): Promise<number> {
  return db().sync_queue.count();
}

export async function syncAll(): Promise<SyncResult> {
  if (inflight) return inflight;
  inflight = (async () => {
    const errors: string[] = [];
    let pushed = 0;
    let pulled = false;

    if (!auth.isAuthed()) return { pushed, pulled, errors };
    if (!isOnline()) {
      errors.push('offline');
      return { pushed, pulled, errors };
    }

    try {
      pushed = await syncPush(errors);
      await setMeta('last_push_at', nowMs());
    } catch (err) {
      errors.push(`push: ${describe(err)}`);
    }

    try {
      pulled = await syncPull(errors);
      await setMeta('last_pull_at', nowMs());
    } catch (err) {
      errors.push(`pull: ${describe(err)}`);
    }

    if (errors.length === 0) {
      await setMeta('last_full_sync_at', nowMs());
    }

    return { pushed, pulled, errors };
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

// ---------------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------------

async function syncPush(errors: string[]): Promise<number> {
  const items = await db()
    .sync_queue.orderBy('id')
    .toArray();
  let count = 0;

  for (const cached of items) {
    if (cached.id == null) continue;
    const item = await db().sync_queue.get(cached.id);
    if (!item) continue; // reconciled / removed during a prior op
    if (item.attempts >= MAX_ATTEMPTS) continue;
    try {
      await runOp(item);
      count++;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw err;
      }
      const msg = describe(err);
      errors.push(`op ${item.op.kind}: ${msg}`);
      await db().sync_queue.update(item.id!, {
        attempts: item.attempts + 1,
        last_error: msg,
      });
    }
  }

  return count;
}

async function runOp(item: SyncQueueItem): Promise<void> {
  const op = item.op;
  switch (op.kind) {
    case 'exercise.create': {
      const res = await api.createExercise(op.payload);
      await reconcileLocalId('exercise', op.tempId, res.data);
      break;
    }
    case 'exercise.update': {
      if (isLocalId(op.id)) {
        return;
      }
      const res = await api.updateExercise(op.id, op.payload);
      await db().exercises.put({
        ...res.data,
        _local_updated_at: undefined,
      });
      await db().sync_queue.delete(item.id!);
      break;
    }
    case 'exercise.delete': {
      if (!isLocalId(op.id)) {
        await api.deleteExercise(op.id);
      }
      await db().exercises.delete(op.id);
      await db().sync_queue.delete(item.id!);
      break;
    }
    case 'model.create': {
      const res = await api.createModel(op.payload);
      await reconcileLocalId('model', op.tempId, res.data);
      break;
    }
    case 'model.update': {
      if (isLocalId(op.id)) {
        // The create op for this model hasn't run yet (or failed). Skip
        // until it does — the queue is processed in order so we'll come
        // back here once a real ID exists.
        return;
      }
      const res = await api.updateModel(op.id, op.payload);
      await db().models.put({
        ...res.data,
        _local_updated_at: undefined,
      });
      await db().sync_queue.delete(item.id!);
      break;
    }
    case 'model.delete': {
      if (!isLocalId(op.id)) {
        await api.deleteModel(op.id);
      }
      await db().models.delete(op.id);
      await db().sync_queue.delete(item.id!);
      break;
    }
    case 'log.create': {
      if (isLocalId(op.payload.session_model_id)) {
        // Wait for the parent model to be created server-side first.
        return;
      }
      const res = await api.createLog({
        session_model_id: op.payload.session_model_id,
        duration: op.payload.duration,
        completed_at: op.payload.completed_at,
        performance_logs: op.payload.performance_logs,
      });
      await reconcileLocalId('log', op.tempId, res.data);
      break;
    }
    case 'log.update': {
      if (isLocalId(op.id)) {
        // The create op for this log hasn't run yet (or failed). Skip until
        // it does — the queue is processed in order so we'll come back here
        // once a real ID exists.
        return;
      }
      const res = await api.updateLog(op.id, op.payload);
      await db().history.put({
        ...res.data,
        _local_updated_at: undefined,
      });
      await db().sync_queue.delete(item.id!);
      break;
    }
    case 'settings.update': {
      const settings = await api.updateSettings(op.payload);
      const profile = await db().profile.toCollection().first();
      if (profile) {
        await db().profile.put({
          ...profile,
          settings,
          _local_updated_at: undefined,
        });
      }
      await db().sync_queue.delete(item.id!);
      break;
    }
  }
}

async function reconcileLocalId(
  kind: 'exercise' | 'model' | 'log',
  tempId: string,
  serverEntity: Exercise | SessionModel | SessionLog,
): Promise<void> {
  const newId = serverEntity.id;
  const d = db();

  await d.transaction(
    'rw',
    [d.exercises, d.models, d.history, d.sync_queue],
    async () => {
      if (kind === 'exercise') {
        await d.exercises.delete(tempId);
        await d.exercises.put({
          ...(serverEntity as Exercise),
          _local_updated_at: undefined,
        });
        const allModels = await d.models.toArray();
        for (const model of allModels) {
          let updated = false;
          const nextExercises = model.exercises.map(e => {
            if (String(e.exercise_id) === tempId) {
              updated = true;
              return { ...e, exercise_id: newId, exercise: { ...e.exercise, id: newId } };
            }
            return e;
          });
          if (updated) {
            await d.models.put({ ...model, exercises: nextExercises });
          }
        }
        const allLogs = await d.history.toArray();
        for (const log of allLogs) {
          let updated = false;
          const nextLogs = log.performance_logs.map(pl => {
            if (String(pl.exercise_id) === tempId) {
              updated = true;
              return { ...pl, exercise_id: newId };
            }
            return pl;
          });
          if (updated) {
            await d.history.put({ ...log, performance_logs: nextLogs });
          }
        }
      } else if (kind === 'model') {
        await d.models.delete(tempId);
        await d.models.put({
          ...(serverEntity as SessionModel),
          _local_updated_at: undefined,
        });
        // Logs created against the local model get rewritten.
        const allLogs = await d.history.toArray();
        for (const log of allLogs) {
          if (String(log.session_model_id) === tempId) {
            await d.history.put({ ...log, session_model_id: newId });
          }
        }
      } else {
        await d.history.delete(tempId);
        await d.history.put({
          ...(serverEntity as SessionLog),
          _local_updated_at: undefined,
        });
      }

      const queue = await d.sync_queue.toArray();
      for (const q of queue) {
        const next = rewriteOpId(q.op, kind, tempId, newId);
        if (next) await d.sync_queue.put({ ...q, op: next });
      }

      // Drop the op we just ran. Dexie auto-id is safe to delete by id.
      const inflightItem = queue.find(
        (q) => q.op.kind === `${kind}.create` && opTempId(q.op) === tempId,
      );
      if (inflightItem?.id != null) {
        await d.sync_queue.delete(inflightItem.id);
      }
    },
  );
}

function opTempId(op: SyncOp): string | null {
  if (op.kind === 'exercise.create' || op.kind === 'model.create' || op.kind === 'log.create') return op.tempId;
  return null;
}

function rewriteOpId(
  op: SyncOp,
  kind: 'exercise' | 'model' | 'log',
  tempId: string,
  newId: number | string,
): SyncOp | null {
  if (kind === 'exercise') {
    if (
      (op.kind === 'exercise.update' || op.kind === 'exercise.delete') &&
      op.id === tempId
    ) {
      return { ...op, id: newId };
    }
    if (op.kind === 'model.create' || op.kind === 'model.update') {
      const nextExercises = op.payload.exercises.map(e => 
        String(e.exercise_id) === tempId ? { ...e, exercise_id: newId } : e
      );
      return { ...op, payload: { ...op.payload, exercises: nextExercises } };
    }
    if (op.kind === 'log.create') {
      const nextLogs = op.payload.performance_logs.map(pl => 
        String(pl.exercise_id) === tempId ? { ...pl, exercise_id: newId } : pl
      );
      return { ...op, payload: { ...op.payload, performance_logs: nextLogs } };
    }
  } else if (kind === 'model') {
    if (
      (op.kind === 'model.update' || op.kind === 'model.delete') &&
      op.id === tempId
    ) {
      return { ...op, id: newId };
    }
    if (op.kind === 'log.create' && op.payload.session_model_id === tempId) {
      return {
        ...op,
        payload: { ...op.payload, session_model_id: newId },
      };
    }
  } else if (kind === 'log') {
    if (op.kind === 'log.update' && op.id === tempId) {
      return { ...op, id: newId };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pull
// ---------------------------------------------------------------------------

async function syncPull(errors: string[]): Promise<boolean> {
  let bundle: SyncBundle;
  let profile: UserProfile | null = null;
  let dashboard: DashboardStats | null = null;

  try {
    [bundle, profile, dashboard] = await Promise.all([
      api.sync(),
      api.profile().catch(() => null),
      api.dashboard().catch(() => null),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw err;
    }
    errors.push(`pull: ${describe(err)}`);
    return false;
  }

  const d = db();
  const queue = await d.sync_queue.toArray();
  const lockedExerciseIds = new Set<string>();
  const lockedModelIds = new Set<string>();
  const lockedLogIds = new Set<string>();
  let settingsLocked = false;
  for (const q of queue) {
    if (q.op.kind === 'exercise.create') lockedExerciseIds.add(q.op.tempId);
    if (q.op.kind === 'exercise.update' || q.op.kind === 'exercise.delete')
      lockedExerciseIds.add(String(q.op.id));
    if (q.op.kind === 'model.create') lockedModelIds.add(q.op.tempId);
    if (q.op.kind === 'model.update' || q.op.kind === 'model.delete')
      lockedModelIds.add(String(q.op.id));
    if (q.op.kind === 'log.create') lockedLogIds.add(q.op.tempId);
    if (q.op.kind === 'log.update') lockedLogIds.add(String(q.op.id));
    if (q.op.kind === 'settings.update') settingsLocked = true;
  }

  await d.transaction(
    'rw',
    [d.exercises, d.models, d.history, d.profile],
    async () => {
      // Exercises: per-id merge like models.
      const localExercises = await d.exercises.toArray();
      const localExerciseMap = new Map(
        localExercises.map((e) => [String(e.id), e]),
      );
      const serverExerciseIds = new Set(bundle.exercises.map((e) => String(e.id)));

      for (const server of bundle.exercises) {
        const local = localExerciseMap.get(String(server.id));
        if (!local) {
          await d.exercises.put(server as import('./db').ExerciseRow);
          continue;
        }
        if (lockedExerciseIds.has(String(local.id))) continue;
        if (isMoreRecent(local, server)) continue;
        await d.exercises.put({
          ...server,
          _local_updated_at: undefined,
        });
      }
      for (const local of localExercises) {
        const idStr = String(local.id);
        if (serverExerciseIds.has(idStr)) continue;
        if (lockedExerciseIds.has(idStr)) continue;
        await d.exercises.delete(local.id);
      }

      // Models: per-id merge with most-recent-wins. Local rows that have a
      // pending op or a newer _local_updated_at are kept.
      const localModels = await d.models.toArray();
      const localModelMap = new Map(
        localModels.map((m) => [String(m.id), m]),
      );
      const serverIds = new Set(bundle.models.map((m) => String(m.id)));

      for (const server of bundle.models) {
        const local = localModelMap.get(String(server.id));
        if (!local) {
          await d.models.put(server as ModelRow);
          continue;
        }
        if (lockedModelIds.has(String(local.id))) {
          // pending mutation in queue — keep local
          continue;
        }
        if (isMoreRecent(local, server)) continue;
        await d.models.put({
          ...(server as ModelRow),
          _local_updated_at: undefined,
        });
      }
      // Drop local models the server doesn't know about, unless they are
      // still locked (waiting to be created on the server).
      for (const local of localModels) {
        const idStr = String(local.id);
        if (serverIds.has(idStr)) continue;
        if (lockedModelIds.has(idStr)) continue;
        await d.models.delete(local.id);
      }

      // History: append-only on the server side, but we may have local-only
      // logs still queued for upload. Keep server logs + any local-prefixed
      // ones.
      const localLogs = await d.history.toArray();
      const serverLogIds = new Set(
        bundle.history.map((l) => String(l.id)),
      );
      for (const server of bundle.history) {
        if (lockedLogIds.has(String(server.id))) continue;
        await d.history.put(server as LogRow);
      }
      for (const local of localLogs) {
        const idStr = String(local.id);
        if (serverLogIds.has(idStr)) continue;
        if (lockedLogIds.has(idStr)) continue;
        // local row that the server doesn't have AND that isn't queued —
        // probably an orphan from a failed sync; drop it.
        await d.history.delete(local.id);
      }

      // Profile / settings
      if (profile) {
        const localProfile = await d.profile.get(profile.id);
        if (settingsLocked && localProfile) {
          await d.profile.put({
            ...profile,
            settings: localProfile.settings,
            _local_updated_at: localProfile._local_updated_at,
          });
        } else {
          await d.profile.put({ ...profile, _local_updated_at: undefined });
        }
      }
    },
  );

  if (dashboard) await dashboardCache.set(dashboard);

  return true;
}

function isMoreRecent(local: { _local_updated_at?: number }, server: any): boolean {
  const localTs = local._local_updated_at ?? 0;
  const serverUpdated = server.updated_at ?? null;
  const serverTs = serverUpdated ? Date.parse(serverUpdated) : 0;
  if (!localTs) return false;
  if (!serverTs) return true; // server has no timestamp — trust local edit
  return localTs > serverTs;
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// ---------------------------------------------------------------------------
// Dashboard cache (separate from main schema to keep migrations simple)
// ---------------------------------------------------------------------------

class DashboardCache {
  private readonly key = 'xusport_dashboard_cache';
  set(d: DashboardStats): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    try {
      window.localStorage.setItem(this.key, JSON.stringify(d));
    } catch {
      /* quota — ignore */
    }
    return Promise.resolve();
  }
  get(): DashboardStats | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DashboardStats;
    } catch {
      return null;
    }
  }
  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(this.key);
  }
}

export const dashboardCache = new DashboardCache();
