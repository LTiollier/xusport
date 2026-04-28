// XuSport — Seed data fallback (used when no backend is reachable)
// Mirrors data.js from the design prototype.
import type { Exercise, SessionModel, SessionLog } from './types';

const exercises: Exercise[] = [
  { id: 'pushup', name: 'Pompes', group: 'Pecs · Triceps', icon: '💥' },
  { id: 'pullup', name: 'Tractions', group: 'Dos · Biceps', icon: '🧗' },
  { id: 'dip', name: 'Dips', group: 'Pecs · Triceps', icon: '⚡' },
  { id: 'squat', name: 'Squats', group: 'Jambes · Fessiers', icon: '🦵' },
  { id: 'lunge', name: 'Fentes', group: 'Jambes', icon: '🎯' },
  { id: 'plank', name: 'Gainage', group: 'Core', icon: '🪨' },
  { id: 'situp', name: 'Relevés de buste', group: 'Core', icon: '🔥' },
  { id: 'burpee', name: 'Burpees', group: 'Full body', icon: '🌪' },
  { id: 'pikepush', name: 'Pike Push-Ups', group: 'Épaules', icon: '🔻' },
  { id: 'lsit', name: 'L-Sit', group: 'Core · Épaules', icon: '🪐' },
  { id: 'mountain', name: 'Mountain Climbers', group: 'Core · Cardio', icon: '⛰️' },
  { id: 'invrow', name: 'Tirage horizontal', group: 'Dos', icon: '🪢' },
];

const exById = (id: Exercise['id']) =>
  exercises.find((e) => e.id === id) ?? exercises[0];

function buildModel(
  id: string,
  name: string,
  subtitle: string,
  color: string,
  blocks: Array<{
    exerciseId: Exercise['id'];
    sets: number;
    goalType: 'fixed' | 'max';
    goalValue: number;
    rest: number;
  }>,
): SessionModel {
  return {
    id,
    name,
    subtitle,
    color,
    exercises: blocks.map((b, i) => ({
      id: i,
      session_model_id: 0,
      exercise_id: b.exerciseId,
      sets_count: b.sets,
      goal_type: b.goalType,
      goal_value: b.goalType === 'max' ? null : b.goalValue,
      rest_time: b.rest,
      order: i,
      exercise: exById(b.exerciseId),
    })),
  };
}

const models: SessionModel[] = [
  buildModel('m-push', 'Push Day', 'Pecs · Épaules · Triceps', '#7C3AED', [
    { exerciseId: 'pushup', sets: 4, goalType: 'fixed', goalValue: 15, rest: 75 },
    { exerciseId: 'dip', sets: 4, goalType: 'fixed', goalValue: 10, rest: 90 },
    { exerciseId: 'pikepush', sets: 3, goalType: 'fixed', goalValue: 10, rest: 75 },
    { exerciseId: 'pushup', sets: 2, goalType: 'max', goalValue: 0, rest: 60 },
  ]),
  buildModel('m-pull', 'Pull Day', 'Dos · Biceps', '#8B5CF6', [
    { exerciseId: 'pullup', sets: 5, goalType: 'fixed', goalValue: 8, rest: 120 },
    { exerciseId: 'invrow', sets: 4, goalType: 'fixed', goalValue: 12, rest: 75 },
    { exerciseId: 'pullup', sets: 2, goalType: 'max', goalValue: 0, rest: 90 },
  ]),
  buildModel('m-legs', 'Leg Day', 'Jambes · Fessiers', '#A78BFA', [
    { exerciseId: 'squat', sets: 4, goalType: 'fixed', goalValue: 25, rest: 90 },
    { exerciseId: 'lunge', sets: 3, goalType: 'fixed', goalValue: 20, rest: 75 },
    { exerciseId: 'squat', sets: 1, goalType: 'max', goalValue: 0, rest: 60 },
  ]),
  buildModel('m-core', 'Core & Cardio', 'Abdos · Stabilité', '#6D28D9', [
    { exerciseId: 'plank', sets: 3, goalType: 'fixed', goalValue: 60, rest: 60 },
    { exerciseId: 'situp', sets: 4, goalType: 'fixed', goalValue: 20, rest: 60 },
    { exerciseId: 'mountain', sets: 3, goalType: 'fixed', goalValue: 30, rest: 45 },
    { exerciseId: 'burpee', sets: 3, goalType: 'max', goalValue: 0, rest: 60 },
  ]),
];

const today = new Date('2026-04-27T08:00:00');
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

interface RawLog {
  id: string;
  modelId: string;
  completedAt: string;
  duration: number;
  performance: Array<{
    exerciseId: Exercise['id'];
    sets: number[];
  }>;
}

