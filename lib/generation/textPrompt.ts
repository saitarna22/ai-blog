import OpenAI from "openai";
import { Persona, PersonaFormat } from "@/types";
import {
  SYSTEM_PROMPT,
  buildTextPrompt,
  parseGeneratedContent,
  GeneratedContent,
  RecentPostSummary,
} from "./promptTemplates";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function generateText(params: {
  persona: Persona;
  format: PersonaFormat;
  dateKey: string;
  isFirstPost: boolean;
  recentPosts?: RecentPostSummary[];
  additionalInstructions?: string;
}): Promise<GeneratedContent> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o";

  const userPrompt = buildTextPrompt(params);

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 4000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenAI");
  }

  return parseGeneratedContent(content);
}
