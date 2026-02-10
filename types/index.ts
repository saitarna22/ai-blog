// Persona types
export type PersonaId = "ai" | "uno" | "kochi";

export interface PersonaFormat {
  formatId: string;
  name: string;
  weight: number;
  maxPerMonth?: number;
  sections: {
    key: string;
    title?: string;
    type: "text" | "bullets";
    required: boolean;
  }[];
}

export interface StoryThread {
  threadId: string;
  description: string;
  startDate: string;
  status: "active" | "resolved" | "dormant";
}

export interface StorylineState {
  currentSituation: string;
  ongoingThreads: StoryThread[];
  recentEvents: string[];
  recentMood: string;
  updatedAt: Date;
}

export interface Persona {
  personaId: PersonaId;
  name: string;
  nameReading?: string;
  age: number;
  occupation: string;
  personality: string;
  background: string;
  writingRules: string[];
  formats: PersonaFormat[];
  imageHint: string;
  blogTitle: string;
  storyline?: StorylineState;
  createdAt: Date;
  updatedAt: Date;
}

// Post types
export type PostStatus = "draft" | "published" | "archived";

export interface PostSection {
  key: string;
  title?: string;
  type: "text" | "bullets";
  text?: string;
  bullets?: string[];
}

export interface PostContent {
  sections: PostSection[];
}

export interface PostImage {
  url: string;
  styleKey: string;
  prompt: string;
}

export interface PostGeneration {
  jobId: string;
  retries: number;
  lastError?: string | null;
}

export interface Post {
  postId: string;
  slug: string;
  dateKey: string;
  personaId: PersonaId;
  status: PostStatus;
  title: string;
  content: PostContent;
  tags: string[];
  image: PostImage;
  formatId: string;
  createdAt: Date;
  generatedAt: Date;
  publishedAt?: Date;
  approvedBy?: string;
  generation: PostGeneration;
  personaSnapshot: Persona;
}

// Job types
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface Job {
  jobId: string;
  type: "generate_daily" | "generate_single" | "regenerate";
  status: JobStatus;
  dateKey: string;
  personaId?: PersonaId;
  postId?: string;
  parts?: ("text" | "image")[];
  result?: {
    success: boolean;
    postId?: string;
    error?: string;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// Admin types
export interface Admin {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Image style presets (persona-specific)
export type ImageStyleKey = "watercolor_warm" | "sumi_ink" | "colorful_sketch";

export const IMAGE_STYLE_PRESETS: Record<ImageStyleKey, string> = {
  watercolor_warm: "Soft watercolor illustration with warm pastel tones (pink, peach, cream). Gentle washes of color, paper texture visible, intimate and cozy feeling",
  sumi_ink: "Japanese sumi-e (ink wash painting) style with subtle indigo and grey-green tones. Elegant brushstrokes, plenty of white space, contemplative mood",
  colorful_sketch: "Vibrant travel sketch with bold pen lines and cheerful watercolor splashes (orange, teal, yellow). Energetic and lively, like a travel journal illustration",
};

// API types
export interface GenerateDailyRequest {
  dateKey?: string;
  force?: boolean;
  additionalInstructions?: string;
}

export interface GenerateRequest {
  dateKey: string;
  personaId: PersonaId;
  force?: boolean;
  additionalInstructions?: string;
}

export interface RegenerateRequest {
  parts: ("text" | "image")[];
  force?: boolean;
  additionalInstructions?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