const rawHistory: RawLog[] = [
  { id: 'l1', modelId: 'm-push', completedAt: daysAgo(2), duration: 38, performance: [
    { exerciseId: 'pushup', sets: [16, 15, 15, 14, 22] },
    { exerciseId: 'dip', sets: [11, 10, 10, 9] },
    { exerciseId: 'pikepush', sets: [10, 10, 9] },
  ]},
  { id: 'l2', modelId: 'm-pull', completedAt: daysAgo(4), duration: 42, performance: [
    { exerciseId: 'pullup', sets: [9, 8, 8, 7, 7, 12] },
    { exerciseId: 'invrow', sets: [12, 12, 11, 11] },
  ]},
  { id: 'l3', modelId: 'm-legs', completedAt: daysAgo(6), duration: 31, performance: [
    { exerciseId: 'squat', sets: [25, 25, 24, 22, 38] },
    { exerciseId: 'lunge', sets: [20, 18, 18] },
  ]},
  { id: 'l4', modelId: 'm-core', completedAt: daysAgo(7), duration: 25, performance: [
    { exerciseId: 'plank', sets: [60, 60, 55] },
    { exerciseId: 'situp', sets: [22, 20, 20, 18] },
  ]},
  { id: 'l5', modelId: 'm-push', completedAt: daysAgo(10), duration: 36, performance: [
    { exerciseId: 'pushup', sets: [15, 14, 14, 13, 20] },
    { exerciseId: 'dip', sets: [10, 10, 9, 9] },
  ]},
  { id: 'l6', modelId: 'm-pull', completedAt: daysAgo(12), duration: 40, performance: [
    { exerciseId: 'pullup', sets: [8, 8, 7, 7, 6, 11] },
  ]},
  { id: 'l7', modelId: 'm-push', completedAt: daysAgo(17), duration: 35, performance: [
    { exerciseId: 'pushup', sets: [14, 13, 13, 12, 19] },
  ]},
  { id: 'l8', modelId: 'm-pull', completedAt: daysAgo(19), duration: 39, performance: [
    { exerciseId: 'pullup', sets: [8, 7, 7, 6, 6, 10] },
  ]},
  { id: 'l9', modelId: 'm-push', completedAt: daysAgo(24), duration: 34, performance: [
    { exerciseId: 'pushup', sets: [13, 12, 12, 11, 17] },
  ]},
  { id: 'l10', modelId: 'm-legs', completedAt: daysAgo(28), duration: 30, performance: [
    { exerciseId: 'squat', sets: [22, 22, 21, 20, 33] },
  ]},
];

// Mark PBs retroactively
const allByExercise: Record<string, number> = {};
const expanded = rawHistory.slice().reverse().map((log) => {
  const performance_logs: SessionLog['performance_logs'] = [];
  log.performance.forEach((p) => {
    const max = Math.max(...p.sets);
    const prev = allByExercise[String(p.exerciseId)] || 0;
    const pbIdx = max > prev ? p.sets.findIndex((r) => r === max) : -1;
    if (max > prev) allByExercise[String(p.exerciseId)] = max;
    p.sets.forEach((reps, i) => {
      performance_logs.push({
        id: performance_logs.length,
        session_log_id: 0,
        exercise_id: p.exerciseId,
        set_number: i + 1,
        reps_done: reps,
        is_pb: i === pbIdx,
      });
    });
  });
  const has_pb = performance_logs.some((pl) => pl.is_pb);
  const result: SessionLog = {
    id: log.id,
    user_id: 1,
    session_model_id: log.modelId,
    duration: log.duration * 60,
    completed_at: log.completedAt,
    synced_at: log.completedAt,
    has_pb,
    performance_logs,
  };
  return result;
}).reverse();

const history = expanded;

const personalBests = Object.entries(allByExercise).map(([exerciseId, reps]) => ({
  exerciseId,
  reps,
}));

const lastRepsByExercise: Record<string, number[]> = {};
history.forEach((log) => {
  const grouped: Record<string, number[]> = {};
  log.performance_logs.forEach((pl) => {
    const k = String(pl.exercise_id);
    if (!grouped[k]) grouped[k] = [];
    grouped[k][pl.set_number - 1] = pl.reps_done;
  });
  Object.entries(grouped).forEach(([k, sets]) => {
    if (!lastRepsByExercise[k]) lastRepsByExercise[k] = sets;
  });
});

export const MOCK = {
  exercises,
  models,
  history,
  personalBests,
  lastRepsByExercise,
  exerciseById: (id: Exercise['id']) =>
    exercises.find((e) => String(e.id) === String(id)) ?? null,
  modelById: (id: SessionModel['id']) =>
    models.find((m) => String(m.id) === String(id)) ?? null,
  pbFor: (id: Exercise['id']) =>
    personalBests.find((p) => p.exerciseId === String(id))?.reps ?? 0,
  lastRepsFor: (id: Exercise['id'], setIdx: number) => {
    const arr = lastRepsByExercise[String(id)];
    if (!arr) return null;
    return arr[setIdx] ?? arr[arr.length - 1];
  },
};
