'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Card, Pill, ScreenHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import type { SessionModel } from '@/lib/types';

interface ModelsScreenProps {
  models: SessionModel[];
  onOpenModel: (id: SessionModel['id']) => void;
  onCreate: () => void;
  onStart: (id: SessionModel['id']) => void;
}

export function ModelsScreen({
  models,
  onOpenModel,
  onCreate,
  onStart,
}: ModelsScreenProps) {
  return (
    <div>
      <ScreenHeader
        kicker="BIBLIOTHÈQUE"
        title="Mes séances"
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
        {models.map((m) => {
          const totalSets = m.exercises.reduce(
            (s, b) => s + (b.sets_count || 0),
            0,
          );
          const totalRest = m.exercises.reduce(
            (s, b) => s + (b.sets_count || 0) * (b.rest_time || 0),
            0,
          );
          return (
            <Card
              key={m.id}
              onClick={() => onOpenModel(m.id)}
              style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: 6, background: m.color || XS.v1 }} />
                <div
                  style={{
                    flex: 1,
                    padding: '16px 16px 16px 14px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: XS.font,
                          fontSize: 17,
                          fontWeight: 700,
                          color: XS.fg0,
                          letterSpacing: -0.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontFamily: XS.font,
                          fontSize: 12,
                          color: XS.fg2,
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {m.subtitle ?? '—'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStart(m.id);
                      }}
                      style={{
                        flexShrink: 0,
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: 'none',
                        background: XS.v1,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 14px ${XS.vGlow}`,
                      }}
                    >
                      <Icon name="play" size={14} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginTop: 12,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <Pill
                      style={{
                        background: XS.bg4,
                        border: `1px solid ${XS.hairline}`,
                        color: XS.fg1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.exercises.length} blocs
                    </Pill>
                    <Pill
                      style={{
                        background: XS.bg4,
                        border: `1px solid ${XS.hairline}`,
                        color: XS.fg1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {totalSets} séries
                    </Pill>
                    <Pill
                      style={{
                        background: XS.bg4,
                        border: `1px solid ${XS.hairline}`,
                        color: XS.fg1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ~{Math.round(totalRest / 60 + m.exercises.length * 1.5)}{' '}
                      min
                    </Pill>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        <button
          onClick={onCreate}
          style={{
            width: '100%',
            padding: 18,
            borderRadius: XS.r4,
            border: `1.5px dashed ${XS.hairline}`,
            background: 'transparent',
            color: XS.fg2,
            fontFamily: XS.font,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="plus" size={18} /> Nouvelle séance
        </button>
      </div>
    </div>
  );
}
