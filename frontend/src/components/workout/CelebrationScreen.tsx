'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Btn } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { fmtTime } from '@/lib/format';
import { find } from '@/lib/store';
import { Stat, Divider } from '@/components/screens/HomeScreen';
import type {
  Exercise,
  SessionModel,
  SetResult,
  WorkoutSummary,
} from '@/lib/types';

export type CelebrationVariant = 'A' | 'B';

interface Props {
  summary: WorkoutSummary;
  model: SessionModel;
  exercises: Exercise[];
  variant: CelebrationVariant;
  onDone: () => void;
}

export function CelebrationScreen({
  summary,
  model,
  exercises,
  variant,
  onDone,
}: Props) {
  const hasPb = summary.results.some((r) => r.isPb);
  const totalReps = summary.results.reduce((s, r) => s + r.reps, 0);
  const pbCount = summary.results.filter((r) => r.isPb).length;

  return variant === 'A' ? (
    <CelebrationA
      summary={summary}
      model={model}
      exercises={exercises}
      totalReps={totalReps}
      pbCount={pbCount}
      hasPb={hasPb}
      onDone={onDone}
    />
  ) : (
    <CelebrationB
      summary={summary}
      model={model}
      exercises={exercises}
      totalReps={totalReps}
      pbCount={pbCount}
      hasPb={hasPb}
      onDone={onDone}
    />
  );
}

interface InnerProps {
  summary: WorkoutSummary;
  model: SessionModel;
  exercises: Exercise[];
  totalReps: number;
  pbCount: number;
  hasPb: boolean;
  onDone: () => void;
}

