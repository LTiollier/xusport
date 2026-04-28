// Date / time formatting helpers used across screens
const REFERENCE_DAY = new Date('2026-04-27T08:00:00');

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Math.floor((REFERENCE_DAY.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7 && diff > 0) return `Il y a ${diff}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const fmtTime = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export interface WeekDay {
  label: string;
  date: number;
  active: boolean;
  today: boolean;
}

export function computeWeekActivity(history: { completed_at: string | null }[]): {
  days: WeekDay[];
  count: number;
} {
  const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(REFERENCE_DAY);
    d.setDate(REFERENCE_DAY.getDate() - i);
    const active = history.some((h) => {
      if (!h.completed_at) return false;
      const hd = new Date(h.completed_at);
      return (
        hd.getFullYear() === d.getFullYear() &&
        hd.getMonth() === d.getMonth() &&
        hd.getDate() === d.getDate()
      );
    });
    days.push({
      label: labels[d.getDay()],
      date: d.getDate(),
      active,
      today: i === 0,
    });
  }
  return { days, count: days.filter((d) => d.active).length };
}
