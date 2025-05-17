// src/views/AvailableScreeningsPage.tsx

import React, { useEffect, useState } from "react";
import { Button, Card, List, Spin } from "antd";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { stripePromise } from "../stripe";     // ← only import this
import { Cinema } from "../types/cinema";
import { Movie } from "../types/movie";

// existing callables
const getMovieScreenings = httpsCallable(functions, "getMovieScreenings");
const getMovies           = httpsCallable(functions, "getMovies");
const getCinemas          = httpsCallable(functions, "getCinemas");
// new callable
const createCheckoutSession = httpsCallable(
  functions,
  "createCheckoutSession"
);

const AvailableScreeningsPage: React.FC = () => {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [movies, setMovies]         = useState<Movie[]>([]);
  const [cinemas, setCinemas]       = useState<Cinema[]>([]);
  const [loading, setLoading]       = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [scrRes, movRes, cinRes] = await Promise.all([
          getMovieScreenings(),
          getMovies(),
          getCinemas(),
        ]);
        setScreenings((scrRes.data as any).movieScreenings || []);
        setMovies((movRes.data as any).movies || []);
        setCinemas((cinRes.data as any).cinemas || []);
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getMovieTitle = (id: string) =>
    movies.find((m) => m.id === id)?.title || id;
  const getCinemaName = (id: string) =>
    cinemas.find((c) => c.id === id)?.name || id;

  const handlePurchase = async (screeningId: string) => {
    setCheckoutLoading(screeningId);
    try {
      // 1) spin up a Checkout session
      const { data } = await createCheckoutSession({ screeningId });
      const sessionId = (data as any).sessionId as string;

      // 2) redirect via stripePromise
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js failed to load");
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) console.error("Stripe redirect error:", error.message);
    } catch (e) {
      console.error("Purchase error:", e);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Available Movie Screenings
      </h2>

      {loading ? (
        <Spin size="large" style={{ display: "block", margin: "40px auto" }} />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={screenings}
          renderItem={(screening) => {
            const isCheckingOut = checkoutLoading === screening.id;
            // format date exactly as before…
            let dateStr: string;
            const d = screening.date;
            if (d && typeof d === "object" && typeof d.seconds === "number") {
              dateStr = new Date(d.seconds * 1000).toLocaleString();
            } else if (d && typeof d === "object" && d.$d) {
              dateStr = new Date(d.$d).toLocaleString();
            } else if (typeof d === "string" || d instanceof Date) {
              const parsed = new Date(d);
              dateStr = isNaN(parsed.getTime())
                ? "Invalid date"
                : parsed.toLocaleString();
            } else {
              dateStr = "Invalid date";
            }

            return (
              <List.Item>
                <Card
                  title={getMovieTitle(screening.movieId)}
                  extra={<span>{getCinemaName(screening.cinemaId)}</span>}
                >
                  <p>Date: {dateStr}</p>
                  <p>Hall: {screening.hall}</p>
                  <p>Tickets Sold: {screening.tickedCount}</p>
                  <Button
                    type="primary"
                    loading={isCheckingOut}
                    onClick={() => handlePurchase(screening.id)}
                  >
                    Purchase Ticket
                  </Button>
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default AvailableScreeningsPage;
