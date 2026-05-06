'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Card, SectionHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { find } from '@/lib/store';
import type {
  DraftBlock,
  Exercise,
  GoalType,
  SessionModel,
} from '@/lib/types';

export interface BuilderDraft {
  name: string;
  subtitle: string;
  color: string;
  blocks: DraftBlock[];
}

interface Props {
  initial: SessionModel | null;
  exercises: Exercise[];
  onSave: (draft: BuilderDraft) => void;
  onCancel: () => void;
}

const COLORS = [
  XS.v1,
  XS.v2,
  XS.v3,
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
];

function toDraftBlocks(model: SessionModel | null): DraftBlock[] {
  if (!model) return [];
  return model.exercises.map((b) => ({
    exerciseId: b.exercise_id,
    sets: b.sets_count,
    goalType: b.goal_type,
    goalValue: b.goal_value ?? 0,
    rest: b.rest_time,
  }));
}

export function BuilderScreen({
  initial,
  exercises,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [subtitle, setSubtitle] = React.useState(initial?.subtitle ?? '');
  const [color, setColor] = React.useState(initial?.color ?? XS.v1);
  const [blocks, setBlocks] = React.useState<DraftBlock[]>(
    toDraftBlocks(initial),
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const addBlock = (exId: Exercise['id']) => {
    setBlocks([
      ...blocks,
      {
        exerciseId: exId,
        sets: 3,
        goalType: 'fixed',
        goalValue: 10,
        rest: 75,
      },
    ]);
    setPickerOpen(false);
  };
  const updateBlock = (i: number, patch: Partial<DraftBlock>) =>
    setBlocks(blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBlock = (i: number) =>
    setBlocks(blocks.filter((_, idx) => idx !== i));

  const canSave = name.trim().length > 0 && blocks.length > 0;

  return (
    <div>
      <div
        style={{
          padding: '56px 20px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: XS.fg2,
            fontFamily: XS.font,
            fontSize: 15,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          Annuler
        </button>
        <span
          style={{
            fontFamily: XS.font,
            fontSize: 15,
            fontWeight: 600,
            color: XS.fg0,
          }}
        >
          {initial ? 'Modifier' : 'Nouvelle séance'}
        </span>
        <button
          disabled={!canSave}
          onClick={() => onSave({ name, subtitle, color, blocks })}
          style={{
            background: 'none',
            border: 'none',
            color: canSave ? XS.v3 : XS.fg4,
            fontFamily: XS.font,
            fontSize: 15,
            fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
            padding: 4,
          }}
        >
          OK
        </button>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <BInput
          label="Nom"
          value={name}
          onChange={setName}
          placeholder="Ex. Push Day"
        />
        <BInput
          label="Sous-titre"
          value={subtitle}
          onChange={setSubtitle}
          placeholder="Ex. Pecs · Triceps"
        />
        <div style={{ marginBottom: 24 }}>
          <BLabel>Couleur</BLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border:
                    color === c
                      ? '2px solid #fff'
                      : '2px solid transparent',
                  background: c,
                  cursor: 'pointer',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <SectionHeader
        title={`Blocs (${blocks.length})`}
        action={
          <button
            onClick={() => setPickerOpen(true)}
            style={{
              background: XS.v1,
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '6px 12px',
              fontFamily: XS.font,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icon name="plus" size={14} /> Ajouter
          </button>
        }
      />
      <div style={{ padding: '0 20px 100px' }}>
        {blocks.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: XS.fg3,
              fontFamily: XS.font,
              fontSize: 13,
              border: `1.5px dashed ${XS.hairline}`,
              borderRadius: XS.r4,
            }}
          >
            Aucun bloc. Commence par ajouter un exercice.
          </div>
        )}
        {blocks.map((b, i) => {
          const ex = find.exerciseById(exercises, b.exerciseId);
          if (!ex) return null;
          return (
            <Card key={i} style={{ marginBottom: 10, padding: 14 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <Icon name="grip" size={18} color={XS.fg3} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 2,
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
                        fontWeight: 600,
                        color: XS.fg0,
                        fontSize: 15,
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
                      fontFamily: XS.mono,
                      fontSize: 10,
                      color: XS.fg3,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginTop: 2,
                    }}
                  >
                    {ex.group ?? ''}
                  </div>
                </div>
                <button onClick={() => removeBlock(i)} style={iconBtnStyle}>
                  <Icon name="trash" size={16} color={XS.fg3} />
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <Stepper
                  label="Séries"
                  value={b.sets}
                  onChange={(v) => updateBlock(i, { sets: v })}
                  min={1}
                  max={10}
                />
                {b.goalType === 'fixed' ? (
                  <Stepper
                    label="Reps"
                    value={b.goalValue}
                    onChange={(v) => updateBlock(i, { goalValue: v })}
                    min={1}
                    max={50}
                  />
                ) : (
                  <div
                    style={{
                      background: XS.bg2,
                      borderRadius: 12,
                      padding: 8,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: XS.mono,
                        fontSize: 9,
                        color: XS.pb,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      OBJECTIF
                    </div>
                    <div
                      style={{
                        fontFamily: XS.font,
                        fontSize: 16,
                        fontWeight: 700,
                        color: XS.pb,
                        marginTop: 4,
                      }}
                    >
                      MAX
                    </div>
                  </div>
                )}
                <Stepper
                  label="Repos"
                  value={b.rest}
                  onChange={(v) => updateBlock(i, { rest: v })}
                  min={15}
                  max={300}
                  step={15}
                  unit="s"
                />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button
                  onClick={() =>
                    updateBlock(i, { goalType: 'fixed' as GoalType })
                  }
                  style={chipStyle(b.goalType === 'fixed')}
                >
                  Reps fixes
                </button>
                <button
                  onClick={() =>
                    updateBlock(i, { goalType: 'max' as GoalType })
                  }
                  style={chipStyle(b.goalType === 'max')}
                >
                  MAX (AMRAP)
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises}
          onPick={addBlock}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function BLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: XS.mono,
        fontSize: 10,
        color: XS.fg3,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function BInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <BLabel>{label}</BLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 48,
          padding: '0 14px',
          borderRadius: 12,
          background: XS.bg3,
          border: `1px solid ${XS.hairline}`,
          color: XS.fg0,
          fontFamily: XS.font,
          fontSize: 15,
          fontWeight: 500,
          outline: 'none',
        }}
      />
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  unit = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div
      style={{
        background: XS.bg2,
        borderRadius: 12,
        padding: 8,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: XS.mono,
          fontSize: 9,
          color: XS.fg3,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
        }}
      >
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={stepBtnStyle}
        >
          <Icon name="minus" size={12} />
        </button>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 16,
            fontWeight: 700,
            color: XS.fg0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
          {unit}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={stepBtnStyle}
        >
          <Icon name="plus" size={12} />
        </button>
      </div>
    </div>
  );
}

const stepBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 8,
  border: 'none',
  background: XS.bg4,
  color: XS.fg1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${active ? XS.v1 : XS.hairline}`,
  background: active ? XS.vSoft : 'transparent',
  color: active ? XS.v3 : XS.fg2,
  fontFamily: XS.font,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
});

function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[];
  onPick: (id: Exercise['id']) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: 'rgba(11,16,32,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: XS.bg2,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '80%',
          overflow: 'auto',
          paddingBottom: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              background: XS.fg4,
              borderRadius: 2,
            }}
          />
        </div>
        <div style={{ padding: '4px 20px 16px' }}>
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 22,
              fontWeight: 700,
              color: XS.fg0,
              letterSpacing: -0.4,
            }}
          >
            Choisir un exercice
          </div>
        </div>
        <div style={{ padding: '0 20px' }}>
          {exercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => onPick(ex.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${XS.divider}`,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: XS.bg3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
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
                  size={20}
                  color={XS.fg1}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: XS.font,
                    fontSize: 15,
                    fontWeight: 600,
                    color: XS.fg0,
                  }}
                >
                  {ex.name}
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
                  {ex.group ?? ''}
                </div>
              </div>
              <Icon name="plus" size={18} color={XS.v3} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
