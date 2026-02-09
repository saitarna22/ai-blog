import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { generatePostForPersona } from "@/lib/generation/generatePost";
import { isValidDateKey, isValidPersonaId } from "@/lib/utils/validators";
import { GenerateRequest, PersonaId } from "@/types";

export async function POST(request: NextRequest) {
  // Verify admin
  const authResult = await verifyAdminRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as GenerateRequest;
    const { dateKey, personaId, force = false, additionalInstructions } = body;

    if (!dateKey || !isValidDateKey(dateKey)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing dateKey" },
        { status: 400 }
      );
    }

    if (!personaId || !isValidPersonaId(personaId)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing personaId" },
        { status: 400 }
      );
    }

    const result = await generatePostForPersona(personaId as PersonaId, dateKey, force, additionalInstructions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          postId: result.postId,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          data: {
            postId: result.postId,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
