import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { regeneratePostParts } from "@/lib/generation/generatePost";
import { isValidPostId } from "@/lib/utils/validators";
import { RegenerateRequest } from "@/types";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Verify admin
  const authResult = await verifyAdminRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { postId } = await params;

  if (!isValidPostId(postId)) {
    return NextResponse.json(
      { success: false, error: "Invalid postId format" },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json()) as RegenerateRequest;
    const { parts, force = false } = body;

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing parts array" },
        { status: 400 }
      );
    }

    const validParts = parts.filter((p) => p === "text" || p === "image");
    if (validParts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid parts specified (text, image)" },
        { status: 400 }
      );
    }

    const result = await regeneratePostParts(postId, validParts as ("text" | "image")[], force);

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
    console.error("Regeneration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
