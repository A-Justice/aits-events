// Firebase configuration - Using CDN imports for production
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Re-export Firestore functions
export { 
    collection, 
    getDocs, 
    getDoc,
    addDoc, 
    updateDoc,
    deleteDoc,
    doc, 
    query, 
    where, 
    orderBy, 
    limit,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Re-export Auth functions
export { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Re-export Storage functions
export {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
