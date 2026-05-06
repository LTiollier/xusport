// Date / time formatting helpers used across screens

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  
  // Reset time for day-based comparison
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diff = Math.floor((nowDay.getTime() - dDay.getTime()) / 86400000);
  
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7 && diff >= 0) return `Il y a ${diff}j`;
  
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function fmtHeaderDate(): string {
  const d = new Date();
  const parts = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).split(' ');
  
  // Format: "MARDI · 27 AVRIL"
  if (parts.length >= 3) {
    return `${parts[0]} · ${parts[1]} ${parts[2]}`.toUpperCase();
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

export const fmtTime = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export interface WeekDay {
  label: string;
  date: number;
  active: boolean;
  today: boolean;
}

/**
 * Computes activity for the current calendar week (Monday to Sunday)
 */
export function computeWeekActivity(history: { completed_at: string | null }[]): {
  days: WeekDay[];
  count: number;
} {
  const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const days: WeekDay[] = [];
  const now = new Date();
  
  // Get current day of week (0-6, 0 is Sunday)
  const dayOfWeek = now.getDay();
  // Adjust to find the Monday of the current week (Europe/France style)
  const mondayDiff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayDiff);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
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
      today: dDate.getTime() === nowDate.getTime(),
    });
  }
  return { days, count: days.filter((d) => d.active).length };
}

export function fmtMemberSince(iso?: string): string {
  if (!iso) return 'Membre depuis longtemps';
  const d = new Date(iso);
  const month = d.toLocaleDateString('fr-FR', { month: 'short' });
  const year = d.getFullYear();
  return `Membre depuis ${month} ${year}`;
}
