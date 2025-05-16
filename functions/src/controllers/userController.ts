import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onCall } from "firebase-functions/https";
const db = admin.firestore();

const getUsers = onCall({ region: "europe-west1" }, async () => {
  try {
    const snapshot = await db.collection("users").get();
    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { status: "success", users };
  } catch (error) {
    logger.error("Error fetching users:", error);
    return { status: "error" };
  }
});

const createUser = onCall({ region: "europe-west1" }, async (request) => {
  const { username, email, password, description, type, cinemaId } = request.data as any;
  logger.info("Creating user:", username, email, type);
  try {
    if (type === "cinemaWorker" && !cinemaId) {
      logger.error("cinemaWorker must have a cinemaId");
      return { status: "error", message: "cinemaWorker must have a cinemaId" };
    }
    const newUser: any = { username, email, description, type };
    if (type === "cinemaWorker") {
      newUser.cinemaId = cinemaId;
    }
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username || email,
    });
    await db.collection("users").doc(userRecord.uid).set(newUser);
    return { status: "success", id: userRecord.uid };
  } catch (error) {
    logger.error("Error creating user:", error);
    return { status: "error" };
  }
});

const updateUser = onCall({ region: "europe-west1" }, async (request) => {
  const { id, username, email, description, type, password, cinemaId } = request.data as any;
  logger.info("Updating user:", id, username, email, type);
  try {
    if (type === "cinemaWorker" && !cinemaId) {
      logger.error("cinemaWorker must have a cinemaId");
      return { status: "error", message: "cinemaWorker must have a cinemaId" };
    }
    const userRef = db.collection("users").doc(id);
    await admin.auth().updateUser(id, {
      password,
      displayName: username,
      email,
    });
    const updatedUser: any = {
      username,
      email,
      description,
      type,
    };
    if (type === "cinemaWorker") {
      updatedUser.cinemaId = cinemaId;
    } else {
      updatedUser.cinemaId = admin.firestore.FieldValue.delete();
    }
    await userRef.update(updatedUser);
    return { status: "success" };
  } catch (error) {
    logger.error("Error updating user:", error);
    return { status: "error" };
  }
});

const deleteUser = onCall({ region: "europe-west1" }, async (request) => {
  const { id } = request.data as any;
  logger.info("Deleting user with ID:", id);
  try {
    const userRef = db.collection("users").doc(id);
    await userRef.delete();
    await admin.auth().deleteUser(id);
    const personalMoviesSnapshot = await db.collection("personalMovies").where("userId", "==", id).get();
    personalMoviesSnapshot.forEach(async (doc) => {
      await db.collection("personalMovies").doc(doc.id).delete();
    });
    return { status: "success" };
  } catch (error) {
    logger.error("Error deleting user:", error);
    return { status: "error" };
  }
});

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
