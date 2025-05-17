// functions/src/controllers/checkoutController.ts
import * as functions from "firebase-functions/v1";
import * as admin     from "firebase-admin";
import Stripe         from "stripe";

// Read your config vars the same way you already do elsewhere:
const stripeSecret = functions.config().stripe.secret as string;
const appUrl       = functions.config().app.url as string;

// Initialize Stripe client
const stripe = new Stripe(stripeSecret /*, { apiVersion: "2025-04-30.basil" } */);

export const createCheckoutSession = functions
  .region("europe-west1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to purchase tickets."
      );
    }

    const screeningId = data.screeningId as string;
    const doc = await admin
      .firestore()
      .collection("movieScreenings")
      .doc(screeningId)
      .get();
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
      mode:       "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  appUrl,
    });

    return { sessionId: session.id };
  });