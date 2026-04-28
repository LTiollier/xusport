# XuSport API

Base URL: `http://localhost:8000/api`  
Auth: `Authorization: Bearer {token}` *(all routes marked **auth**)*

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Get token |
| POST | `/logout` | ✓ | Revoke token |
| GET | `/user` | ✓ | Current user (basic) |

---

## Sync

**GET /sync** *(auth)* — All user data in one shot. Use on login to hydrate Dexie.

```json
{
  "exercises": Exercise[],
  "models":    SessionModel[],
  "history":   SessionLog[]
}
```

---

## Exercises *(auth, read-only)*

**GET /exercises** → `{data: Exercise[]}`  
**GET /exercises/{id}** → `{data: Exercise}`

```ts
Exercise = { id: number; name: string; group: string | null; icon: string | null }
```

---

## Models (Workout Models) *(auth)*

User's workout templates. Each has an ordered list of blocks (exercises).

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/models` | — | `{data: SessionModel[]}` |
| POST | `/models` | See below | 201 `{data: SessionModel}` |
| GET | `/models/{id}` | — | `{data: SessionModel}` |
| PUT | `/models/{id}` | Same, all optional | `{data: SessionModel}` |
| DELETE | `/models/{id}` | — | 204 |

**POST / PUT body:**
```json
{
  "name": "Push Day",
  "exercises": [
    {
      "exercise_id": 1,
      "sets_count":  3,
      "goal_type":   "fixed",
      "goal_value":  10,
      "rest_time":   60,
      "order":       0
    }
  ]
}
```
`goal_type`: `"fixed"` (target reps) | `"max"` (as many as possible, `goal_value` = null)  
`rest_time`: seconds  
PUT with `exercises` **replaces** the entire block list.

```ts
SessionModel = {
  id: number; name: string; user_id: number;
  exercises: SessionExercise[]
}
SessionExercise = {
  id: number; session_model_id: number; exercise_id: number;
  sets_count: number; goal_type: "fixed"|"max"; goal_value: number|null;
  rest_time: number; order: number;
  exercise: Exercise
}
```

---

## History (Session Logs) *(auth)*

Completed workout records. `is_pb` is **computed server-side** on POST.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/history` | — | `{data: SessionLog[]}` |
| POST | `/history` | See below | 201 `{data: SessionLog}` |
| GET | `/history/{id}` | — | `{data: SessionLog}` |
| PUT | `/history/{id}` | `{completed_at?, synced_at?}` | `{data: SessionLog}` |
| DELETE | `/history/{id}` | — | 204 |

**POST body:**
```json
{
  "session_model_id": 1,
  "duration": 3600,
  "completed_at": "2026-04-27T10:00:00Z",
  "synced_at":    "2026-04-27T10:05:00Z",
  "performance_logs": [
    { "exercise_id": 1, "set_number": 1, "reps_done": 12 },
    { "exercise_id": 1, "set_number": 2, "reps_done": 15 }
  ]
}
```
`synced_at` defaults to `now()` if omitted.  
`is_pb` = true when `reps_done` exceeds the user's all-time max for that exercise.

```ts
SessionLog = {
  id: number; user_id: number; session_model_id: number;
  duration: number | null;
  completed_at: string|null; synced_at: string|null;
  has_pb: boolean;
  performance_logs: PerformanceLog[]
}
PerformanceLog = {
  id: number; session_log_id: number; exercise_id: number;
  set_number: number; reps_done: number; is_pb: boolean
}
```

---

## Stats *(auth)*

**GET /api/stats/dashboard**  
Returns a summary for the home screen.

```json
{
  "streak": 5,
  "pb_count": 12,
  "weekly_count": 3,
  "last_model": { ...SessionModel }
}
```

**GET /api/stats/progression/{exercise_id}**  
Returns data for the progression chart.

```json
[
  { "date": "2026-04-20", "max_reps": 10 },
  { "date": "2026-04-22", "max_reps": 12 }
]
```

---

## Profile & Settings *(auth)*

**GET /api/user/profile**  
Returns athlete info and global stats.

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "total_reps": 1500,
  "total_sessions": 45,
  "settings": {
    "sound": true,
    "vibrate": true,
    "demo_mode": false
  }
}
```

**PUT /api/user/settings**  
Updates user preferences.

```json
{
  "sound": true,
  "vibrate": true,
  "demo_mode": false
}
```

---

## Errors

| Code | Meaning |
|------|---------|
| 401 | Missing / invalid token |
| 403 | Resource belongs to another user |
| 404 | Resource not found |
| 422 | Validation failed — `{errors: {field: string[]}}` |
