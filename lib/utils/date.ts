/**
 * Get current date in JST timezone
 */
export function getJSTDate(): Date {
  const now = new Date();
  // JST is UTC+9
  const jstOffset = 9 * 60 * 60 * 1000;
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utcTime + jstOffset);
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date key in JST
 */
export function getTodayDateKey(): string {
  return formatDateKey(getJSTDate());
}

/**
 * Parse dateKey to Date object
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get day of month from dateKey
 */
export function getDayOfMonth(dateKey: string): number {
  const [, , day] = dateKey.split("-").map(Number);
  return day;
}

/**
 * Get day of week from dateKey (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateKey: string): number {
  const date = parseDateKey(dateKey);
  return date.getDay();
}

/**
 * Check if day is odd
 */
export function isOddDay(dateKey: string): boolean {
  return getDayOfMonth(dateKey) % 2 === 1;
}

/**
 * Check if day is even
 */
export function isEvenDay(dateKey: string): boolean {
  return getDayOfMonth(dateKey) % 2 === 0;
}

/**
 * Check if date is Sunday
 */
export function isSunday(dateKey: string): boolean {
  return getDayOfWeek(dateKey) === 0;
}

/**
 * Check if date is Monday, Wednesday, Friday, or Sunday
 */
export function isUnoDay(dateKey: string): boolean {
  const dow = getDayOfWeek(dateKey);
  // Sunday = 0, Monday = 1, Wednesday = 3, Friday = 5
  return dow === 0 || dow === 1 || dow === 3 || dow === 5;
}

/**
 * Format date for display (Japanese)
 */
export function formatDateDisplay(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日(${weekday})`;
}

/**
 * Format month for display (Japanese)
 */
export function formatMonthDisplay(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${year}年${month}月`;
}

/**
 * Get year-month from dateKey
 */
export function getYearMonth(dateKey: string): string {
  return dateKey.substring(0, 7);
}
