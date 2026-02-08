import { Persona, PersonaFormat, PersonaId } from "@/types";
import { getLatestPostByPersona } from "@/lib/db/posts";
import { isUnoSweetsDay, isWeekend } from "@/lib/scheduler/schedule";

const UNO_SWEETS_FORMAT_ID = "uno_sweets_sunday";
const AI_WEEKEND_FORMAT_ID = "ai_weekend";

/**
 * Pick a format for a persona based on:
 * 1. Special rules (e.g., uno's sweets sunday, ai's weekend)
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

  // Special case: ai's weekend format (Saturday/Sunday only)
  if (personaId === "ai" && isWeekend(dateKey)) {
    const weekendFormat = formats.find((f) => f.formatId === AI_WEEKEND_FORMAT_ID);
    if (weekendFormat) {
      // 50% chance to pick weekend format on weekends
      if (Math.random() < 0.5) {
        return weekendFormat;
      }
    }
  }

  // Get the last post's format to avoid consecutive same format
  const lastPost = await getLatestPostByPersona(personaId);
  const lastFormatId = lastPost?.formatId;

  // Filter out the last format (noConsecutiveSameFormat rule)
  // Also filter out weekend-only formats on weekdays
  let availableFormats = formats.filter((f) => {
    // Exclude weekend-only format on weekdays
    if (f.formatId === AI_WEEKEND_FORMAT_ID && !isWeekend(dateKey)) return false;
    // Exclude Sunday-only format on non-Sundays
    if (f.formatId === UNO_SWEETS_FORMAT_ID && !isUnoSweetsDay(dateKey)) return false;
    return true;
  });

  if (lastFormatId && availableFormats.length > 1) {
    availableFormats = availableFormats.filter((f) => f.formatId !== lastFormatId);
  }

  if (availableFormats.length === 0) {
    availableFormats = formats;
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
 * Get default formats for a persona (for initial setup)
 */
export function getDefaultFormats(personaId: PersonaId): PersonaFormat[] {
  switch (personaId) {
    case "ai":
      return [
        {
          formatId: "ai_daily",
          name: "日常日記",
          weight: 3,
          sections: [
            { key: "intro", title: "今日のこと", type: "text" as const, required: true },
            { key: "body", title: "", type: "text" as const, required: true },
            { key: "reflection", title: "ふと思ったこと", type: "text" as const, required: false },
          ],
        },
        {
          formatId: "ai_bento",
          name: "お弁当日記",
          weight: 2,
          sections: [
            { key: "menu", title: "今日のお弁当", type: "text" as const, required: true },
            { key: "process", title: "作った過程", type: "text" as const, required: true },
            { key: "thoughts", title: "食べてみて", type: "text" as const, required: false },
          ],
        },
        {
          formatId: "ai_mochi",
          name: "もち観察日記",
          weight: 2,
          sections: [
            { key: "mochi", title: "今日のもち", type: "text" as const, required: true },
            { key: "episode", title: "", type: "text" as const, required: true },
            { key: "memo", title: "もちメモ", type: "bullets" as const, required: false },
          ],
        },
        {
          formatId: AI_WEEKEND_FORMAT_ID,
          name: "週末おでかけ日記",
          weight: 1,
          sections: [
            { key: "outing", title: "今日のおでかけ", type: "text" as const, required: true },
            { key: "discovery", title: "見つけたもの", type: "text" as const, required: true },
            { key: "haul", title: "買ったもの・食べたもの", type: "bullets" as const, required: false },
          ],
        },
      ];

    case "uno":
      return [
        {
          formatId: "uno_daily",
          name: "日常日記",
          weight: 3,
          sections: [
            { key: "intro", title: "今日のこと", type: "text" as const, required: true },
            { key: "body", title: "", type: "text" as const, required: true },
            { key: "reflection", title: "思うこと", type: "text" as const, required: false },
          ],
        },
        {
          formatId: UNO_SWEETS_FORMAT_ID,
          name: "甘味巡り",
          weight: 0,
          sections: [
            { key: "visit", title: "今日の甘味処", type: "text" as const, required: true },
            { key: "sweets", title: "いただいたもの", type: "bullets" as const, required: true },
            { key: "thoughts", title: "味わいの記録", type: "text" as const, required: true },
          ],
        },
        {
          formatId: "uno_walk",
          name: "散歩記録",
          weight: 2,
          sections: [
            { key: "route", title: "今日のコース", type: "text" as const, required: true },
            { key: "scenery", title: "目に留まったもの", type: "text" as const, required: true },
            { key: "memo", title: "散歩メモ", type: "bullets" as const, required: false },
          ],
        },
        {
          formatId: "uno_teacher",
          name: "元教師の独り言",
          weight: 1,
          sections: [
            { key: "trigger", title: "きっかけ", type: "text" as const, required: true },
            { key: "memory", title: "思い出すこと", type: "text" as const, required: true },
            { key: "now", title: "今だから思うこと", type: "text" as const, required: false },
          ],
        },
      ];

    case "kochi":
      return [
        {
          formatId: "kochi_daily",
          name: "日常日記",
          weight: 2,
          sections: [
            { key: "intro", title: "今日のこと", type: "text" as const, required: true },
            { key: "body", title: "", type: "text" as const, required: true },
            { key: "reflection", title: "思ったこと", type: "text" as const, required: false },
          ],
        },
        {
          formatId: "kochi_travel",
          name: "旅レポ",
          weight: 3,
          sections: [
            { key: "place", title: "今いるところ", type: "text" as const, required: true },
            { key: "experience", title: "体験したこと", type: "text" as const, required: true },
            { key: "tips", title: "旅のメモ", type: "bullets" as const, required: false },
          ],
        },
        {
          formatId: "kochi_incident",
          name: "珍道中エピソード",
          weight: 2,
          sections: [
            { key: "situation", title: "何が起きたか", type: "text" as const, required: true },
            { key: "reaction", title: "どうなったか", type: "text" as const, required: true },
            { key: "lesson", title: "教訓", type: "text" as const, required: false },
          ],
        },
        {
          formatId: "kochi_gourmet",
          name: "B級グルメ探訪",
          weight: 2,
          sections: [
            { key: "shop", title: "今日の一軒", type: "text" as const, required: true },
            { key: "food", title: "食べたもの", type: "text" as const, required: true },
            { key: "rating", title: "幸地メモ", type: "bullets" as const, required: false },
          ],
        },
      ];

    default:
      return [
        {
          formatId: `${personaId}_default`,
          name: "通常日記",
          weight: 1,
          sections: [
            { key: "intro", title: "今日のこと", type: "text" as const, required: true },
            { key: "body", title: "", type: "text" as const, required: true },
            { key: "reflection", title: "思ったこと", type: "text" as const, required: false },
          ],
        },
      ];
  }
}
