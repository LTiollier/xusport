'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Card, Pill, ScreenHeader, SectionHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { fmtDate } from '@/lib/format';
import { find } from '@/lib/store';
import { api } from '@/lib/api';
import type {
  Exercise,
  ProgressionPoint,
  SessionLog,
  SessionModel,
} from '@/lib/types';

interface Props {
  history: SessionLog[];
  models: SessionModel[];
  exercises: Exercise[];
}

const QUICK_EXERCISES = ['pushup', 'pullup', 'dip', 'squat', 'plank'];

export function HistoryScreen({ history, models, exercises }: Props) {
  const [selectedExId, setSelectedExId] = React.useState<Exercise['id']>(
    () => {
      const fromQuick = exercises.find((e) =>
        QUICK_EXERCISES.includes(String(e.id)),
      );
      return fromQuick?.id ?? exercises[0]?.id ?? 'pushup';
    },
  );

  const [remoteSeries, setRemoteSeries] = React.useState<
    ProgressionPoint[] | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;
    setRemoteSeries(null);
    api
      .progression(selectedExId)
      .then((points) => {
        if (!cancelled) setRemoteSeries(points);
      })
      .catch(() => {
        if (!cancelled) setRemoteSeries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedExId]);

  const series = React.useMemo(() => {
    if (remoteSeries && remoteSeries.length > 0) {
      const pbValue = find.pbFor(history, selectedExId);
      return remoteSeries.map((p) => ({
        date: p.date,
        max: p.max_reps,
        isPb: p.max_reps === pbValue,
      }));
    }
    const sorted = [...history].sort((a, b) => {
      const da = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const db = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return da - db;
    });
    return sorted
      .map((log) => {
        const sets = log.performance_logs.filter(
          (pl) => String(pl.exercise_id) === String(selectedExId),
        );
        if (sets.length === 0) return null;
        const max = Math.max(...sets.map((s) => s.reps_done));
        const isPb = sets.some((s) => s.is_pb);
        return { date: log.completed_at, max, isPb };
      })
      .filter((p): p is { date: string | null; max: number; isPb: boolean } =>
        p !== null,
      );
  }, [history, remoteSeries, selectedExId]);

  const pb = find.pbFor(history, selectedExId);
  const quickList = exercises.filter((e) =>
    QUICK_EXERCISES.includes(String(e.id)),
  );

  return (
    <div>
      <ScreenHeader kicker="PROGRESSION" title="Historique" />

      <div
        style={{
          padding: '0 20px 8px',
          overflowX: 'auto',
          display: 'flex',
          gap: 8,
        }}
      >
        {(quickList.length > 0 ? quickList : exercises.slice(0, 5)).map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedExId(e.id)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${
                selectedExId === e.id ? XS.v1 : XS.hairline
              }`,
              background: selectedExId === e.id ? XS.vSoft : XS.bg3,
              color: selectedExId === e.id ? XS.v3 : XS.fg1,
              fontFamily: XS.font,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <Card style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: XS.mono,
                  fontSize: 10,
                  color: XS.fg3,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                Record actuel
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: XS.font,
                    fontSize: 36,
                    fontWeight: 700,
                    color: XS.fg0,
                    letterSpacing: -1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {pb}
                </span>
                <span
                  style={{
                    fontFamily: XS.font,
                    fontSize: 14,
                    color: XS.fg2,
                  }}
                >
                  reps
                </span>
              </div>
            </div>
            <Pill color={XS.pb}>
              <Icon name="trophy" size={12} /> PB
            </Pill>
          </div>
          <Chart series={series} />
        </Card>
      </div>

      <div style={{ marginTop: 28 }}>
        <SectionHeader title="Séances récentes" />
      </div>
      <div style={{ padding: '0 20px 120px' }}>
        {history.map((log) => {
          const m = find.modelById(models, log.session_model_id);
          if (!m) return null;
          const sets = log.performance_logs.filter(
            (pl) => String(pl.exercise_id) === String(selectedExId),
          );
          if (sets.length === 0) return null;
          const max = Math.max(...sets.map((s) => s.reps_done));
          const hasPb = sets.some((s) => s.is_pb);
          return (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderBottom: `1px solid ${XS.divider}`,
              }}
            >
              <div
                style={{
                  width: 64,
                  fontFamily: XS.mono,
                  fontSize: 11,
                  color: XS.fg3,
                }}
              >
                {fmtDate(log.completed_at)}
              </div>
              <div
                style={{
                  flex: 1,
                  fontFamily: XS.font,
                  fontSize: 13,
                  color: XS.fg2,
                }}
              >
                {m.name} ·{' '}
                {sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => s.reps_done)
                  .join(' / ')}
              </div>
              <div
                style={{
                  fontFamily: XS.font,
                  fontSize: 17,
                  fontWeight: 700,
                  color: hasPb ? XS.pb : XS.fg0,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {max}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chart({
  series,
}: {
  series: Array<{ date: string | null; max: number; isPb: boolean }>;
}) {
  const W = 320;
  const H = 130;
  const P = 12;
  if (series.length < 2) {
    return (
      <div
        style={{
          height: H,
          color: XS.fg3,
          fontFamily: XS.font,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Pas assez de données
      </div>
    );
  }
  const max = Math.max(...series.map((s) => s.max));
  const min = Math.min(...series.map((s) => s.max));
  const range = Math.max(1, max - min);
  const xs = series.map(
    (_, i) => P + (i / (series.length - 1)) * (W - 2 * P),
  );
  const ys = series.map(
    (s) => H - P - ((s.max - min) / range) * (H - 2 * P - 8),
  );
  const path = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(' ');
  const area = `${path} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
    >
      <defs>
        <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={XS.v2} stopOpacity="0.4" />
          <stop offset="100%" stopColor={XS.v2} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#gFill)" />
      <path
        d={path}
        stroke={XS.v3}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {series.map((s, i) => (
        <g key={i}>
          <circle
            cx={xs[i]}
            cy={ys[i]}
            r={s.isPb ? 5 : 3}
            fill={s.isPb ? XS.pb : XS.v3}
            stroke={XS.bg3}
            strokeWidth="2"
          />
          {s.isPb && (
            <circle
              cx={xs[i]}
              cy={ys[i]}
              r="9"
              fill="none"
              stroke={XS.pb}
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
