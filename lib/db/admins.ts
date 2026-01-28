import { getAdminFirestore } from "@/lib/firebase/admin";
import { Admin } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "admins";

export async function isAdmin(uid: string): Promise<boolean> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  return doc.exists;
}

export async function getAdmin(uid: string): Promise<Admin | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return docToAdmin(doc);
}

export async function getAllAdmins(): Promise<Admin[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(COLLECTION).get();
  return snapshot.docs.map((doc) => docToAdmin(doc));
}

export async function createAdmin(admin: Omit<Admin, "createdAt">): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(admin.uid).set({
    ...admin,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteAdmin(uid: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(uid).delete();
}

function docToAdmin(doc: FirebaseFirestore.DocumentSnapshot): Admin {
  const data = doc.data()!;
  return {
    uid: doc.id,
    email: data.email,
    displayName: data.displayName,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}
