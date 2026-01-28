import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verifyAdmin";
import { getPersona, updatePersona } from "@/lib/db/personas";
import { isValidPersonaId } from "@/lib/utils/validators";
import { PersonaId } from "@/types";

interface RouteParams {
  params: Promise<{ personaId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { personaId } = await params;

  if (!isValidPersonaId(personaId)) {
    return NextResponse.json(
      { success: false, error: "Invalid personaId" },
      { status: 400 }
    );
  }

  try {
    const persona = await getPersona(personaId as PersonaId);

    if (!persona) {
      return NextResponse.json(
        { success: false, error: "Persona not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, persona });
  } catch (error) {
    console.error("Get persona error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get persona" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Verify admin
  const authResult = await verifyAdminRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { personaId } = await params;

  if (!isValidPersonaId(personaId)) {
    return NextResponse.json(
      { success: false, error: "Invalid personaId" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.age || !body.occupation) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Remove personaId and createdAt from updates
    const { personaId: _, createdAt: __, ...updates } = body;

    await updatePersona(personaId as PersonaId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update persona error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update persona" },
      { status: 500 }
    );
  }
}
