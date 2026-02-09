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

// Image style presets
export type ImageStyleKey = "pencil_sketch" | "watercolor" | "urban_sketch" | "diary_doodle";

export const IMAGE_STYLE_PRESETS: Record<ImageStyleKey, string> = {
  pencil_sketch: "Soft pencil sketch with gentle shading, loose lines",
  watercolor: "Soft watercolor wash, muted colors, paper texture visible",
  urban_sketch: "Urban sketching style, quick confident lines, minimal color",
  diary_doodle: "Simple diary doodle, ballpoint pen, casual and intimate"
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
