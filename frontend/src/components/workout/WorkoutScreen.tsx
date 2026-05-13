'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Btn } from '@/components/ui/primitives';
import { Icon, resolveIconName } from '@/components/ui/Icon';
import { fmtTime } from '@/lib/format';
import { find } from '@/lib/store';
import type {
  Exercise,
  FlatSet,
  SessionLog,
  SessionModel,
  SetResult,
  WorkoutSummary,
} from '@/lib/types';

export type WorkoutVariant = 'A' | 'B';

interface WorkoutSettings {
  sound: boolean;
  vibrate: boolean;
  demo: boolean;
}

interface Props {
  model: SessionModel;
  exercises: Exercise[];
  history: SessionLog[];
  variant: WorkoutVariant;
  settings: WorkoutSettings;
  onComplete: (summary: WorkoutSummary) => void;
  onAbort: () => void;
}

function flattenSets(
  model: SessionModel,
  exercises: Exercise[],
): FlatSet[] {
  const sets: FlatSet[] = [];
  model.exercises.forEach((b, blockIdx) => {
    const ex =
      b.exercise ?? find.exerciseById(exercises, b.exercise_id) ?? null;
    for (let s = 0; s < b.sets_count; s++) {
      sets.push({
        blockIdx,
        setNumber: s + 1,
        totalSets: b.sets_count,
        exerciseId: b.exercise_id,
        goalType: b.goal_type,
        goalValue: b.goal_value,
        rest: b.rest_time,
        exerciseName: ex?.name ?? 'Exercice',
        exerciseGroup: ex?.group ?? null,
        exerciseIcon: ex?.icon ?? null,
      });
    }
  });
  return sets;
}

type Phase = 'exercise' | 'logReps' | 'rest';

