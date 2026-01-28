import { PersonaId } from "@/types";

/**
 * Validate dateKey format (YYYY-MM-DD)
 */
export function isValidDateKey(dateKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const [year, month, day] = dateKey.split("-").map(Number);

  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Check if date is valid
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Validate personaId
 */
export function isValidPersonaId(id: string): id is PersonaId {
  return id === "ai" || id === "uno" || id === "kochi";
}

/**
 * Validate postId format (YYYY-MM-DD_personaId)
 */
export function isValidPostId(postId: string): boolean {
  const parts = postId.split("_");
  if (parts.length !== 2) return false;

  const [dateKey, personaId] = parts;
  return isValidDateKey(dateKey) && isValidPersonaId(personaId);
}

/**
 * Generate postId from dateKey and personaId
 */
export function generatePostId(dateKey: string, personaId: PersonaId): string {
  return `${dateKey}_${personaId}`;
}

/**
 * Parse postId to components
 */
export function parsePostId(postId: string): { dateKey: string; personaId: PersonaId } | null {
  const parts = postId.split("_");
  if (parts.length !== 2) return null;

  const [dateKey, personaId] = parts;
  if (!isValidDateKey(dateKey) || !isValidPersonaId(personaId)) {
    return null;
  }

  return { dateKey, personaId };
}

/**
 * Validate year-month format (YYYY-MM)
 */
export function isValidYearMonth(yearMonth: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return false;
  }

  const [year, month] = yearMonth.split("-").map(Number);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
}
