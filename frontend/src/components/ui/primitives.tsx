'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';

type CSSProps = React.CSSProperties;

export function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: CSSProps;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: XS.bg3,
        border: `1px solid ${XS.hairline}`,
        borderRadius: XS.r4,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  color = XS.v1,
  soft = true,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  soft?: boolean;
  style?: CSSProps;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: XS.rPill,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: soft ? color : '#fff',
        background: soft ? `${color}22` : color,
        border: soft ? `1px solid ${color}33` : 'none',
        fontFamily: XS.font,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Btn({
  children,
  kind = 'primary',
  onClick,
  style,
  full,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  kind?: BtnKind;
  onClick?: () => void;
  style?: CSSProps;
  full?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base: CSSProps = {
    height: 52,
    padding: '0 22px',
    borderRadius: XS.r3,
    border: 'none',
    fontFamily: XS.font,
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 0.2,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    width: full ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'transform 80ms ease, background 120ms ease',
  };
  const variants: Record<BtnKind, CSSProps> = {
    primary: {
      background: XS.v1,
      color: '#fff',
      boxShadow: `0 8px 22px ${XS.vGlow}`,
    },
    secondary: {
      background: XS.bg4,
      color: XS.fg0,
      border: `1px solid ${XS.hairline}`,
    },
    ghost: { background: 'transparent', color: XS.fg1 },
    danger: {
      background: 'transparent',
      color: XS.danger,
      border: `1px solid ${XS.danger}44`,
    },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{ ...base, ...variants[kind], ...style }}
    >
      {children}
    </button>
  );
}

export const Spacer = ({ h = 16 }: { h?: number }) => (
  <div style={{ height: h }} />
);

export function SectionHeader({
  title,
  action,
  style,
}: {
  title: string;
  action?: React.ReactNode;
  style?: CSSProps;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '0 20px',
        marginBottom: 12,
        ...style,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: XS.font,
          fontSize: 13,
          fontWeight: 600,
          color: XS.fg2,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h3>
      {action}
    </div>
  );
}

export function ScreenHeader({
  kicker,
  title,
  right,
  paddingTop = 56,
}: {
  kicker?: string;
  title: string;
  right?: React.ReactNode;
  paddingTop?: number;
}) {
  return (
    <div style={{ padding: `${paddingTop}px 20px 16px` }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {kicker && (
            <div
              style={{
                fontFamily: XS.mono,
                fontSize: 11,
                fontWeight: 500,
                color: XS.v3,
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {kicker}
            </div>
          )}
          <h1
            style={{
              margin: 0,
              fontFamily: XS.font,
              fontSize: 32,
              fontWeight: 700,
              color: XS.fg0,
              letterSpacing: -0.8,
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
        </div>
        {right}
      </div>
    </div>
  );
}
