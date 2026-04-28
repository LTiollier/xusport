// XuSport — Design tokens (Dark + Violet, sober & technical)
export const XS = {
  // Backgrounds
  bg0: '#0B1020',
  bg1: '#0F172A',
  bg2: '#111A2E',
  bg3: '#1E293B',
  bg4: '#243049',
  hairline: 'rgba(148,163,184,0.14)',
  divider: 'rgba(148,163,184,0.08)',

  // Text
  fg0: '#F8FAFC',
  fg1: '#E2E8F0',
  fg2: '#94A3B8',
  fg3: '#64748B',
  fg4: '#475569',

  // Accent — Violet électrique
  v0: '#6D28D9',
  v1: '#7C3AED',
  v2: '#8B5CF6',
  v3: '#A78BFA',
  v4: '#C4B5FD',
  vGlow: 'rgba(124,58,237,0.35)',
  vSoft: 'rgba(124,58,237,0.12)',

  // Semantic
  ok: '#10B981',
  okSoft: 'rgba(16,185,129,0.14)',
  warn: '#F59E0B',
  pb: '#FBBF24',
  pbSoft: 'rgba(251,191,36,0.16)',
  danger: '#EF4444',

  // Type
  font: "'Inter Tight', 'SF Pro Display', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  num: "'Inter Tight', 'SF Pro Display', system-ui, sans-serif",

  // Radii
  r1: 8,
  r2: 12,
  r3: 16,
  r4: 20,
  r5: 28,
  rPill: 999,
} as const;

export type Tokens = typeof XS;
