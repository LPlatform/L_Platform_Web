const DAY_MS = 24 * 60 * 60 * 1000;

export function toIso(value: Date): string {
  return value.toISOString();
}

export function daysFromNow(days: number, base = new Date()): string {
  return toIso(new Date(base.getTime() + days * DAY_MS));
}

export function monthsAgo(months: number, day = 12, base = new Date()): string {
  const date = new Date(base);
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  date.setDate(day);
  date.setHours(9, 30, 0, 0);
  return toIso(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return "Just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return formatDate(value);
}

export function monthKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(
    new Date(year ?? 2026, (month ?? 1) - 1, 1),
  );
}

export function lastMonthKeys(count: number, base = new Date()): string[] {
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth() - offset, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function todayInputValue(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function academicYearOptions(base = new Date()): string[] {
  const year = base.getFullYear();
  return Array.from({ length: 4 }, (_, index) => {
    const start = year - 1 + index;
    return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
  }).reverse();
}

export function currentAcademicYear(base = new Date()): string {
  const start = base.getMonth() >= 2 ? base.getFullYear() : base.getFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}
