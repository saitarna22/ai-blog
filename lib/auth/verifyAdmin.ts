import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdmin } from "@/lib/db/admins";

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

export async function verifyAdminRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { success: false, error: "Missing or invalid Authorization header" },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email || "";

    // Check if user is admin
    const adminStatus = await isAdmin(uid);
    if (!adminStatus) {
      return {
        error: NextResponse.json(
          { success: false, error: "User is not an admin" },
          { status: 403 }
        ),
      };
    }

    return {
      user: { uid, email },
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      error: NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      ),
    };
  }
}
