import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/https";
const db = admin.firestore();

const getMovieScreenings = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("movieScreenings").get();
    const movieScreenings: any[] = [];
    snapshot.forEach((doc) => {
      movieScreenings.push({ id: doc.id, ...doc.data() });
    });
    return { status: "success", movieScreenings };
  } catch (error) {
    logger.error("Error fetching movie screenings:", error);
    return { status: "error" };
  }
});

const createMovieScreening = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { tickedCount, date, hall } = request.data as any;
    logger.info("Creating movie screening:", tickedCount, date, hall);
    try {
      const newMovieScreening = { tickedCount, date: new Date(date), hall };
      const docRef = await db
        .collection("movieScreenings")
        .add(newMovieScreening);
      return { status: "success", id: docRef.id };
    } catch (error) {
      logger.error("Error creating movie screening:", error);
      return { status: "error" };
    }
  }
);

const updateMovieScreening = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { id, tickedCount, date, hall } = request.data as any;
    logger.info("Updating movie screening:", id, tickedCount, date, hall);
    try {
      const movieScreeningRef = db.collection("movieScreenings").doc(id);
      await movieScreeningRef.update({
        tickedCount,
        date: new Date(date),
        hall,
      });
      return { status: "success" };
    } catch (error) {
      logger.error("Error updating movie screening:", error);
      return { status: "error" };
    }
  }
);

const deleteMovieScreening = onCall(
  { region: "europe-west1" },
  async (request) => {
    const { id } = request.data as any;
    logger.info("Deleting movie screening with ID:", id);
    try {
      const movieScreeningRef = db.collection("movieScreenings").doc(id);
      await movieScreeningRef.delete();
      return { status: "success" };
    } catch (error) {
      logger.error("Error deleting movie screening:", error);
      return { status: "error" };
    }
  }
);

export default {
  getMovieScreenings,
  createMovieScreening,
  updateMovieScreening,
  deleteMovieScreening,
};
