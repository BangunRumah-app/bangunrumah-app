// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyABChoNKoFO80qOjqIh9WnRllmPItx32ao",
  authDomain: "bangunrumah-ef2b9.firebaseapp.com",
  projectId: "bangunrumah-ef2b9",
  storageBucket: "bangunrumah-ef2b9.appspot.com", // ← diperbaiki dari .firebasestorage.app
  messagingSenderId: "170653247859",
  appId: "1:170653247859:web:35d3360b8f1223885cfd06",
  measurementId: "G-RGYTBW1LLE"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Export service Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
