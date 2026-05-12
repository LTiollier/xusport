import * as React from 'react';

export const ICON_NAMES = [
  'home', 'list', 'chart', 'user', 'play', 'pause', 'check', 'plus',
  'minus', 'x', 'arrowL', 'arrowR', 'chevR', 'chevD', 'edit', 'trash',
  'flame', 'bolt', 'trophy', 'medal', 'timer', 'dumbbell', 'grip',
  'volume', 'vibrate', 'calendar', 'clock', 'replay', 'eye', 'eyeOff',
  'mail', 'lock',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const ICON_NAME_SET = new Set<string>(ICON_NAMES);

export function resolveIconName(
  icon: string | null | undefined,
  fallback: IconName = 'dumbbell',
): IconName {
  return icon && ICON_NAME_SET.has(icon) ? (icon as IconName) : fallback;
}

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({
  name,
  size = 22,
  color = 'currentColor',
  stroke = 1.8,
}: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case 'list':
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
        </svg>
      );
    case 'play':
      return (
        <svg {...props}>
          <path d="M7 4l13 8-13 8z" fill={color} />
        </svg>
      );
    case 'pause':
      return (
        <svg {...props}>
          <rect x="6" y="4" width="4" height="16" fill={color} stroke="none" />
          <rect x="14" y="4" width="4" height="16" fill={color} stroke="none" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...props}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'x':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'arrowL':
      return (
        <svg {...props}>
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      );
    case 'arrowR':
      return (
        <svg {...props}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case 'chevR':
      return (
        <svg {...props}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'chevD':
      return (
        <svg {...props}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...props}>
          <path d="M4 20h4l11-11-4-4L4 16v4z" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...props}>
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...props}>
          <path d="M12 3c2 4-1 5-1 8a4 4 0 008 0c0-3-2-5-3-7-1 2-2 3-4-1z" />
          <path d="M9 14a3 3 0 006 0" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...props}>
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...props}>
          <path d="M8 4h8v6a4 4 0 01-8 0V4z" />
          <path d="M16 6h3v2a3 3 0 01-3 3M8 6H5v2a3 3 0 003 3" />
          <path d="M9 17h6M10 21h4M12 17v4" />
        </svg>
      );
    case 'medal':
      return (
        <svg {...props}>
          <path d="M8 4l-3 6 7 11 7-11-3-6" />
          <path d="M8 4h8M12 21v-8" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'timer':
      return (
        <svg {...props}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l3 2M9 2h6" />
        </svg>
      );
    case 'dumbbell':
      return (
        <svg {...props}>
          <path d="M2 12h2M20 12h2M5 8v8M19 8v8M8 6v12M16 6v12M8 12h8" />
        </svg>
      );
    case 'grip':
      return (
        <svg {...props}>
          <circle cx="9" cy="6" r="1.5" fill={color} stroke="none" />
          <circle cx="15" cy="6" r="1.5" fill={color} stroke="none" />
          <circle cx="9" cy="12" r="1.5" fill={color} stroke="none" />
          <circle cx="15" cy="12" r="1.5" fill={color} stroke="none" />
          <circle cx="9" cy="18" r="1.5" fill={color} stroke="none" />
          <circle cx="15" cy="18" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 'volume':
      return (
        <svg {...props}>
          <path d="M5 9v6h4l5 4V5L9 9H5z" />
          <path d="M16 8a5 5 0 010 8" />
        </svg>
      );
    case 'vibrate':
      return (
        <svg {...props}>
          <rect x="9" y="3" width="6" height="18" rx="1" />
          <path d="M3 10v4M5 8v8M19 8v8M21 10v4" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'replay':
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 109-9v4M3 4v4h4" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'eyeOff':
      return (
        <svg {...props}>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10.7 10.7 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.4 4.3M6.6 6.6A17 17 0 002 12s3.5 7 10 7c1.6 0 3-.3 4.3-.9" />
          <path d="M9.9 9.9a3 3 0 004.2 4.2" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      );
    default:
      return null;
  }
}
