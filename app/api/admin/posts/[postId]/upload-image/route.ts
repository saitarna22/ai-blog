import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { getPost, updatePost } from "@/lib/db/posts";
import { getAdminStorage } from "@/lib/firebase/admin";
import { isValidPostId } from "@/lib/utils/validators";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileName = `posts/${postId}/image.png`;
    const storageFile = bucket.file(fileName);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type || "image/png",
      },
    });

    await storageFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}?t=${Date.now()}`;

    await updatePost(postId, {
      image: {
        ...post.image,
        url: publicUrl,
      },
    });

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
