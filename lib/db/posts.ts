import { getAdminFirestore } from "@/lib/firebase/admin";
import { Post, PostStatus, PersonaId } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "posts";

export async function getPost(postId: string): Promise<Post | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(postId).get();
  if (!doc.exists) return null;
  return docToPost(doc);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return docToPost(snapshot.docs[0]);
}

export async function getPostsByPersona(
  personaId: PersonaId,
  status?: PostStatus,
  limit?: number
): Promise<Post[]> {
  const db = getAdminFirestore();
  let query = db.collection(COLLECTION).where("personaId", "==", personaId);

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query.orderBy("dateKey", "desc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function getPostsByDate(dateKey: string): Promise<Post[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("dateKey", "==", dateKey)
    .where("status", "==", "published")
    .get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function getPublishedPosts(limit?: number, startAfter?: string): Promise<Post[]> {
  const db = getAdminFirestore();
  let query = db
    .collection(COLLECTION)
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc");

  if (startAfter) {
    const startDoc = await db.collection(COLLECTION).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function getDrafts(personaId?: PersonaId): Promise<Post[]> {
  return getPostsByStatusAndPersona("draft", personaId);
}

export async function getPostsByStatusAndPersona(
  status: PostStatus,
  personaId?: PersonaId
): Promise<Post[]> {
  const db = getAdminFirestore();
  let query = db.collection(COLLECTION).where("status", "==", status);

  if (personaId) {
    query = query.where("personaId", "==", personaId);
  }

  query = query.orderBy("createdAt", "desc");
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function createPost(post: Omit<Post, "createdAt">): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(post.postId).set({
    ...post,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function updatePost(
  postId: string,
  updates: Partial<Omit<Post, "postId" | "createdAt">>
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(postId).update(updates);
}

export async function publishPost(postId: string, approvedBy: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(postId).update({
    status: "published",
    publishedAt: FieldValue.serverTimestamp(),
    approvedBy,
  });
}

export async function archivePost(postId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(postId).update({
    status: "archived",
  });
}

export async function deletePost(postId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(postId).delete();
}

export async function getLatestPostByPersona(personaId: PersonaId): Promise<Post | null> {
  const posts = await getRecentPostsByPersona(personaId, 1);
  return posts.length > 0 ? posts[0] : null;
}

export async function getRecentPostsByPersona(personaId: PersonaId, limit: number): Promise<Post[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("personaId", "==", personaId)
    .orderBy("dateKey", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function getPostsForMonth(yearMonth: string): Promise<Post[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "==", "published")
    .where("dateKey", ">=", `${yearMonth}-01`)
    .where("dateKey", "<=", `${yearMonth}-31`)
    .orderBy("dateKey", "desc")
    .get();
  return snapshot.docs.map((doc) => docToPost(doc));
}

export async function getArchiveMonths(): Promise<string[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "==", "published")
    .orderBy("dateKey", "desc")
    .get();

  const months = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const dateKey = doc.data().dateKey as string;
    if (dateKey) {
      months.add(dateKey.substring(0, 7)); // YYYY-MM
    }
  });

  return Array.from(months);
}

function docToPost(doc: FirebaseFirestore.DocumentSnapshot): Post {
  const data = doc.data()!;
  return {
    postId: doc.id,
    slug: data.slug,
    dateKey: data.dateKey,
    personaId: data.personaId,
    status: data.status,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    image: data.image,
    formatId: data.formatId,
    createdAt: data.createdAt?.toDate() || new Date(),
    generatedAt: data.generatedAt?.toDate() || new Date(),
    publishedAt: data.publishedAt?.toDate(),
    approvedBy: data.approvedBy,
    generation: data.generation,
    personaSnapshot: data.personaSnapshot,
  };
}
