import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/https";
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

const createMovie = onCall({ region: "europe-west1" }, async (request) => {
  const { title, director, releaseDate, genres } = request.data as any;
  logger.info("Creating movie: ", title, director, releaseDate, genres );
  try {
    const newMovie = {
      title,
      director,
      releaseDate,
      genres,
    };
    const docRef = await db.collection("movies").add(newMovie);
    return { status: "success", id: docRef.id };
  } catch (error) {
    logger.error("Error creating movie:", error);
    return { status: "error" };
  }
});

const updateMovie = onCall({ region: "europe-west1" }, async (request) => {
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

const deleteMovie = onCall({ region: "europe-west1" }, async (request) => {
  const { id } = request.data as any;
  logger.info("Deleting movie with ID:", id);
  try {
    const movieRef = db.collection("movies").doc(id);
    await movieRef.delete();
    const personalMoviesSnapshot = await db.collection("personalMovies")
        .where("movieId", "==", id)
        .get();
    const batch = db.batch();
    personalMoviesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    return { status: "success" };
  } catch (error) {
    logger.error("Error deleting movie:", error);
    return { status: "error" };
  }
});

const getGenres = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("genres").get();
    const genres = <any>[];
    snapshot.forEach((doc) => {
      genres.push({ id: doc.id, ...doc.data() });
    });

    return { status: "success", genres };
  } catch (error) {
    return { status: "error" };
  }
});

export default {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getGenres,
};
