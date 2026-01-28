import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { getAllPersonas } from "@/lib/db/personas";
import { createJob, startJob, completeJob, failJob } from "@/lib/db/jobs";
import { getPostingPersonas } from "@/lib/scheduler/schedule";
import { generatePostForPersona } from "@/lib/generation/generatePost";
import { getTodayDateKey } from "@/lib/utils/date";
import { isValidDateKey } from "@/lib/utils/validators";
import { GenerateDailyRequest } from "@/types";

export async function POST(request: NextRequest) {
  // Verify admin
  const authResult = await verifyAdminRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as GenerateDailyRequest;
    const dateKey = body.dateKey || getTodayDateKey();
    const force = body.force || false;

    if (!isValidDateKey(dateKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid dateKey format" },
        { status: 400 }
      );
    }

    // Create daily job
    const jobId = await createJob({
      type: "generate_daily",
      dateKey,
    });

    await startJob(jobId);

    // Get all personas
    const personas = await getAllPersonas();

    // Determine which personas should post today
    const postingPersonaIds = getPostingPersonas(dateKey);

    // Filter to only personas that exist and should post
    const personasToGenerate = personas.filter((p) =>
      postingPersonaIds.includes(p.personaId)
    );

    if (personasToGenerate.length === 0) {
      await completeJob(jobId, {
        success: true,
        error: "No personas to generate for this date",
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId,
          dateKey,
          generated: [],
          message: "No personas scheduled for this date",
        },
      });
    }

    // Generate posts for each persona
    const results = await Promise.all(
      personasToGenerate.map((persona) =>
        generatePostForPersona(persona.personaId, dateKey, force)
      )
    );

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    await completeJob(jobId, {
      success: failed.length === 0,
      error: failed.length > 0 ? `${failed.length} posts failed` : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        dateKey,
        generated: successful.map((r) => r.postId),
        failed: failed.map((r) => ({ postId: r.postId, error: r.error })),
      },
    });
  } catch (error) {
    console.error("Daily generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
