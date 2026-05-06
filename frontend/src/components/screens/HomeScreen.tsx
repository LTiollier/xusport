'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import {
  Btn,
  Card,
  Pill,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { computeWeekActivity, fmtDate, fmtHeaderDate } from '@/lib/format';
import { find } from '@/lib/store';
import type { SessionLog, SessionModel } from '@/lib/types';

interface HomeScreenProps {
  models: SessionModel[];
  history: SessionLog[];
  pbCount: number;
  streak: number;
  onOpenModel: (id: SessionModel['id']) => void;
  onStart: (id: SessionModel['id']) => void;
}

export function HomeScreen({
  models,
  history,
  pbCount,
  streak,
  onStart,
}: HomeScreenProps) {
  const lastLog = history[0];
  const lastModel = lastLog
    ? find.modelById(models, lastLog.session_model_id)
    : models[0];
  const week = computeWeekActivity(history);

  if (!lastModel) return null;

  return (
    <div>
      <ScreenHeader
        kicker={fmtHeaderDate()}
        title="Bonjour Léo"
        right={
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: `linear-gradient(135deg, ${XS.v1}, ${XS.v0})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: XS.font,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            LX
          </div>
        }
      />

      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <Card
          style={{
            padding: 18,
            background: `linear-gradient(135deg, ${XS.bg3}, ${XS.bg4})`,
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
            <Stat label="Série" value={streak} unit="j" accent={XS.v3} />
            <Divider />
            <Stat label="Records" value={pbCount} unit="" accent={XS.pb} />
            <Divider />
            <Stat
              label="Cette sem."
              value={week.count}
              unit="séances"
              accent={XS.fg0}
            />
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {week.days.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div
                style={{
                  fontFamily: XS.mono,
                  fontSize: 10,
                  color: XS.fg3,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  margin: '0 auto',
                  borderRadius: 10,
                  background: d.active ? XS.v1 : XS.bg3,
                  border: d.today
                    ? `2px solid ${XS.v3}`
                    : `1px solid ${XS.hairline}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: d.active ? '#fff' : XS.fg3,
                  fontSize: 13,
                  fontFamily: XS.font,
                  fontWeight: 600,
                }}
              >
                {d.active ? (
                  <Icon name="check" size={14} stroke={2.6} />
                ) : (
                  d.date
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader title="Reprendre" />
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: 20,
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${
                lastModel.color || XS.v1
              }22, transparent 60%)`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: XS.mono,
                    fontSize: 10,
                    color: XS.v3,
                    letterSpacing: 1.4,
                    marginBottom: 6,
                  }}
                >
                  PROCHAINE SÉANCE
                </div>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 22,
                    fontWeight: 700,
                    color: XS.fg0,
                    letterSpacing: -0.4,
                  }}
                >
                  {lastModel.name}
                </div>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 13,
                    color: XS.fg2,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 220,
                  }}
                >
                  {lastModel.subtitle ?? '—'} · {lastModel.exercises.length}{' '}
                  blocs
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: lastModel.color || XS.v1,
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Icon name="dumbbell" size={28} />
              </div>
            </div>
            <Btn full kind="primary" onClick={() => onStart(lastModel.id)}>
              <Icon name="play" size={16} /> Démarrer
            </Btn>
          </div>
        </Card>
      </div>

      <SectionHeader title="Activité récente" />
      <div style={{ padding: '0 20px', marginBottom: 120 }}>
        {history.slice(0, 4).map((log) => {
          const m = find.modelById(models, log.session_model_id);
          if (!m) return null;
          const totalReps = log.performance_logs.reduce(
            (s, pl) => s + pl.reps_done,
            0,
          );
          const pbs = log.performance_logs.filter((pl) => pl.is_pb).length;
          const dur = log.duration ? Math.round(log.duration / 60) : 0;
          return (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${XS.divider}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 36,
                  borderRadius: 4,
                  background: m.color || XS.v1,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: XS.font,
                      fontSize: 15,
                      fontWeight: 600,
                      color: XS.fg0,
                    }}
                  >
                    {m.name}
                  </span>
                  {pbs > 0 && (
                    <Pill
                      color={XS.pb}
                      style={{ padding: '2px 8px', fontSize: 10 }}
                    >
                      +{pbs} PB
                    </Pill>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 12,
                    color: XS.fg2,
                    marginTop: 2,
                  }}
                >
                  {fmtDate(log.completed_at)} · {dur} min · {totalReps} reps
                </div>
              </div>
              <Icon name="chevR" size={18} color={XS.fg3} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  accent: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontFamily: XS.font,
          fontSize: 28,
          fontWeight: 700,
          color: accent,
          letterSpacing: -0.5,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 3,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 13, fontWeight: 500, color: XS.fg2 }}>
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: XS.mono,
          fontSize: 10,
          color: XS.fg3,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Divider() {
  return <div style={{ width: 1, height: 32, background: XS.hairline }} />;
}
