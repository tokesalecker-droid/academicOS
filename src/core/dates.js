const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseLocalDate(dateValue) {
  if (dateValue instanceof Date) {
    return startOfLocalDay(dateValue);
  }

  const [year, month, day] = String(dateValue).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(dateValue, now = new Date()) {
  const target = parseLocalDate(dateValue);
  const today = startOfLocalDay(now);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatCountdown(dateValue, now = new Date()) {
  const days = daysUntil(dateValue, now);

  if (days === 0) return "Heute";
  if (days === 1) return "In 1 Tag";
  if (days === -1) return "Vor 1 Tag";
  if (days < 0) return `Vor ${Math.abs(days)} Tagen`;
  if (days <= 7) return `In ${days} Tagen`;

  const weeks = Math.round(days / 7);
  if (weeks === 1) return "In 1 Woche";
  return `In ${weeks} Wochen`;
}
