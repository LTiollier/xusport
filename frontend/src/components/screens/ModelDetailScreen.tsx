'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Btn, Pill, SectionHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { find } from '@/lib/store';
import type { Exercise, SessionModel } from '@/lib/types';

interface Props {
  model: SessionModel;
  exercises: Exercise[];
  onBack: () => void;
  onStart: (id: SessionModel['id']) => void;
  onEdit: () => void;
}

export function ModelDetailScreen({
  model,
  exercises,
  onBack,
  onStart,
  onEdit,
}: Props) {
  const totalSets = model.exercises.reduce((s, b) => s + b.sets_count, 0);
  const avgRest = model.exercises.length
    ? Math.round(
        model.exercises.reduce((s, b) => s + b.rest_time, 0) /
          model.exercises.length,
      )
    : 0;
  return (
    <div>
      <div
        style={{
          padding: '56px 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <button onClick={onBack} style={navBtnStyle}>
          <Icon name="arrowL" size={20} />
        </button>
        <button onClick={onEdit} style={navBtnStyle}>
          <Icon name="edit" size={18} />
        </button>
      </div>
      <div style={{ padding: '8px 20px 16px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: model.color || XS.v1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: 16,
          }}
        >
          <Icon name="dumbbell" size={28} />
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: XS.font,
            fontSize: 30,
            fontWeight: 700,
            color: XS.fg0,
            letterSpacing: -0.8,
          }}
        >
          {model.name}
        </h1>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: XS.fg2,
            marginTop: 4,
          }}
        >
          {model.subtitle ?? '—'}
        </div>

        <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
          <MiniStat label="Blocs" value={model.exercises.length} />
          <MiniStat label="Séries" value={totalSets} />
          <MiniStat label="Repos moy." value={`${avgRest}s`} />
        </div>
      </div>

      <SectionHeader title="Programme" />
      <div style={{ padding: '0 20px 140px' }}>
        {model.exercises.map((b, i) => {
          const ex = b.exercise ?? find.exerciseById(exercises, b.exercise_id);
          if (!ex) return null;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 4px',
                borderTop: i === 0 ? 'none' : `1px solid ${XS.divider}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  fontFamily: XS.mono,
                  fontSize: 11,
                  color: XS.fg3,
                  letterSpacing: 1,
                  paddingTop: 4,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: XS.bg4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: XS.fg1,
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      name={
                        [
                          'home',
                          'list',
                          'chart',
                          'user',
                          'play',
                          'pause',
                          'check',
                          'plus',
                          'minus',
                          'x',
                          'arrowL',
                          'arrowR',
                          'chevR',
                          'chevD',
                          'edit',
                          'trash',
                          'flame',
                          'bolt',
                          'trophy',
                          'medal',
                          'timer',
                          'dumbbell',
                          'grip',
                          'volume',
                          'vibrate',
                          'calendar',
                          'clock',
                          'replay',
                          'eye',
                          'eyeOff',
                          'mail',
                          'lock',
                        ].includes(ex.icon as string)
                          ? (ex.icon as any)
                          : 'dumbbell'
                      }
                      size={14}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: XS.font,
                      fontSize: 16,
                      fontWeight: 600,
                      color: XS.fg0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ex.name}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 12,
                    color: XS.fg2,
                    marginTop: 4,
                    display: 'flex',
                    gap: 10,
                  }}
                >
                  <span>
                    {b.sets_count} ×{' '}
                    {b.goal_type === 'fixed' ? `${b.goal_value ?? 0}` : 'MAX'}
                  </span>
                  <span style={{ color: XS.fg4 }}>·</span>
                  <span>Repos {b.rest_time}s</span>
                </div>
              </div>
              {b.goal_type === 'max' && <Pill color={XS.pb}>MAX</Pill>}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          padding: '16px 20px 36px',
          background:
            'linear-gradient(to top, rgba(15,23,42,0.98) 60%, rgba(15,23,42,0))',
        }}
      >
        <Btn
          full
          kind="primary"
          onClick={() => onStart(model.id)}
          style={{ height: 56 }}
        >
          <Icon name="play" size={16} /> Démarrer la séance
        </Btn>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: `1px solid ${XS.hairline}`,
  background: XS.bg3,
  color: XS.fg0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: XS.font,
          fontSize: 20,
          fontWeight: 700,
          color: XS.fg0,
          letterSpacing: -0.3,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: XS.mono,
          fontSize: 10,
          color: XS.fg3,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
