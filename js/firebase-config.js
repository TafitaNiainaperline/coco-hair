// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAscU390XOZSNCikhP6Hq5Q0Y_xelV50xo",
  authDomain: "cocohair-54b52.firebaseapp.com",
  projectId: "cocohair-54b52",
  storageBucket: "cocohair-54b52.firebasestorage.app",
  messagingSenderId: "146201109778",
  appId: "1:146201109778:web:a0f5292debaa3ce1b33fcb",
  measurementId: "G-11Q2JB0XLM"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export functions
export { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot };
