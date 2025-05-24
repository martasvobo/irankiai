// functions/src/controllers/checkoutController.ts

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import Stripe from "stripe";

export const createCheckoutSession = functions
  .region("europe-west1")
  .runWith({
    secrets: ["STRIPE_SECRET"],
  })
  .https.onCall(async (data, context) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET! /*, { apiVersion: "2025-04-30.basil" } */);
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be signed in to purchase tickets.");
    }

    const screeningId = data.screeningId as string;
    const doc = await admin.firestore().collection("movieScreenings").doc(screeningId).get();
    if (!doc.exists) {
      throw new functions.https.HttpsError("not-found", "Screening not found");
    }
    const screening = doc.data()!;
    const unitAmount = screening.priceCents || 1000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: unitAmount,
            product_data: {
              name: `Ticket for ${screening.movieTitle}`,
              description: `${screening.cinemaName} – Hall ${screening.hall}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://irankiai.web.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://irankiai.web.app",
    });

    return { sessionId: session.id };
  });
