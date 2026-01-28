import { Persona, PersonaFormat, PersonaId } from "@/types";
import { getLatestPostByPersona } from "@/lib/db/posts";
import { isUnoSweetsDay } from "@/lib/scheduler/schedule";

const UNO_SWEETS_FORMAT_ID = "uno_sweets_sunday";

/**
 * Pick a format for a persona based on:
 * 1. Special rules (e.g., uno's sweets sunday)
 * 2. Weight-based random selection
 * 3. noConsecutiveSameFormat rule
 */
export async function pickFormat(
  persona: Persona,
  dateKey: string
): Promise<PersonaFormat> {
  const { personaId, formats } = persona;

  if (formats.length === 0) {
    throw new Error(`No formats defined for persona ${personaId}`);
  }

  // Special case: uno's Sunday sweets
  if (personaId === "uno" && isUnoSweetsDay(dateKey)) {
    const sweetsFormat = formats.find((f) => f.formatId === UNO_SWEETS_FORMAT_ID);
    if (sweetsFormat) {
      return sweetsFormat;
    }
  }

  // Get the last post's format to avoid consecutive same format
  const lastPost = await getLatestPostByPersona(personaId);
  const lastFormatId = lastPost?.formatId;

  // Filter out the last format (noConsecutiveSameFormat rule)
  let availableFormats = formats;
  if (lastFormatId && formats.length > 1) {
    availableFormats = formats.filter((f) => f.formatId !== lastFormatId);
  }

  // Weight-based random selection
  return weightedRandomSelect(availableFormats);
}

function weightedRandomSelect(formats: PersonaFormat[]): PersonaFormat {
  const totalWeight = formats.reduce((sum, f) => sum + (f.weight || 1), 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const format of formats) {
    cumulative += format.weight || 1;
    if (random < cumulative) {
      return format;
    }
  }

  // Fallback to first format
  return formats[0];
}

/**
 * Get default format for a persona (for initial setup)
 */
export function getDefaultFormats(personaId: PersonaId): PersonaFormat[] {
  const defaultSections = [
    { key: "intro", title: "今日のこと", type: "text" as const, required: true },
    { key: "body", title: "", type: "text" as const, required: true },
    { key: "reflection", title: "思ったこと", type: "text" as const, required: false },
  ];

  const baseFormat: PersonaFormat = {
    formatId: `${personaId}_default`,
    name: "通常日記",
    weight: 1,
    sections: defaultSections,
  };

  if (personaId === "uno") {
    return [
      baseFormat,
      {
        formatId: UNO_SWEETS_FORMAT_ID,
        name: "甘味回",
        weight: 0, // Only used on Sundays
        sections: [
          { key: "intro", title: "今日の甘味", type: "text" as const, required: true },
          { key: "sweets", title: "食べたもの", type: "bullets" as const, required: true },
          { key: "thoughts", title: "感想", type: "text" as const, required: true },
        ],
      },
    ];
  }

  return [baseFormat];
}
