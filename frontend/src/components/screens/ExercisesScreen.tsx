'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Card, ScreenHeader } from '@/components/ui/primitives';
import { Icon, resolveIconName } from '@/components/ui/Icon';
import type { Exercise } from '@/lib/types';

interface ExercisesScreenProps {
  exercises: Exercise[];
  onBack: () => void;
  onCreate: () => void;
  onEdit: (exercise: Exercise) => void;
}

export function ExercisesScreen({
  exercises,
  onBack,
  onCreate,
  onEdit,
}: ExercisesScreenProps) {
  return (
    <div>
      <ScreenHeader
        kicker="DONNÉES"
        title="Exercices"
        left={
          <button
            onClick={onBack}
            style={{
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
            }}
          >
            <Icon name="arrowL" size={20} />
          </button>
        }
        right={
          <button
            onClick={onCreate}
            style={{
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
            }}
          >
            <Icon name="plus" size={20} />
          </button>
        }
      />
      <div style={{ padding: '0 20px 120px' }}>
        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', color: XS.fg3, marginTop: 40, fontFamily: XS.font }}>
            Aucun exercice. Appuyez sur + pour en créer un.
          </div>
        )}
        
        {exercises.map((ex) => (
          <Card
            key={ex.id}
            onClick={() => onEdit(ex)}
            style={{ marginBottom: 12, padding: 0, overflow: 'hidden', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div
                style={{
                  flex: 1,
                  padding: '16px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: XS.bg4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: XS.fg1,
                    flexShrink: 0,
                  }}
                >
                  <Icon name={resolveIconName(ex.icon)} size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
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
                  {ex.group && (
                    <div
                      style={{
                        fontFamily: XS.font,
                        fontSize: 12,
                        color: XS.fg2,
                        marginTop: 2,
                      }}
                    >
                      {ex.group}
                    </div>
                  )}
                </div>
                <Icon name="chevR" size={16} color={XS.fg3} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
