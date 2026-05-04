'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import {
  Card,
  ScreenHeader,
  SectionHeader,
  Spacer,
} from '@/components/ui/primitives';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MiniStat } from './ModelDetailScreen';
import type { SessionLog, UserProfile, UserSettings } from '@/lib/types';

interface Props {
  profile: UserProfile;
  history: SessionLog[];
  pbCount: number;
  settings: UserSettings;
  onSettings: (s: UserSettings) => void;
  onLogout?: () => void;
  onSyncNow?: () => void;
  lastSyncAt?: number | null;
  pendingCount?: number;
  syncing?: boolean;
}

export function ProfileScreen({
  profile,
  history,
  pbCount,
  settings,
  onSettings,
  onLogout,
  onSyncNow,
  lastSyncAt,
  pendingCount = 0,
  syncing = false,
}: Props) {
  const totalReps =
    profile.total_reps ||
    history.reduce(
      (sum, log) =>
        sum + log.performance_logs.reduce((s, pl) => s + pl.reps_done, 0),
      0,
    );
  const totalSessions = profile.total_sessions || history.length;

  return (
    <div>
      <ScreenHeader kicker="ATHLÈTE" title={profile.name} />
      <div style={{ padding: '0 20px' }}>
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                background: `linear-gradient(135deg, ${XS.v1}, ${XS.v0})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: XS.font,
                fontWeight: 700,
                fontSize: 22,
              }}
            >
              {initials(profile.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: XS.font,
                  fontSize: 18,
                  fontWeight: 700,
                  color: XS.fg0,
                }}
              >
                {profile.name}
              </div>
              <div
                style={{
                  fontFamily: XS.font,
                  fontSize: 12,
                  color: XS.fg2,
                  marginTop: 2,
                }}
              >
                {profile.email}
              </div>
              <div
                style={{
                  fontFamily: XS.mono,
                  fontSize: 10,
                  color: XS.v3,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginTop: 6,
                }}
              >
                Membre depuis sept. 2025
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              marginTop: 18,
            }}
          >
            <MiniStat label="Séances" value={totalSessions} />
            <MiniStat
              label="Reps totales"
              value={totalReps.toLocaleString('fr-FR')}
            />
            <MiniStat label="Records" value={pbCount} />
          </div>
        </Card>
      </div>

      <SectionHeader title="Préférences" />
      <div style={{ padding: '0 20px 120px' }}>
        <Card style={{ padding: 0 }}>
          <SettingRow
            icon="volume"
            label="Sons (fin de repos)"
            value={settings.sound}
            onToggle={() =>
              onSettings({ ...settings, sound: !settings.sound })
            }
          />
          <SettingRow
            icon="vibrate"
            label="Vibrations"
            value={settings.vibrate}
            onToggle={() =>
              onSettings({ ...settings, vibrate: !settings.vibrate })
            }
          />
          <SettingRow
            icon="bolt"
            label="Mode démo (timer accéléré)"
            value={settings.demo_mode}
            onToggle={() =>
              onSettings({ ...settings, demo_mode: !settings.demo_mode })
            }
            last
          />
        </Card>
        <Spacer h={16} />
        <Card style={{ padding: 0 }}>
          <RowLink
            icon="replay"
            label={syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
            detail={syncDetail(lastSyncAt, pendingCount, syncing)}
            onClick={syncing ? undefined : onSyncNow}
          />
          {onLogout && (
            <RowLink
              icon="x"
              label="Se déconnecter"
              danger
              last
              onClick={onLogout}
            />
          )}
          {!onLogout && (
            <RowLink
              icon="trash"
              label="Effacer les données locales"
              danger
              last
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function syncDetail(
  lastSyncAt: number | null | undefined,
  pendingCount: number,
  syncing: boolean,
): string {
  if (syncing) return 'En cours…';
  const parts: string[] = [];
  if (lastSyncAt) {
    const ago = Date.now() - lastSyncAt;
    parts.push(`Dernière sync · ${formatAgo(ago)}`);
  } else {
    parts.push('Jamais synchronisé');
  }
  if (pendingCount > 0) {
    parts.push(
      `${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente`,
    );
  }
  return parts.join(' · ');
}

function formatAgo(ms: number): string {
  if (ms < 60_000) return 'à l’instant';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function SettingRow({
  icon,
  label,
  value,
  onToggle,
  last,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onToggle: () => void;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${XS.divider}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: XS.vSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: XS.v3,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: XS.font,
          fontSize: 14,
          color: XS.fg0,
        }}
      >
        {label}
      </div>
      <button
        onClick={onToggle}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          background: value ? XS.v1 : XS.bg4,
          position: 'relative',
          transition: 'background 150ms',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: value ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: '#fff',
            transition: 'left 150ms',
          }}
        />
      </button>
    </div>
  );
}

function RowLink({
  icon,
  label,
  detail,
  danger,
  last,
  onClick,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        borderBottom: last ? 'none' : `1px solid ${XS.divider}`,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: danger ? 'rgba(239,68,68,0.12)' : XS.bg4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger ? XS.danger : XS.fg2,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: XS.font,
            fontSize: 14,
            color: danger ? XS.danger : XS.fg0,
          }}
        >
          {label}
        </div>
        {detail && (
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 11,
              color: XS.fg3,
              marginTop: 2,
            }}
          >
            {detail}
          </div>
        )}
      </div>
      <Icon name="chevR" size={16} color={XS.fg3} />
    </div>
  );
}
