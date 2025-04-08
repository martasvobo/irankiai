/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Create a movie
export const createMovie = functions.https.onRequest(async (req, res) => {
  try {
    const { title, director, releaseYear } = req.body;
    if (!title || !director || !releaseYear) {
      res
        .status(400)
        .send("Missing required fields: title, director, releaseYear");
      return;
    }

    const movie = { title, director, releaseYear };
    const docRef = await db.collection("movies").add(movie);
    res.status(201).send({ id: docRef.id, ...movie });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Read a movie by ID
export const getMovie = functions.https.onRequest(async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).send("Missing movie ID");
      return;
    }

    const doc = await db
      .collection("movies")
      .doc(id as string)
      .get();
    if (!doc.exists) {
      res.status(404).send("Movie not found");
      return;
    }

    res.status(200).send(doc.data());
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Update a movie by ID
export const updateMovie = functions.https.onRequest(async (req, res) => {
  try {
    const { id } = req.query;
    const { title, director, releaseYear } = req.body;
    if (!id || (!title && !director && !releaseYear)) {
      res.status(400).send("Missing required fields or movie ID");
      return;
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (director) updates.director = director;
    if (releaseYear) updates.releaseYear = releaseYear;

    await db
      .collection("movies")
      .doc(id as string)
      .update(updates);
    res.status(200).send("Movie updated successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete a movie by ID
export const deleteMovie = functions.https.onRequest(async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).send("Missing movie ID");
      return;
    }

    await db
      .collection("movies")
      .doc(id as string)
      .delete();
    res.status(200).send("Movie deleted successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
