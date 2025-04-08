/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { auth } from "firebase-functions/v1";

// Initialize Firebase Admin
admin.initializeApp();

// Function that runs when a user is created in Firebase Authentication
export const createUserProfile = auth.user().onCreate(async (user) => {
  try {
    // Extract user information
    const { uid, email, displayName, photoURL } = user;

    // Create a user profile document in Firestore
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

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
