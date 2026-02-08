import { NextRequest, NextResponse } from "next/server";
import { getAllPersonas } from "@/lib/db/personas";
import { createJob, startJob, completeJob } from "@/lib/db/jobs";
import { getPostingPersonas } from "@/lib/scheduler/schedule";
import { generatePostForPersona } from "@/lib/generation/generatePost";
import { getTodayDateKey } from "@/lib/utils/date";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateKey = getTodayDateKey();

    const jobId = await createJob({
      type: "generate_daily",
      dateKey,
    });

    await startJob(jobId);

    const personas = await getAllPersonas();
    const postingPersonaIds = getPostingPersonas(dateKey);

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
        data: { jobId, dateKey, generated: [], message: "No personas scheduled" },
      });
    }

    const results = await Promise.all(
      personasToGenerate.map((persona) =>
        generatePostForPersona(persona.personaId, dateKey, false)
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
    console.error("Cron daily generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
