// XuSport — Domain types (mirrors backend/API.md + design data needs)

export type GoalType = 'fixed' | 'max';

export interface Exercise {
  id: number | string;
  name: string;
  group: string | null;
  icon: string | null;
}

export interface SessionExercise {
  id: number;
  session_model_id: number;
  exercise_id: number | string;
  sets_count: number;
  goal_type: GoalType;
  goal_value: number | null;
  rest_time: number;
  order: number;
  exercise: Exercise;
}

export interface SessionModel {
  id: number | string;
  name: string;
  user_id?: number;
  // Design-only flavor (not in API but used in UI)
  subtitle?: string;
  color?: string;
  exercises: SessionExercise[];
}

export interface PerformanceLog {
  id: number;
  session_log_id: number;
  exercise_id: number | string;
  set_number: number;
  reps_done: number;
  is_pb: boolean;
}

export interface SessionLog {
  id: number | string;
  user_id: number;
  session_model_id: number | string;
  duration: number | null;
  completed_at: string | null;
  synced_at: string | null;
  has_pb: boolean;
  performance_logs: PerformanceLog[];
}

export interface DashboardStats {
  streak: number;
  pb_count: number;
  weekly_count: number;
  last_model: SessionModel | null;
}

export interface UserSettings {
  sound: boolean;
  vibrate: boolean;
  demo_mode: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  total_reps: number;
  total_sessions: number;
  settings: UserSettings;
}

export interface ProgressionPoint {
  date: string;
  max_reps: number;
}

export interface SyncBundle {
  exercises: Exercise[];
  models: SessionModel[];
  history: SessionLog[];
}

// Workout state types (UI-only)
export interface FlatSet {
  blockIdx: number;
  setNumber: number;
  totalSets: number;
  exerciseId: number | string;
  goalType: GoalType;
  goalValue: number | null;
  rest: number;
  exerciseName: string;
  exerciseGroup: string | null;
  exerciseIcon: string | null;
}

export interface SetResult {
  exerciseId: number | string;
  setNumber: number;
  reps: number;
  isPb: boolean;
  blockIdx: number;
}

export interface WorkoutSummary {
  duration: number;
  results: SetResult[];
}

// Builder draft block (UI-only)
export interface DraftBlock {
  exerciseId: number | string;
  sets: number;
  goalType: GoalType;
  goalValue: number;
  rest: number;
}
