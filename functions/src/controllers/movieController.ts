import { onCall } from "firebase-functions/https";
import * as admin from "firebase-admin";
const db = admin.firestore();

const getMovies = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("movies").get();
    const movies = <any>[];
    snapshot.forEach((doc) => {
      movies.push({ id: doc.id, ...doc.data() });
    });

    return { status: "success", movies };
  } catch (error) {
    return { status: "error" };
  }
});

export default {
  getMovies,
};