function CelebrationA({
  summary,
  model,
  exercises,
  totalReps,
  pbCount,
  hasPb,
  onDone,
}: InnerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: hasPb
          ? 'radial-gradient(ellipse at top, rgba(251,191,36,0.18), rgba(15,23,42,1) 60%), #0B1020'
          : 'radial-gradient(ellipse at top, rgba(124,58,237,0.18), rgba(15,23,42,1) 60%), #0B1020',
      }}
    >
      {hasPb && <Confetti count={60} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 28px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: XS.mono,
            fontSize: 11,
            color: hasPb ? XS.pb : XS.v3,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {hasPb ? '★ Nouveau record' : 'Séance terminée'}
        </div>
        <div
          style={{
            marginTop: 28,
            animation: 'xs-rise 700ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        >
          {hasPb ? <Trophy /> : <CheckMedal />}
        </div>
        <h1
          style={{
            margin: '20px 0 4px',
            fontFamily: XS.font,
            fontSize: 32,
            fontWeight: 800,
            color: XS.fg0,
            letterSpacing: -0.8,
            textAlign: 'center',
          }}
        >
          {hasPb ? 'Bravo Léo' : 'Bien joué'}
        </h1>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          {model.name} · {fmtTime(summary.duration)}
        </div>
        <div
          style={{
            width: '100%',
            padding: 18,
            borderRadius: 20,
            marginBottom: 16,
            background: 'rgba(30,41,59,0.5)',
            border: `1px solid ${XS.hairline}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <Stat label="Reps" value={totalReps} accent={XS.fg0} />
            <Divider />
            <Stat
              label="Records"
              value={pbCount}
              accent={hasPb ? XS.pb : XS.fg2}
            />
            <Divider />
            <Stat
              label="Durée"
              value={Math.round(summary.duration / 60)}
              unit="min"
              accent={XS.fg0}
            />
          </div>
        </div>
        {hasPb && (
          <div style={{ width: '100%', flex: 1, overflow: 'auto' }}>
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
              Records battus
            </div>
            {summary.results
              .filter((r) => r.isPb)
              .map((r, i) => {
                const ex = find.exerciseById(exercises, r.exerciseId);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 14,
                      marginBottom: 8,
                      background: XS.pbSoft,
                      border: `1px solid ${XS.pb}33`,
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{ex?.icon ?? '🏆'}</div>
                    <div
                      style={{
                        flex: 1,
                        fontFamily: XS.font,
                        fontSize: 14,
                        fontWeight: 600,
                        color: XS.fg0,
                      }}
                    >
                      {ex?.name ?? 'Exercice'}
                    </div>
                    <div
                      style={{
                        fontFamily: XS.font,
                        fontSize: 22,
                        fontWeight: 800,
                        color: XS.pb,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {r.reps}
                    </div>
                    <Icon name="trophy" size={16} color={XS.pb} />
                  </div>
                );
              })}
          </div>
        )}
        <Btn
          full
          kind="primary"
          onClick={onDone}
          style={{ marginTop: 'auto', height: 56 }}
        >
          Terminer
        </Btn>
      </div>
    </div>
  );
}

function Trophy() {
  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'xs-rays 8s linear infinite',
        }}
      >
        <svg viewBox="0 0 180 180" width="180" height="180">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 90 + Math.cos(a) * 60;
            const y1 = 90 + Math.sin(a) * 60;
            const x2 = 90 + Math.cos(a) * 88;
            const y2 = 90 + Math.sin(a) * 88;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={XS.pb}
                strokeWidth="2"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'xs-pulse 2s ease-in-out infinite',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <path
            d="M 35 22 L 85 22 L 82 52 Q 78 70 60 72 Q 42 70 38 52 Z"
            fill="url(#goldGrad)"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          <path
            d="M 35 28 Q 22 30 22 42 Q 22 52 36 50"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 85 28 Q 98 30 98 42 Q 98 52 84 50"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <rect x="55" y="72" width="10" height="14" fill="#D97706" />
          <rect x="40" y="86" width="40" height="6" rx="2" fill="#FBBF24" />
          <rect x="36" y="92" width="48" height="8" rx="2" fill="#92400E" />
          <path
            d="M60 32 L62.5 39 L70 39.5 L64 44 L66 51 L60 47 L54 51 L56 44 L50 39.5 L57.5 39 Z"
            fill="#FFF"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}

function CheckMedal() {
  return (
    <div
      style={{
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${XS.v3}, ${XS.v0})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 60px ${XS.vGlow}, inset 0 2px 0 rgba(255,255,255,0.3)`,
        animation: 'xs-pulse 2s ease-in-out infinite',
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
    </div>
  );
}

interface ConfettiItem {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rot: number;
  shape: 'rect' | 'circle';
}

function Confetti({ count = 50 }: { count?: number }) {
  const colors = [XS.pb, XS.v2, XS.v3, '#10B981', '#FFF', '#F472B6'];
  const items: ConfettiItem[] = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1500,
        duration: 2200 + Math.random() * 1800,
        size: 6 + Math.random() * 8,
        color: colors[i % colors.length],
        rot: Math.random() * 360,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: `${it.left}%`,
            width: it.size,
            height: it.size * (it.shape === 'rect' ? 0.5 : 1),
            background: it.color,
            borderRadius: it.shape === 'circle' ? '50%' : 1,
            animation: `xs-fall ${it.duration}ms linear ${it.delay}ms infinite`,
            transform: `rotate(${it.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function CelebrationB({
  summary,
  model,
  exercises,
  totalReps,
  pbCount,
  hasPb,
  onDone,
}: InnerProps) {
  const groups = groupBy(summary.results, 'exerciseId');
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#06081A',
      }}
    >
      {hasPb && <Fireworks />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 35%, ${
            hasPb ? 'rgba(251,191,36,0.18)' : 'rgba(124,58,237,0.22)'
          }, transparent 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '76px 24px 32px',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            marginTop: 12,
            animation: 'xs-rise 700ms cubic-bezier(0.2, 0.9, 0.3, 1.2)',
          }}
        >
          <HoloMedal hasPb={hasPb} />
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: XS.mono,
            fontSize: 11,
            color: hasPb ? XS.pb : XS.v3,
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {hasPb
            ? `· ${pbCount} record${pbCount > 1 ? 's' : ''} ·`
            : '· Mission accomplie ·'}
        </div>
        <h1
          style={{
            margin: '6px 0 0',
            fontFamily: XS.font,
            fontSize: 38,
            fontWeight: 800,
            color: XS.fg0,
            letterSpacing: -1,
            textAlign: 'center',
            lineHeight: 1,
            whiteSpace: 'pre-line',
          }}
        >
          {hasPb ? 'PERSONAL\nBEST' : 'TERMINÉ'}
        </h1>
        <div
          style={{
            marginTop: 6,
            fontFamily: XS.font,
            fontSize: 13,
            color: XS.fg2,
            textAlign: 'center',
          }}
        >
          {model.name} · {fmtTime(summary.duration)} · {totalReps} reps
        </div>
        <div style={{ width: '100%', marginTop: 28, flex: 1, overflow: 'auto' }}>
          {Object.entries(groups).map(([exId, results]) => {
            const ex = find.exerciseById(exercises, exId);
            const bestPb = results.find((r) => r.isPb);
            const bestReps = Math.max(...results.map((r) => r.reps));
            return (
              <div
                key={exId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: `1px solid ${XS.divider}`,
                }}
              >
                <div style={{ fontSize: 22, opacity: bestPb ? 1 : 0.7 }}>
                  {ex?.icon ?? ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: XS.font,
                      fontSize: 14,
                      fontWeight: 600,
                      color: XS.fg0,
                    }}
                  >
                    {ex?.name ?? 'Exercice'}
                  </div>
                  <div
                    style={{
                      fontFamily: XS.mono,
                      fontSize: 11,
                      color: XS.fg3,
                      marginTop: 2,
                      letterSpacing: 0.5,
                    }}
                  >
                    {results.map((r) => r.reps).join(' · ')}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 22,
                    fontWeight: 800,
                    color: bestPb ? XS.pb : XS.fg0,
                    fontVariantNumeric: 'tabular-nums',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {bestReps}
                  {bestPb && <Icon name="trophy" size={14} color={XS.pb} />}
                </div>
              </div>
            );
          })}
        </div>
        <Btn full kind="primary" onClick={onDone} style={{ height: 56, marginTop: 12 }}>
          Continuer
        </Btn>
      </div>
    </div>
  );
}

function HoloMedal({ hasPb }: { hasPb: boolean }) {
  return (
    <div style={{ position: 'relative', width: 180, height: 200 }}>
      <svg
        width="180"
        height="200"
        viewBox="0 0 180 200"
        style={{ position: 'absolute', inset: 0 }}
      >
        <path d="M 60 0 L 76 16 L 90 70 L 90 70" fill={XS.v0} opacity="0.85" />
        <path d="M 120 0 L 104 16 L 90 70 L 90 70" fill={XS.v1} opacity="0.85" />
        <path d="M 56 0 L 60 0 L 76 16 L 72 18 Z" fill={XS.v2} />
        <path d="M 124 0 L 120 0 L 104 16 L 108 18 Z" fill={XS.v2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 60,
          transform: 'translateX(-50%)',
          width: 130,
          height: 130,
          borderRadius: '50%',
          background: hasPb
            ? 'conic-gradient(from 0deg, #FDE68A, #FBBF24, #D97706, #FBBF24, #FDE68A)'
            : `conic-gradient(from 0deg, ${XS.v3}, ${XS.v1}, ${XS.v0}, ${XS.v1}, ${XS.v3})`,
          backgroundSize: '200% 200%',
          animation:
            'xs-shimmer 4s linear infinite, xs-pulse 2.4s ease-in-out infinite',
          boxShadow: hasPb
            ? '0 0 50px rgba(251,191,36,0.6)'
            : `0 0 50px ${XS.vGlow}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: hasPb
              ? 'radial-gradient(circle at 35% 30%, #FEF3C7, #B45309)'
              : `radial-gradient(circle at 35% 30%, ${XS.v3}, ${XS.v0})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              'inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -10px 20px rgba(0,0,0,0.3)',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {hasPb ? (
              <path
                d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"
                fill="#fff"
              />
            ) : (
              <path d="M5 12l5 5L20 7" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

function Fireworks() {
  const bursts = React.useMemo(
    () =>
      Array.from({ length: 4 }).map(() => ({
        cx: 20 + Math.random() * 60,
        cy: 15 + Math.random() * 30,
        delay: Math.random() * 1800,
        color: [XS.pb, XS.v2, XS.v3, '#F472B6'][Math.floor(Math.random() * 4)],
      })),
    [],
  );
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {bursts.map((b, i) => (
        <Burst key={i} cx={b.cx} cy={b.cy} delay={b.delay} color={b.color} />
      ))}
    </div>
  );
}

function Burst({
  cx,
  cy,
  delay,
  color,
}: {
  cx: number;
  cy: number;
  delay: number;
  color: string;
}) {
  const particles = 16;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${cx}%`,
        top: `${cy}%`,
        width: 0,
        height: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          left: -12,
          top: -12,
          borderRadius: '50%',
          background: color,
          opacity: 0.6,
          filter: 'blur(4px)',
          animation: `xs-burst 1100ms ease-out ${delay}ms infinite`,
        }}
      />
      {Array.from({ length: particles }).map((_, i) => {
        const a = (i / particles) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        return (
          <div
            key={i}
            style={
              {
                position: 'absolute',
                width: 4,
                height: 4,
                left: -2,
                top: -2,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
                ['--dx' as string]: `${Math.cos(a) * dist}px`,
                ['--dy' as string]: `${Math.sin(a) * dist}px`,
                animation: `xs-firework 1300ms cubic-bezier(0.1, 0.6, 0.3, 1) ${delay}ms infinite`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function groupBy(
  arr: SetResult[],
  key: keyof SetResult,
): Record<string, SetResult[]> {
  return arr.reduce<Record<string, SetResult[]>>((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}
