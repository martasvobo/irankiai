import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: "AIzaSyAwxpj3E6-Ldf8LRlhvIHkWwonc1q6PXVU",
  authDomain: "irankiai.firebaseapp.com",
  projectId: "irankiai",
  storageBucket: "irankiai.firebasestorage.app",
  messagingSenderId: "476742135916",
  appId: "1:476742135916:web:0a85ca4e2d244e1bc56849",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, "europe-west1");
export const db = getFirestore(app);