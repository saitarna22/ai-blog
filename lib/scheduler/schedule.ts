import { PersonaId } from "@/types";
import { isOddDay, isEvenDay, isUnoDay, isSunday } from "@/lib/utils/date";

/**
 * Get which personas should post on a given date
 *
 * 愛（ai）: 奇数日
 * 幸地（kochi）: 偶数日
 * 宇野（uno）: 月・水・金・日
 */
export function getPostingPersonas(dateKey: string): PersonaId[] {
  const personas: PersonaId[] = [];

  // 愛: odd days (DD is odd)
  if (isOddDay(dateKey)) {
    personas.push("ai");
  }

  // 幸地: even days (DD is even)
  if (isEvenDay(dateKey)) {
    personas.push("kochi");
  }

  // 宇野: Monday, Wednesday, Friday, Sunday
  if (isUnoDay(dateKey)) {
    personas.push("uno");
  }

  return personas;
}

/**
 * Check if a persona should post on a given date
 */
export function shouldPersonaPost(personaId: PersonaId, dateKey: string): boolean {
  return getPostingPersonas(dateKey).includes(personaId);
}

/**
 * Check if it's a sweets day for uno (Sunday)
 */
export function isUnoSweetsDay(dateKey: string): boolean {
  return isSunday(dateKey);
}
