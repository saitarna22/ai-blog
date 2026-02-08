import { getAdminFirestore } from "@/lib/firebase/admin";
import { Persona, PersonaId } from "@/types";

const COLLECTION = "personas";

export async function getAllPersonas(): Promise<Persona[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION).get();
  return snapshot.docs.map((doc) => docToPersona(doc));
}

export async function getPersona(personaId: PersonaId): Promise<Persona | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(personaId).get();
  if (!doc.exists) return null;
  return docToPersona(doc);
}

export async function createPersona(persona: Persona): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(persona.personaId).set({
    ...persona,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updatePersona(
  personaId: PersonaId,
  updates: Partial<Omit<Persona, "personaId" | "createdAt">>
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(personaId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deletePersona(personaId: PersonaId): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(personaId).delete();
}

export async function hasAnyPosts(personaId: PersonaId): Promise<boolean> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection("posts")
    .where("personaId", "==", personaId)
    .where("status", "==", "published")
    .limit(1)
    .get();
  return !snapshot.empty;
}

function docToPersona(doc: FirebaseFirestore.DocumentSnapshot): Persona {
  const data = doc.data()!;
  return {
    personaId: doc.id as PersonaId,
    name: data.name,
    nameReading: data.nameReading,
    age: data.age,
    occupation: data.occupation,
    personality: data.personality,
    background: data.background,
    writingRules: data.writingRules || [],
    formats: data.formats || [],
    imageHint: data.imageHint,
    blogTitle: data.blogTitle || "",
    storyline: data.storyline
      ? {
          ...data.storyline,
          updatedAt: data.storyline.updatedAt?.toDate() || new Date(),
        }
      : undefined,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}
