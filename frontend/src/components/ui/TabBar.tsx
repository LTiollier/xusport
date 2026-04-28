'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Icon, type IconName } from './Icon';

export type TabId = 'home' | 'models' | 'history' | 'profile';

const ITEMS: Array<{ id: TabId; icon: IconName; label: string }> = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'models', icon: 'list', label: 'Séances' },
  { id: 'history', icon: 'chart', label: 'Historique' },
  { id: 'profile', icon: 'user', label: 'Profil' },
];

export function TabBar({
  tab,
  onTab,
  onStart,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        paddingTop: 10,
        background:
          'linear-gradient(to top, rgba(15,23,42,0.96) 60%, rgba(15,23,42,0))',
      }}
    >
      <div
        style={{
          margin: '0 14px',
          height: 64,
          borderRadius: 26,
          background: 'rgba(30,41,59,0.85)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${XS.hairline}`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 80px 1fr 1fr',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {ITEMS.slice(0, 2).map((it) => (
          <TabBtn
            key={it.id}
            icon={it.icon}
            label={it.label}
            active={tab === it.id}
            onClick={() => onTab(it.id)}
          />
        ))}
        <div />
        {ITEMS.slice(2).map((it) => (
          <TabBtn
            key={it.id}
            icon={it.icon}
            label={it.label}
            active={tab === it.id}
            onClick={() => onTab(it.id)}
          />
        ))}
        <button
          onClick={onStart}
          style={{
            position: 'absolute',
            left: '50%',
            top: -22,
            transform: 'translateX(-50%)',
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: 'none',
            background: `radial-gradient(circle at 30% 30%, ${XS.v2}, ${XS.v0})`,
            boxShadow: `0 0 0 4px rgba(15,23,42,1), 0 12px 28px ${XS.vGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            color: '#fff',
            fontFamily: XS.font,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 1.2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}

function TabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        color: active ? XS.v3 : XS.fg3,
        padding: 4,
      }}
    >
      <Icon name={icon} size={22} />
      <span
        style={{
          fontSize: 10,
          fontFamily: XS.font,
          fontWeight: 500,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </span>
    </button>
  );
}
