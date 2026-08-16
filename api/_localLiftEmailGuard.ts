import { createHash } from "node:crypto";

const GUARD_COLLECTION = "localLiftEmailGuards";
const CLAIM_TTL_MS = 15 * 60 * 1000;

type GuardResult = "claimed" | "blocked" | "in_progress";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function guardId(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

function toMillis(value: unknown): number | null {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return null;
}

export async function hasSentDiagnostic(firestore: any, email: string): Promise<boolean> {
  const snapshot = await firestore.collection(GUARD_COLLECTION).doc(guardId(email)).get();
  return snapshot.exists && snapshot.data()?.status === "sent";
}

export async function hasRecentPendingDiagnostic(firestore: any, email: string): Promise<boolean> {
  const snapshot = await firestore
    .collection("localLiftDiagnostics")
    .where("emailNormalized", "==", normalizeEmail(email))
    .limit(20)
    .get();
  const cutoff = Date.now() - 30 * 60 * 1000;
  return snapshot.docs.some((doc: any) => {
    const data = doc.data() || {};
    if (data.source !== "free_diagnostic" || data.emailSent || data.status === "email_blocked") return false;
    const scheduledAt = toMillis(data.emailScheduledAt);
    const createdAt = toMillis(data.createdAt);
    return (scheduledAt !== null && scheduledAt >= cutoff) || (scheduledAt === null && createdAt !== null && createdAt >= cutoff);
  });
}

export async function claimEmailDelivery(firestore: any, leadRef: any, email: string): Promise<GuardResult> {
  let result: GuardResult = "in_progress";
  const guardRef = firestore.collection(GUARD_COLLECTION).doc(guardId(email));

  await firestore.runTransaction(async (transaction: any) => {
    const guardSnapshot = await transaction.get(guardRef);
    if (guardSnapshot.exists && guardSnapshot.data()?.status === "sent") {
      result = "blocked";
      return;
    }

    const leadSnapshot = await transaction.get(leadRef);
    const leadData = leadSnapshot.data() || {};
    const claimedAt = toMillis(leadData.emailDeliveryClaimedAt);
    const claimIsFresh = Boolean(leadData.emailDeliveryInProgress && claimedAt && Date.now() - claimedAt < CLAIM_TTL_MS);
    if (claimIsFresh) {
      result = "in_progress";
      return;
    }

    transaction.update(leadRef, {
      emailDeliveryInProgress: true,
      emailDeliveryClaimedAt: new Date(),
    });
    result = "claimed";
  });

  return result;
}

export async function releaseEmailDelivery(firestore: any, leadRef: any): Promise<void> {
  await leadRef.update({
    emailDeliveryInProgress: false,
    emailDeliveryClaimedAt: null,
  });
}

export async function commitEmailDelivery(
  firestore: any,
  leadRef: any,
  email: string,
  metadata: { leadId: string; via: "reveal-now" | "scheduled" },
): Promise<void> {
  const guardRef = firestore.collection(GUARD_COLLECTION).doc(guardId(email));
  const sentAt = new Date();
  await firestore.runTransaction(async (transaction: any) => {
    transaction.set(guardRef, {
      status: "sent",
      emailHash: guardId(email),
      leadId: metadata.leadId,
      emailSentVia: metadata.via,
      emailSentAt: sentAt,
      createdAt: sentAt,
    }, { merge: true });
    transaction.update(leadRef, {
      emailSent: true,
      emailSentAt: sentAt,
      emailSentVia: metadata.via,
      emailDeliveryInProgress: false,
      emailDeliveryClaimedAt: null,
    });
  });
}
