import OpenAI from "openai";
import { PersonaId, ImageStyleKey, IMAGE_STYLE_PRESETS } from "@/types";
import { getAdminStorage } from "@/lib/firebase/admin";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Base prompt for all images
const BASE_PROMPT = `A hand-drawn illustration for a personal diary blog.
The drawing feels intimate, gentle, and slightly imperfect, like a sketch made to remember a moment rather than to show others.
Soft lines, natural composition, warm and calm atmosphere.
No photographic realism, no commercial illustration style.
The image should feel like a memory, not a photo.
If any text, signage, labels, or writing appears in the image, it MUST be in Japanese (hiragana, katakana, or kanji). Never include English text or alphabet letters.`;

// Negative prompt (things to avoid)
const NEGATIVE_PROMPT = `photorealistic, ultra-detailed, 3D render, anime style, commercial illustration,
logo, watermark, poster design,
high contrast lighting, dramatic shadows, advertising style,
English text, alphabet letters, Latin characters`;

// Persona-specific hints
const PERSONA_HINTS: Record<PersonaId, string> = {
  ai: "A warm, personal everyday scene: home cooking, a cat napping, a cozy apartment in Shimokitazawa, cafe interior. Emphasize emotional warmth and intimacy.",
  uno: "A serene Kyoto scene: temple gardens, traditional sweets on a plate, quiet neighborhood streets, seasonal nature. Emphasize tranquility and nostalgia.",
  kochi: "A travel scene somewhere in Japan: local trains, guesthouses, street food stalls, unexpected encounters. Emphasize adventure and curiosity.",
};

export async function generateImage(params: {
  description: string;
  personaId: PersonaId;
  styleKey: ImageStyleKey;
  postId: string;
}): Promise<{ url: string; prompt: string }> {
  const { description, personaId, styleKey, postId } = params;
  const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

  const stylePrompt = IMAGE_STYLE_PRESETS[styleKey];
  const personaHint = PERSONA_HINTS[personaId];

  const fullPrompt = `${BASE_PROMPT}

Style: ${stylePrompt}

Subject: ${description}

${personaHint}

Avoid: ${NEGATIVE_PROMPT}`;

  const response = await getOpenAI().images.generate({
    model,
    prompt: fullPrompt,
    n: 1,
    size: "1792x1024",
    quality: "standard",
    style: "natural",
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL returned from OpenAI");
  }

  // Download and upload to Firebase Storage
  const storedUrl = await uploadImageToStorage(imageUrl, postId);

  return {
    url: storedUrl,
    prompt: fullPrompt,
  };
}

async function uploadImageToStorage(imageUrl: string, postId: string): Promise<string> {
  // Download image from OpenAI
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Firebase Storage
  const storage = getAdminStorage();
  const bucket = storage.bucket();
  const fileName = `posts/${postId}/image.png`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
    },
  });

  // Make file public
  await file.makePublic();

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  return publicUrl;
}

const PERSONA_STYLES: Record<PersonaId, ImageStyleKey> = {
  ai: "watercolor_warm",
  uno: "sumi_ink",
  kochi: "colorful_sketch",
};

export function getPersonaStyle(personaId: PersonaId): ImageStyleKey {
  return PERSONA_STYLES[personaId];
}
