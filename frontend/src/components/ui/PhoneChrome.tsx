'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';

export function StatusBar({ time = '9:41' }: { time?: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        paddingTop: 14,
        color: '#fff',
        zIndex: 20,
        fontFamily: XS.font,
        fontSize: 16,
        fontWeight: 600,
        pointerEvents: 'none',
      }}
    >
      <div style={{ minWidth: 80 }}>{time}</div>
      <div style={{ width: 126, height: 37 }} />
      <div
        style={{
          minWidth: 80,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <svg width="18" height="11" viewBox="0 0 18 11" fill="#fff">
          <rect x="0" y="6" width="3" height="5" rx="1" />
          <rect x="5" y="4" width="3" height="7" rx="1" />
          <rect x="10" y="2" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg
          width="16"
          height="11"
          viewBox="0 0 16 11"
          fill="none"
          stroke="#fff"
          strokeWidth="1.4"
        >
          <path d="M1 4.5C3 2.5 5.5 1.5 8 1.5s5 1 7 3" />
          <path d="M3 6.5C4.5 5 6 4.5 8 4.5s3.5 0.5 5 2" />
          <circle cx="8" cy="9" r="1" fill="#fff" />
        </svg>
        <svg
          width="26"
          height="12"
          viewBox="0 0 26 12"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
        >
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" />
          <rect x="2" y="2" width="18" height="8" rx="1.5" fill="#fff" />
          <rect x="23" y="4" width="2" height="4" rx="1" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}

export function HomeIndicator({ light = true }: { light?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: 8,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 139,
          height: 5,
          borderRadius: 100,
          background: light ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

export function DynamicIsland() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 11,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 126,
        height: 37,
        borderRadius: 24,
        background: '#000',
        zIndex: 50,
      }}
    />
  );
}
