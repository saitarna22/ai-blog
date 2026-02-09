import { getAdminFirestore } from "@/lib/firebase/admin";
import { Job, JobStatus, PersonaId } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "jobs";

export async function getJob(jobId: string): Promise<Job | null> {
  const db = getAdminFirestore();
  const doc = await db.collection(COLLECTION).doc(jobId).get();
  if (!doc.exists) return null;
  return docToJob(doc);
}

export async function getJobs(limit?: number): Promise<Job[]> {
  const db = getAdminFirestore();
  let query = db.collection(COLLECTION).orderBy("createdAt", "desc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => docToJob(doc));
}

export async function getJobsByStatus(status: JobStatus, limit?: number): Promise<Job[]> {
  const db = getAdminFirestore();
  let query = db
    .collection(COLLECTION)
    .where("status", "==", status)
    .orderBy("createdAt", "desc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => docToJob(doc));
}

export async function createJob(
  job: Omit<Job, "jobId" | "createdAt" | "status"> & { jobId?: string }
): Promise<string> {
  const db = getAdminFirestore();
  const jobId = job.jobId || generateJobId();

  const jobData = JSON.parse(JSON.stringify(job));
  await db.collection(COLLECTION).doc(jobId).set({
    ...jobData,
    jobId,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return jobId;
}

export async function startJob(jobId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(jobId).update({
    status: "running",
    startedAt: FieldValue.serverTimestamp(),
  });
}

export async function completeJob(
  jobId: string,
  result: { success: boolean; postId?: string; error?: string }
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(jobId).update({
    status: result.success ? "completed" : "failed",
    result: JSON.parse(JSON.stringify(result)),
    completedAt: FieldValue.serverTimestamp(),
  });
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTION).doc(jobId).update({
    status: "failed",
    result: { success: false, error },
    completedAt: FieldValue.serverTimestamp(),
  });
}

export async function getRecentJobsForDate(dateKey: string): Promise<Job[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("dateKey", "==", dateKey)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();
  return snapshot.docs.map((doc) => docToJob(doc));
}

export async function hasSuccessfulJobForDateAndPersona(
  dateKey: string,
  personaId: PersonaId
): Promise<boolean> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("dateKey", "==", dateKey)
    .where("personaId", "==", personaId)
    .where("status", "==", "completed")
    .limit(1)
    .get();
  return !snapshot.empty;
}

function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `job_${timestamp}_${random}`;
}

function docToJob(doc: FirebaseFirestore.DocumentSnapshot): Job {
  const data = doc.data()!;
  return {
    jobId: doc.id,
    type: data.type,
    status: data.status,
    dateKey: data.dateKey,
    personaId: data.personaId,
    postId: data.postId,
    parts: data.parts,
    result: data.result,
    createdAt: data.createdAt?.toDate() || new Date(),
    startedAt: data.startedAt?.toDate(),
    completedAt: data.completedAt?.toDate(),
  };
}
