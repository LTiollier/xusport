'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Card, ScreenHeader, SectionHeader } from '@/components/ui/primitives';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { Exercise } from '@/lib/types';

interface ExerciseBuilderScreenProps {
  initial?: Exercise | null;
  onSave: (payload: { name: string; group?: string | null; icon?: string | null }, id?: Exercise['id']) => Promise<void>;
  onDelete?: (id: Exercise['id']) => Promise<void>;
  onCancel: () => void;
}

const COMMON_ICONS: IconName[] = [
  'dumbbell', 'flame', 'bolt', 'trophy', 'medal', 'timer', 'grip', 'play', 'chart', 'user', 'list', 'check'
];

export function ExerciseBuilderScreen({
  initial,
  onSave,
  onDelete,
  onCancel,
}: ExerciseBuilderScreenProps) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [group, setGroup] = React.useState(initial?.group ?? '');
  const [icon, setIcon] = React.useState<IconName | ''>((initial?.icon as IconName) ?? '');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave(
        {
          name: name.trim(),
          group: group.trim() || null,
          icon: icon || null,
        },
        initial?.id
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial?.id || !onDelete) return;
    if (!confirm('Supprimer cet exercice ?')) return;
    setIsSaving(true);
    try {
      await onDelete(initial.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: XS.bg0,
        zIndex: 100,
        overflow: 'auto',
      }}
    >
      <ScreenHeader
        kicker="ÉDITEUR"
        title={initial ? 'Modifier' : 'Nouvel exercice'}
        left={
          <button
            onClick={onCancel}
            disabled={isSaving}
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
            <Icon name="x" size={20} />
          </button>
        }
        right={
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            style={{
              height: 40,
              padding: '0 16px',
              borderRadius: 14,
              border: 'none',
              background: name.trim() && !isSaving ? XS.v1 : XS.bg3,
              color: name.trim() && !isSaving ? '#fff' : XS.fg3,
              fontFamily: XS.font,
              fontWeight: 600,
              fontSize: 14,
              cursor: name.trim() && !isSaving ? 'pointer' : 'default',
            }}
          >
            {isSaving ? '...' : 'Enregistrer'}
          </button>
        }
      />

      <div style={{ padding: '0 20px 120px' }}>
        <SectionHeader title="Informations" />
        <Card style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${XS.divider}` }}>
            <label style={{ display: 'block', fontFamily: XS.font, fontSize: 12, color: XS.fg2, marginBottom: 6 }}>
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tractions, Pompes..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: XS.fg0,
                fontFamily: XS.font,
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${XS.divider}` }}>
            <label style={{ display: 'block', fontFamily: XS.font, fontSize: 12, color: XS.fg2, marginBottom: 6 }}>
              Groupe musculaire (optionnel)
            </label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Ex: Dos, Pectoraux..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: XS.fg0,
                fontFamily: XS.font,
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ padding: '12px 16px' }}>
            <label style={{ display: 'block', fontFamily: XS.font, fontSize: 12, color: XS.fg2, marginBottom: 6 }}>
              Icône (nom)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {COMMON_ICONS.map((ico) => (
                <div
                  key={ico}
                  onClick={() => setIcon(ico)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: icon === ico ? XS.vSoft : XS.bg4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: icon === ico ? XS.v3 : XS.fg1,
                    cursor: 'pointer',
                    border: icon === ico ? `1px solid ${XS.v3}` : `1px solid transparent`,
                  }}
                >
                  <Icon name={ico} size={20} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {initial && onDelete && (
          <div style={{ marginTop: 24 }}>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 14,
                border: 'none',
                background: 'rgba(239,68,68,0.12)',
                color: XS.danger,
                fontFamily: XS.font,
                fontWeight: 600,
                fontSize: 14,
                cursor: isSaving ? 'default' : 'pointer',
              }}
            >
              Supprimer l'exercice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