export function WorkoutScreen({
  model,
  exercises,
  history,
  variant,
  settings,
  onComplete,
  onAbort,
}: Props) {
  const sets = React.useMemo(
    () => flattenSets(model, exercises),
    [model, exercises],
  );

  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>('exercise');
  const [restLeft, setRestLeft] = React.useState(0);
  const [restTotal, setRestTotal] = React.useState(0);
  const [results, setResults] = React.useState<SetResult[]>([]);
  const [reps, setReps] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [editingResultIdx, setEditingResultIdx] = React.useState<number | null>(
    null,
  );

  const cur = sets[idx];
  const isLast = idx === sets.length - 1;

  // Latest-value refs so the interval callback (captured at phase change)
  // can read the up-to-date reps and edit flag when the timer expires.
  const repsRef = React.useRef(reps);
  const editingResultIdxRef = React.useRef(editingResultIdx);
  React.useEffect(() => {
    repsRef.current = reps;
  }, [reps]);
  React.useEffect(() => {
    editingResultIdxRef.current = editingResultIdx;
  }, [editingResultIdx]);

  // Prefill default reps for logging UI
  React.useEffect(() => {
    if (!cur) return;
    if (editingResultIdx !== null) return;
    const last = find.lastRepsFor(history, cur.exerciseId, cur.setNumber - 1);
    if (last != null) {
      setReps(last);
    } else if (cur.goalType === 'fixed') {
      setReps(cur.goalValue ?? 0);
    } else {
      setReps(8);
    }
  }, [idx, cur, history, editingResultIdx]);

  // Total elapsed
  React.useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Keep the screen awake for the whole session (Screen Wake Lock API).
  // Browsers auto-release the lock when the tab is hidden, so we re-acquire
  // it on visibilitychange.
  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        // Ignored: page hidden, low battery, or unsupported context.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        acquire();
      }
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
    };
  }, []);

  // Rest countdown — runs during BOTH 'logReps' and 'rest' phases
  React.useEffect(() => {
    if (phase !== 'logReps' && phase !== 'rest') return;
    const tickMs = settings.demo ? 100 : 1000;
    const t = setInterval(() => {
      setRestLeft((r) => {
        if (r <= 1) {
          clearInterval(t);
          if (settings.vibrate && navigator.vibrate) {
            navigator.vibrate([120, 80, 120]);
          }
          setTimeout(() => onRestExpired(), 200);
          return 0;
        }
        return r - 1;
      });
    }, tickMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function markDone() {
    if (!cur) return;
    setRestTotal(cur.rest);
    setRestLeft(cur.rest);
    setPhase('logReps');
  }

  function logReps() {
    if (!cur) return;
    const pb = find.pbFor(history, cur.exerciseId);
    const isPb = pb > 0 ? reps > pb : reps > 0;

    if (editingResultIdx !== null) {
      setResults((prev) =>
        prev.map((r, i) =>
          i === editingResultIdx ? { ...r, reps, isPb } : r,
        ),
      );
      setEditingResultIdx(null);
      setPhase('rest');
      return;
    }

    const newResults: SetResult[] = [
      ...results,
      {
        exerciseId: cur.exerciseId,
        setNumber: cur.setNumber,
        reps,
        isPb,
        blockIdx: cur.blockIdx,
      },
    ];
    setResults(newResults);
    if (isLast) {
      onComplete({ results: newResults, duration: elapsed });
      return;
    }
    setPhase('rest');
  }

  function startEditLast() {
    if (results.length === 0) return;
    const lastIdx = results.length - 1;
    setEditingResultIdx(lastIdx);
    setReps(results[lastIdx].reps);
    setPhase('logReps');
  }

  function onRestExpired() {
    const editedIdx = editingResultIdxRef.current;
    if (editedIdx !== null && cur) {
      const editedReps = repsRef.current;
      const pb = find.pbFor(history, cur.exerciseId);
      const isPb = pb > 0 ? editedReps > pb : editedReps > 0;
      setResults((prev) =>
        prev.map((r, i) =>
          i === editedIdx ? { ...r, reps: editedReps, isPb } : r,
        ),
      );
      setEditingResultIdx(null);
    }
    goNext();
  }

  function goNext() {
    setIdx((i) => i + 1);
    setPhase('exercise');
  }

  function skipRest() {
    setRestLeft(0);
    if (settings.vibrate && navigator.vibrate) navigator.vibrate(60);
    setTimeout(() => goNext(), 100);
  }

  if (!cur) return null;

  const totalSetsInBlock = cur.totalSets;
  const completedInBlock = results.filter(
    (r) => r.blockIdx === cur.blockIdx,
  ).length;
  const overallProgress =
    (idx + (phase !== 'exercise' ? 1 : 0)) / sets.length;
  const next = sets[idx + 1];

  const bg =
    phase !== 'exercise'
      ? 'radial-gradient(ellipse at top, rgba(124,58,237,0.18), transparent 60%), #0B0F1E'
      : 'radial-gradient(ellipse at top, rgba(124,58,237,0.10), transparent 65%), #0F172A';

  const lastResult = results[results.length - 1];
  const pb = find.pbFor(history, cur.exerciseId);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          padding: '0 20px',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onAbort}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            border: `1px solid ${XS.hairline}`,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(10px)',
            color: XS.fg1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 4,
              background: XS.bg3,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${overallProgress * 100}%`,
                background: `linear-gradient(90deg, ${XS.v2}, ${XS.v3})`,
                transition: 'width 350ms ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontFamily: XS.mono,
                fontSize: 10,
                color: XS.fg3,
                letterSpacing: 1.2,
              }}
            >
              SET {idx + 1}/{sets.length}
            </span>
            {phase === 'logReps' ? (
              <span
                style={{
                  fontFamily: XS.mono,
                  fontSize: 10,
                  color: XS.v3,
                  letterSpacing: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                }}
              >
                ⏱ REPOS · {restLeft}s
              </span>
            ) : (
              <span
                style={{
                  fontFamily: XS.mono,
                  fontSize: 10,
                  color: XS.fg3,
                  letterSpacing: 1.2,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtTime(elapsed)}
              </span>
            )}
          </div>
        </div>
      </div>

      {phase === 'exercise' &&
        (variant === 'A' ? (
          <ExerciseViewA
            cur={cur}
            onDone={markDone}
            completedInBlock={completedInBlock}
            totalSetsInBlock={totalSetsInBlock}
            pb={pb}
          />
        ) : (
          <ExerciseViewB
            cur={cur}
            onDone={markDone}
            completedInBlock={completedInBlock}
            totalSetsInBlock={totalSetsInBlock}
            pb={pb}
          />
        ))}

      {phase === 'logReps' && (
        <LogRepsView
          cur={cur}
          reps={reps}
          setReps={setReps}
          onValidate={logReps}
          pb={pb}
          isLast={isLast}
          isEditing={editingResultIdx !== null}
        />
      )}

      {phase === 'rest' &&
        (variant === 'A' ? (
          <RestViewA
            left={restLeft}
            total={restTotal}
            onSkip={skipRest}
            onAdd={() => setRestLeft((r) => r + 15)}
            onEdit={startEditLast}
            next={next}
            lastReps={lastResult?.reps}
            lastIsPb={lastResult?.isPb}
          />
        ) : (
          <RestViewB
            left={restLeft}
            total={restTotal}
            onSkip={skipRest}
            onAdd={() => setRestLeft((r) => r + 15)}
            onEdit={startEditLast}
            next={next}
            lastReps={lastResult?.reps}
            lastIsPb={lastResult?.isPb}
          />
        ))}
    </div>
  );
}

interface ExerciseViewProps {
  cur: FlatSet;
  onDone: () => void;
  completedInBlock: number;
  totalSetsInBlock: number;
  pb: number;
}

function ExerciseViewA({
  cur,
  onDone,
  completedInBlock,
  totalSetsInBlock,
  pb,
}: ExerciseViewProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 28px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {Array.from({ length: totalSetsInBlock }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background:
                i < completedInBlock
                  ? XS.v2
                  : i === completedInBlock
                    ? XS.v3
                    : XS.bg4,
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: XS.v3,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Série {cur.setNumber}/{totalSetsInBlock}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: XS.font,
            fontSize: 48,
            fontWeight: 800,
            color: XS.fg0,
            letterSpacing: -1.5,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {cur.exerciseName}
        </h1>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            marginBottom: 48,
          }}
        >
          {cur.exerciseGroup ?? ''}
        </div>

        <div
          style={{
            padding: '32px 40px',
            borderRadius: 28,
            background: 'rgba(30,41,59,0.5)',
            border: `1px solid ${XS.hairline}`,
            backdropFilter: 'blur(10px)',
            minWidth: 220,
          }}
        >
          <div
            style={{
              fontFamily: XS.mono,
              fontSize: 10,
              color: XS.fg3,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Objectif
          </div>
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 96,
              fontWeight: 200,
              color: XS.fg0,
              letterSpacing: -3,
              lineHeight: 0.9,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {cur.goalType === 'fixed' ? cur.goalValue : 'MAX'}
          </div>
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 13,
              color: XS.fg2,
              marginTop: 6,
            }}
          >
            {cur.goalType === 'fixed' ? 'répétitions' : 'effort maximal'}
          </div>
        </div>

        {pb > 0 && (
          <div
            style={{
              marginTop: 24,
              padding: '6px 14px',
              borderRadius: 999,
              background: XS.pbSoft,
              border: `1px solid ${XS.pb}33`,
              fontFamily: XS.mono,
              fontSize: 11,
              color: XS.pb,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="trophy" size={12} /> Record · {pb} reps
          </div>
        )}
      </div>

      <Btn
        full
        kind="primary"
        onClick={onDone}
        style={{ height: 64, fontSize: 18 }}
      >
        <Icon name="check" size={20} stroke={2.4} /> Fait
      </Btn>
    </div>
  );
}

function ExerciseViewB({
  cur,
  onDone,
  completedInBlock,
  totalSetsInBlock,
  pb,
}: ExerciseViewProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 24px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: XS.v3,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {cur.exerciseName}
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 10 }}
        >
          {Array.from({ length: totalSetsInBlock }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: i < completedInBlock ? XS.v2 : 'transparent',
                border: `1.5px solid ${
                  i === completedInBlock
                    ? XS.v3
                    : i < completedInBlock
                      ? XS.v2
                      : XS.fg4
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {i < completedInBlock && (
                <Icon name="check" size={11} stroke={3} />
              )}
              {i === completedInBlock && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: XS.v3,
                    borderRadius: 3,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div style={{ position: 'relative', width: 260, height: 260 }}>
          <svg
            width="260"
            height="260"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="130"
              cy="130"
              r="120"
              stroke={XS.bg3}
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="130"
              cy="130"
              r="120"
              stroke={XS.v2}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="754"
              strokeDashoffset="0"
              style={{ filter: `drop-shadow(0 0 16px ${XS.vGlow})` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: XS.mono,
                fontSize: 10,
                color: XS.fg3,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Objectif
            </div>
            <div
              style={{
                fontFamily: XS.font,
                fontSize: cur.goalType === 'fixed' ? 110 : 64,
                fontWeight: cur.goalType === 'fixed' ? 200 : 800,
                color: XS.fg0,
                letterSpacing: -3,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {cur.goalType === 'fixed' ? cur.goalValue : 'MAX'}
            </div>
            <div
              style={{
                fontFamily: XS.font,
                fontSize: 13,
                color: XS.fg2,
                marginTop: 6,
              }}
            >
              {cur.goalType === 'fixed' ? 'répétitions' : 'effort'}
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          Série {cur.setNumber} sur {totalSetsInBlock}
          {pb > 0 && (
            <>
              {' '}
              · PB{' '}
              <span style={{ color: XS.pb, fontWeight: 600 }}>{pb}</span>
            </>
          )}
        </div>
      </div>

      <Btn
        full
        kind="primary"
        onClick={onDone}
        style={{ height: 64, fontSize: 18, borderRadius: 20 }}
      >
        <Icon name="check" size={20} stroke={2.6} /> FAIT
      </Btn>
    </div>
  );
}

function LogRepsView({
  cur,
  reps,
  setReps,
  onValidate,
  pb,
  isLast,
  isEditing,
}: {
  cur: FlatSet;
  reps: number;
  setReps: (n: number) => void;
  onValidate: () => void;
  pb: number;
  isLast: boolean;
  isEditing: boolean;
}) {
  const isPb = pb > 0 && reps > pb;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 28px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: XS.v3,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Combien de reps ?
        </div>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 22,
            fontWeight: 700,
            color: XS.fg0,
            marginBottom: 32,
          }}
        >
          {cur.exerciseName}
        </div>

        <div
          style={{
            fontFamily: XS.font,
            fontSize: 140,
            fontWeight: 800,
            color: isPb ? XS.pb : XS.fg0,
            letterSpacing: -5,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 200ms',
            textShadow: isPb
              ? '0 0 30px rgba(251,191,36,0.5)'
              : `0 0 30px ${XS.vGlow}`,
          }}
        >
          {reps}
        </div>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            marginTop: 4,
          }}
        >
          {cur.goalType === 'fixed'
            ? `cible ${cur.goalValue ?? 0}`
            : 'effort maximal'}
        </div>

        {isPb && (
          <div
            style={{
              marginTop: 16,
              padding: '4px 12px',
              borderRadius: 999,
              background: XS.pb,
              color: '#0F172A',
              fontFamily: XS.font,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
            }}
          >
            ★ NOUVEAU RECORD
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 36 }}>
          <button
            onClick={() => setReps(Math.max(0, reps - 1))}
            style={chunkyBtnStyle}
          >
            <Icon name="minus" size={28} stroke={2.5} />
          </button>
          <button onClick={() => setReps(reps + 1)} style={chunkyBtnStyle}>
            <Icon name="plus" size={28} stroke={2.5} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {[-5, -1, +1, +5].map((p) => (
            <button
              key={p}
              onClick={() => setReps(Math.max(0, reps + p))}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                background: XS.bg2,
                border: `1px solid ${XS.hairline}`,
                color: XS.fg2,
                fontFamily: XS.mono,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p > 0 ? `+${p}` : p}
            </button>
          ))}
        </div>
      </div>

      <Btn
        full
        kind="primary"
        onClick={onValidate}
        style={{ height: 60, fontSize: 17 }}
      >
        <Icon name="check" size={18} stroke={2.4} />{' '}
        {isEditing
          ? `Mettre à jour · ${reps} reps`
          : isLast
            ? 'Terminer la séance'
            : `Valider · ${reps} reps`}
      </Btn>
    </div>
  );
}

