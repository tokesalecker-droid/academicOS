import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDY396Z48rLf5a5jLYxwjKXfQ4_81KiT7s",
  authDomain: "academicos-9a3fe.firebaseapp.com",
  projectId: "academicos-9a3fe",
  storageBucket: "academicos-9a3fe.firebasestorage.app",
  messagingSenderId: "542813043369",
  appId: "1:542813043369:web:3a3cdca9306c80adf647b8",
  measurementId: "G-NT6MVV6H4V"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
