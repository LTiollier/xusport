// XuSport — IndexedDB (Dexie) — local source of truth.
// Each user-owned record carries `_local_updated_at` (ms epoch) used by the
// sync engine to decide "most-recent wins" against the server's `updated_at`.
// IDs prefixed with `local:` are temporary and replaced by server IDs after
// the first successful push.

'use client';

import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  SessionLog,
  SessionModel,
  UserProfile,
} from './types';

export interface ExerciseRow extends Exercise {
  updated_at?: string | null;
  _local_updated_at?: number;
}

export interface ModelRow extends SessionModel {
  updated_at?: string | null;
  _local_updated_at?: number;
}

export interface LogRow extends SessionLog {
  _local_updated_at?: number;
}

export interface ProfileRow extends UserProfile {
  _local_updated_at?: number;
}

export type SyncOp =
  | {
      kind: 'exercise.create';
      tempId: string;
      payload: ExerciseInputPayload;
      created_at: number;
    }
  | {
      kind: 'exercise.update';
      id: number | string;
      payload: ExerciseInputPayload;
      created_at: number;
    }
  | {
      kind: 'exercise.delete';
      id: number | string;
      created_at: number;
    }
  | {
      kind: 'model.create';
      tempId: string;
      payload: ModelInputPayload;
      created_at: number;
    }
  | {
      kind: 'model.update';
      id: number | string;
      payload: ModelInputPayload;
      created_at: number;
    }
  | {
      kind: 'model.delete';
      id: number | string;
      created_at: number;
    }
  | {
      kind: 'log.create';
      tempId: string;
      payload: LogInputPayload;
      created_at: number;
    }
  | {
      kind: 'log.update';
      id: number | string;
      payload: LogUpdatePayload;
      created_at: number;
    }
  | {
      kind: 'settings.update';
      payload: { sound: boolean; vibrate: boolean; demo_mode: boolean };
      created_at: number;
    };

export interface ExerciseInputPayload {
  name: string;
  group?: string | null;
  icon?: string | null;
}

export interface ModelInputPayload {
  name: string;
  exercises: Array<{
    exercise_id: number | string;
    sets_count: number;
    goal_type: 'fixed' | 'max';
    goal_value: number | null;
    rest_time: number;
    order: number;
  }>;
}

export interface LogInputPayload {
  session_model_id: number | string;
  duration: number;
  completed_at: string;
  performance_logs: Array<{
    exercise_id: number | string;
    set_number: number;
    reps_done: number;
  }>;
}

export interface LogUpdatePayload {
  performance_logs: Array<{
    exercise_id: number | string;
    set_number: number;
    reps_done: number;
  }>;
}

export interface SyncQueueItem {
  id?: number;
  op: SyncOp;
  attempts: number;
  last_error?: string;
}

export interface SyncMetaRow {
  key: 'last_pull_at' | 'last_push_at' | 'last_full_sync_at';
  value: number;
}

class XuSportDB extends Dexie {
  exercises!: Table<ExerciseRow, number | string>;
  models!: Table<ModelRow, number | string>;
  history!: Table<LogRow, number | string>;
  profile!: Table<ProfileRow, number>;
  sync_queue!: Table<SyncQueueItem, number>;
  sync_meta!: Table<SyncMetaRow, string>;

  constructor() {
    super('xusport');
    this.version(1).stores({
      exercises: 'id',
      models: 'id',
      history: 'id, completed_at',
      profile: 'id',
      sync_queue: '++id',
      sync_meta: 'key',
    });
  }
}

let _db: XuSportDB | null = null;

export function db(): XuSportDB {
  if (!_db) _db = new XuSportDB();
  return _db;
}

export function nowMs(): number {
  return Date.now();
}

export function tempId(prefix: 'exercise' | 'model' | 'log'): string {
  return `local:${prefix}:${crypto.randomUUID()}`;
}

export function isLocalId(id: number | string): boolean {
  return typeof id === 'string' && id.startsWith('local:');
}

export async function clearAllData(): Promise<void> {
  const d = db();
  await d.transaction(
    'rw',
    [d.exercises, d.models, d.history, d.profile, d.sync_queue, d.sync_meta],
    async () => {
      await Promise.all([
        d.exercises.clear(),
        d.models.clear(),
        d.history.clear(),
        d.profile.clear(),
        d.sync_queue.clear(),
        d.sync_meta.clear(),
      ]);
    },
  );
}

export async function setMeta(
  key: SyncMetaRow['key'],
  value: number,
): Promise<void> {
  await db().sync_meta.put({ key, value });
}

export async function getMeta(
  key: SyncMetaRow['key'],
): Promise<number | null> {
  const row = await db().sync_meta.get(key);
  return row?.value ?? null;
}