const chunkyBtnStyle: React.CSSProperties = {
  width: 78,
  height: 78,
  borderRadius: 28,
  background: XS.bg3,
  border: `1px solid ${XS.hairline}`,
  color: XS.fg0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

interface RestProps {
  left: number;
  total: number;
  onSkip: () => void;
  onAdd: () => void;
  onEdit: () => void;
  next?: FlatSet;
  lastReps?: number;
  lastIsPb?: boolean;
}

function RestViewA({
  left,
  total,
  onSkip,
  onAdd,
  onEdit,
  next,
  lastReps,
  lastIsPb,
}: RestProps) {
  const pct = total > 0 ? left / total : 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 28px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: XS.v3,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          ── Récupération ──
        </div>
        {lastReps != null && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: lastIsPb ? XS.pbSoft : XS.vSoft,
              border: `1px solid ${
                lastIsPb ? XS.pb + '44' : XS.v1 + '44'
              }`,
              color: lastIsPb ? XS.pb : XS.v3,
              fontFamily: XS.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              marginBottom: 24,
            }}
          >
            {lastIsPb && '★ '}
            {lastReps} reps validées
          </div>
        )}
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 180,
            fontWeight: 200,
            color: XS.fg0,
            letterSpacing: -8,
            lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 40px ${XS.vGlow}`,
          }}
        >
          {left}
        </div>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            marginTop: 8,
          }}
        >
          secondes
        </div>
        <div
          style={{
            width: '100%',
            maxWidth: 280,
            height: 4,
            background: XS.bg3,
            borderRadius: 2,
            marginTop: 36,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(1 - pct) * 100}%`,
              background: `linear-gradient(90deg, ${XS.v2}, ${XS.v3})`,
              transition: 'width 1s linear',
            }}
          />
        </div>
      </div>

      {next && (
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            marginBottom: 16,
            background: 'rgba(30,41,59,0.5)',
            border: `1px solid ${XS.hairline}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: XS.mono,
              fontSize: 9,
              color: XS.fg3,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            Suivant
          </div>
          <div
            style={{
              flex: 1,
              fontFamily: XS.font,
              fontSize: 15,
              fontWeight: 600,
              color: XS.fg0,
            }}
          >
            {next.exerciseName}
          </div>
          <div
            style={{ fontFamily: XS.mono, fontSize: 12, color: XS.fg2 }}
          >
            #{next.setNumber}/{next.totalSets}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {lastReps != null && (
          <Btn kind="ghost" onClick={onEdit} style={{ flex: 1 }}>
            <Icon name="edit" size={16} /> Modifier
          </Btn>
        )}
        <Btn kind="secondary" onClick={onAdd} style={{ flex: 1 }}>
          +15s
        </Btn>
        <Btn kind="primary" onClick={onSkip} style={{ flex: 2 }}>
          Passer le repos
        </Btn>
      </div>
    </div>
  );
}

function RestViewB({
  left,
  total,
  onSkip,
  onAdd,
  onEdit,
  next,
  lastReps,
  lastIsPb,
}: RestProps) {
  const SIZE = 280;
  const STROKE = 12;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const ratio = total > 0 ? left / total : 0;
  const dash = CIRC * ratio;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 24px 36px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: XS.v3,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Récupération
        </div>
        {lastReps != null && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: lastIsPb ? XS.pbSoft : XS.vSoft,
              border: `1px solid ${
                lastIsPb ? XS.pb + '44' : XS.v1 + '44'
              }`,
              color: lastIsPb ? XS.pb : XS.v3,
              fontFamily: XS.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              marginBottom: 18,
            }}
          >
            {lastIsPb && '★ '}
            {lastReps} reps validées
          </div>
        )}
        <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={XS.bg3}
              strokeWidth={STROKE}
              fill="none"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={XS.v2}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC}`}
              style={{
                transition: 'stroke-dasharray 1s linear',
                filter: `drop-shadow(0 0 16px ${XS.vGlow})`,
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: XS.font,
                fontSize: 110,
                fontWeight: 200,
                color: XS.fg0,
                letterSpacing: -4,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {left}
            </div>
            <div
              style={{
                fontFamily: XS.mono,
                fontSize: 11,
                color: XS.fg2,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              sec restantes
            </div>
          </div>
        </div>
      </div>

      {next && (
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            marginBottom: 16,
            background: 'rgba(30,41,59,0.6)',
            border: `1px solid ${XS.hairline}`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: XS.vSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            <Icon name={resolveIconName(next.exerciseIcon)} size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: XS.mono,
                fontSize: 9,
                color: XS.fg3,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Suivant
            </div>
            <div
              style={{
                fontFamily: XS.font,
                fontSize: 15,
                fontWeight: 600,
                color: XS.fg0,
                marginTop: 2,
              }}
            >
              {next.exerciseName} · #{next.setNumber}/{next.totalSets}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {lastReps != null && (
          <Btn kind="ghost" onClick={onEdit} style={{ flex: 1 }}>
            <Icon name="edit" size={16} /> Modifier
          </Btn>
        )}
        <Btn kind="secondary" onClick={onAdd} style={{ flex: 1 }}>
          +15s
        </Btn>
        <Btn kind="primary" onClick={onSkip} style={{ flex: 2 }}>
          <Icon name="arrowR" size={16} /> Passer
        </Btn>
      </div>
    </div>
  );
}
