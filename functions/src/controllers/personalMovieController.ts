import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/https";
const db = admin.firestore();

const getPersonalMovies = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("personalMovies").get();
    const personalMovies: any[] = [];
    snapshot.forEach((doc) => {
      personalMovies.push({ id: doc.id, ...doc.data() });
    });
    return { status: "success", personalMovies };
  } catch (error) {
    logger.error("Error fetching personal movies:", error);
    return { status: "error" };
  }
});

const createPersonalMovie = onCall({ region: "europe-west1" }, async (request) => {
  const { state, rating, review, movieId, userId } = request.data as any;
  logger.info("Creating personal movie:", state, rating, review, movieId, userId);
  try {
    const newPersonalMovie = { state, rating, review, movieId, userId };
    const docRef = await db.collection("personalMovies").add(newPersonalMovie);
    return { status: "success", id: docRef.id };
  } catch (error) {
    logger.error("Error creating personal movie:", error);
    return { status: "error" };
  }
});

const updatePersonalMovie = onCall({ region: "europe-west1" }, async (request) => {
  const { id, state, rating, review } = request.data as any;
  logger.info("Updating personal movie:", id, state, rating, review);
  try {
    const personalMovieRef = db.collection("personalMovies").doc(id);
    await personalMovieRef.update({ state, rating, review });
    return { status: "success" };
  } catch (error) {
    logger.error("Error updating personal movie:", error);
    return { status: "error" };
  }
});

const deletePersonalMovie = onCall({ region: "europe-west1" }, async (request) => {
  const { id } = request.data as any;
  logger.info("Deleting personal movie with ID:", id);
  try {
    const personalMovieRef = db.collection("personalMovies").doc(id);
    await personalMovieRef.delete();
    return { status: "success" };
  } catch (error) {
    logger.error("Error deleting personal movie:", error);
    return { status: "error" };
  }
});

export default {
  getPersonalMovies,
  createPersonalMovie,
  updatePersonalMovie,
  deletePersonalMovie,
};
