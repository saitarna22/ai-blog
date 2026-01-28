import { Post, Persona, PersonaId } from "@/types";
import { getPersona, hasAnyPosts } from "@/lib/db/personas";
import { createPost, updatePost, getPost, getLatestPostByPersona } from "@/lib/db/posts";
import { createJob, startJob, completeJob, failJob } from "@/lib/db/jobs";
import { generateText } from "./textPrompt";
import { generateImage, pickRandomStyle } from "./imagePrompt";
import { pickFormat } from "./pickFormat";
import { generatePostId } from "@/lib/utils/validators";

const MAX_IMAGE_RETRIES = 2;

export interface GeneratePostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function generatePostForPersona(
  personaId: PersonaId,
  dateKey: string,
  force: boolean = false
): Promise<GeneratePostResult> {
  const postId = generatePostId(dateKey, personaId);

  // Check if post already exists
  const existingPost = await getPost(postId);
  if (existingPost && !force) {
    return { success: true, postId, error: "Post already exists" };
  }

  // Create job
  const jobId = await createJob({
    type: "generate_single",
    dateKey,
    personaId,
    postId,
  });

  try {
    await startJob(jobId);

    // Get persona
    const persona = await getPersona(personaId);
    if (!persona) {
      throw new Error(`Persona not found: ${personaId}`);
    }

    // Check if this is the first post
    const isFirstPost = !(await hasAnyPosts(personaId));

    // Get previous context for continuity
    let previousContext: string | undefined;
    if (!isFirstPost) {
      const lastPost = await getLatestPostByPersona(personaId);
      if (lastPost) {
        previousContext = summarizePost(lastPost);
      }
    }

    // Pick format
    const format = await pickFormat(persona, dateKey);

    // Generate text
    const generatedContent = await generateText({
      persona,
      format,
      dateKey,
      isFirstPost,
      previousContext,
    });

    // Generate image with retries
    const styleKey = pickRandomStyle();
    let imageResult: { url: string; prompt: string } | null = null;
    let imageRetries = 0;
    let lastImageError: string | undefined;

    while (imageRetries <= MAX_IMAGE_RETRIES && !imageResult) {
      try {
        imageResult = await generateImage({
          description: generatedContent.imageDescription,
          personaId,
          styleKey,
          postId,
        });
      } catch (error) {
        imageRetries++;
        lastImageError = error instanceof Error ? error.message : String(error);
        console.error(`Image generation attempt ${imageRetries} failed:`, error);

        if (imageRetries > MAX_IMAGE_RETRIES) {
          console.error("Max image retries exceeded, proceeding without image");
        }
      }
    }

    // Build post object
    const post: Omit<Post, "createdAt"> = {
      postId,
      slug: postId,
      dateKey,
      personaId,
      status: "draft",
      title: generatedContent.title,
      content: {
        sections: generatedContent.sections,
      },
      tags: generatedContent.tags,
      image: imageResult
        ? {
            url: imageResult.url,
            styleKey,
            prompt: imageResult.prompt,
          }
        : {
            url: "",
            styleKey,
            prompt: "",
          },
      formatId: format.formatId,
      generatedAt: new Date(),
      generation: {
        jobId,
        retries: imageRetries,
        lastError: lastImageError,
      },
      personaSnapshot: persona,
    };

    // Create or update post
    if (existingPost) {
      await updatePost(postId, post);
    } else {
      await createPost(post);
    }

    await completeJob(jobId, { success: true, postId });
    return { success: true, postId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Post generation failed for ${postId}:`, error);

    await failJob(jobId, errorMessage);
    return { success: false, postId, error: errorMessage };
  }
}

export async function regeneratePostParts(
  postId: string,
  parts: ("text" | "image")[],
  force: boolean = false
): Promise<GeneratePostResult> {
  const existingPost = await getPost(postId);
  if (!existingPost) {
    return { success: false, postId, error: "Post not found" };
  }

  // Create job
  const jobId = await createJob({
    type: "regenerate",
    dateKey: existingPost.dateKey,
    personaId: existingPost.personaId,
    postId,
    parts,
  });

  try {
    await startJob(jobId);

    const persona = existingPost.personaSnapshot as Persona;
    const updates: Partial<Post> = {};

    if (parts.includes("text")) {
      const format = persona.formats.find((f) => f.formatId === existingPost.formatId);
      if (!format) {
        throw new Error("Format not found in persona snapshot");
      }

      const generatedContent = await generateText({
        persona,
        format,
        dateKey: existingPost.dateKey,
        isFirstPost: false,
      });

      updates.title = generatedContent.title;
      updates.content = { sections: generatedContent.sections };
      updates.tags = generatedContent.tags;
    }

    if (parts.includes("image")) {
      const styleKey = pickRandomStyle();
      const description =
        parts.includes("text") && updates.title
          ? updates.title
          : existingPost.title;

      const imageResult = await generateImage({
        description,
        personaId: existingPost.personaId,
        styleKey,
        postId,
      });

      updates.image = {
        url: imageResult.url,
        styleKey,
        prompt: imageResult.prompt,
      };
    }

    updates.generatedAt = new Date();
    await updatePost(postId, updates);

    await completeJob(jobId, { success: true, postId });
    return { success: true, postId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Regeneration failed for ${postId}:`, error);

    await failJob(jobId, errorMessage);
    return { success: false, postId, error: errorMessage };
  }
}

function summarizePost(post: Post): string {
  const title = post.title;
  const firstSection = post.content.sections.find((s) => s.type === "text" && s.text);
  const excerpt = firstSection?.text?.slice(0, 200) || "";

  return `前回「${title}」では、${excerpt}...という内容でした。`;
}
