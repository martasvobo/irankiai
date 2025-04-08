import { onCall } from "firebase-functions/https";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
const db = admin.firestore();

const getMovies = onCall(async () => {
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

const createMovie = onCall(async (request) => {
  const { title, director, releaseDate } = request.data as any;
  logger.info("Creating movie: ", title, director, releaseDate);
  try {
    const newMovie = {
      title,
      director,
      releaseDate,
    };
    const docRef = await db.collection("movies").add(newMovie);
    return { status: "success", id: docRef.id };
  } catch (error) {
    logger.error("Error creating movie:", error);
    return { status: "error" };
  }
});

const updateMovie = onCall(async (request) => {
  const { id, title, director, releaseDate } = request.data as any;
  logger.info("Updating movie: ", id, title, director, releaseDate);
  try {
    const movieRef = db.collection("movies").doc(id);
    await movieRef.update({
      title,
      director,
      releaseDate,
    });
    return { status: "success" };
  } catch (error) {
    logger.error("Error updating movie:", error);
    return { status: "error" };
  }
});

const deleteMovie = onCall(async (request) => {
  const { id } = request.data as any;

  logger.info("Deleting movie with ID:", id);
  try {
    const movieRef = db.collection("movies").doc(id);
    await movieRef.delete();
    return { status: "success" };
  } catch (error) {
    logger.error("Error deleting movie:", error);
    return { status: "error" };
  }
});

export default {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
};
