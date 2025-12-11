// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClWirh7KSLXmIoX67KjztqJGt6y-AVjPY",
  authDomain: "aitsevents-69178.firebaseapp.com",
  projectId: "aitsevents-69178",
  storageBucket: "aitsevents-69178.firebasestorage.app",
  messagingSenderId: "193302211072",
  appId: "1:193302211072:web:14f9252f67bdcec13246e5",
  measurementId: "G-V0Q0809XV5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };

