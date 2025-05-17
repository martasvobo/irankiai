// src/stripe.ts
import { loadStripe } from "@stripe/stripe-js";

// 🎯 Hard-code your test key here so you don’t have to wrestle with import.meta.env
export const stripePromise = loadStripe(
  "pk_test_51RPpaG2f3p7UdaEcnOeNLtdHe5mwfocIXq9FOUKHctuW715cGglRrkOLx6tcxNqHgxzn4LJra3KDziDLFy6yannN00SBBDv566"
);
