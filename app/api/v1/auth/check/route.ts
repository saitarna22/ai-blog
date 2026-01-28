import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdmin } from "@/lib/db/admins";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ isAdmin: false });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const adminStatus = await isAdmin(decodedToken.uid);

    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
