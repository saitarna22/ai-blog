import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { getPost, updatePost } from "@/lib/db/posts";
import { isValidPostId } from "@/lib/utils/validators";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params;

  if (!isValidPostId(postId)) {
    return NextResponse.json(
      { success: false, error: "Invalid postId" },
      { status: 400 }
    );
  }

  try {
    const post = await getPost(postId);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get post" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Verify admin
  const authResult = await verifyAdminRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { postId } = await params;

  if (!isValidPostId(postId)) {
    return NextResponse.json(
      { success: false, error: "Invalid postId" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, tags } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;

    await updatePost(postId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update post" },
      { status: 500 }
    );
  }
}
