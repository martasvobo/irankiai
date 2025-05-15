import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/https";
const db = admin.firestore();

const getCinemas = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("cinemas").get();
    const cinemas: any[] = [];
    snapshot.forEach((doc) => {
      cinemas.push({ id: doc.id, ...doc.data() });
    });
    return { status: "success", cinemas };
  } catch (error) {
    logger.error("Error fetching cinemas:", error);
    return { status: "error" };
  }
});

const createCinema = onCall({ region: "europe-west1" }, async (request) => {
  const { name, address, email } = request.data as any;
  logger.info("Creating cinema:", name, address, email);
  try {
    const newCinema = { name, address, email };
    const docRef = await db.collection("cinemas").add(newCinema);
    return { status: "success", id: docRef.id };
  } catch (error) {
    logger.error("Error creating cinema:", error);
    return { status: "error" };
  }
});

const updateCinema = onCall({ region: "europe-west1" }, async (request) => {
  const { id, name, address, email } = request.data as any;
  logger.info("Updating cinema:", id, name, address, email);
  try {
    const cinemaRef = db.collection("cinemas").doc(id);
    await cinemaRef.update({ name, address, email });
    return { status: "success" };
  } catch (error) {
    logger.error("Error updating cinema:", error);
    return { status: "error" };
  }
});

const deleteCinema = onCall({ region: "europe-west1" }, async (request) => {
  const { id } = request.data as any;
  logger.info("Deleting cinema with ID:", id);
  try {
    const cinemaRef = db.collection("cinemas").doc(id);
    await cinemaRef.delete();
    return { status: "success" };
  } catch (error) {
    logger.error("Error deleting cinema:", error);
    return { status: "error" };
  }
});

export default {
  getCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
};
