import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { publishPost, getPost } from "@/lib/db/posts";
import { isValidPostId } from "@/lib/utils/validators";

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

    if (post.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "Only drafts can be published" },
        { status: 400 }
      );
    }

    await publishPost(postId, authResult.user.uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
