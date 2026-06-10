import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore(admin.app(), process.env.FIRESTORE_DATABASE_ID || 'tano-excursions');

async function run() {
    try {
        console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
        console.log("FIRESTORE_DATABASE_ID:", process.env.FIRESTORE_DATABASE_ID);
        console.log("Fetching...");
        const snapshot = await db.collection("excursions").get();
        console.log("Success:", snapshot.docs.length);
    } catch (e) {
        console.error("Caught error:", e);
    }
}
run();

