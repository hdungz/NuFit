export function formatClock(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateKey(date);
}

export function formatDateLabel(date: string): string {
  const today = new Date();
  const target = new Date(date);
  const isoToday = getLocalDateKey(today);
  const isoYesterday = getLocalDateDaysAgo(1);
  const ddmmyyyy = `${String(target.getDate()).padStart(2, "0")}/${String(target.getMonth() + 1).padStart(2, "0")}`;

  if (date === isoToday) return `Hôm nay - ${ddmmyyyy}`;
  if (date === isoYesterday) return `Hôm qua - ${ddmmyyyy}`;
  return ddmmyyyy;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
