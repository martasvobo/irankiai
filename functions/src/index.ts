import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { auth } from "firebase-functions/v1";

admin.initializeApp();
import movieController from "./controllers/movieController";

export const createUserProfile = auth.user().onCreate(async (user) => {
  try {
    const { uid, email, displayName, photoURL } = user;

    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .set({
        uid,
        email: email || null,
        displayName: displayName || null,
        photoURL: photoURL || null,
        isAdmin: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.info(`User profile created for ${uid}`, { structuredData: true });
    return null;
  } catch (error) {
    logger.error("Error creating user profile:", error);
    return null;
  }
});

export const getMovies = movieController.getMovies;
export const createMovie = movieController.createMovie;
export const updateMovie = movieController.updateMovie;
export const deleteMovie = movieController.deleteMovie;
