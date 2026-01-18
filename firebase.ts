
// Using Google's official CDN ensures that the firebase-app and firebase-firestore 
// modules share the same global instance context, preventing "Service not available" errors.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your Apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

let app;
let db;

// Check if config is still default placeholder
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
                     firebaseConfig.projectId !== "your-project-id";

if (isConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    // Initialize Cloud Firestore and get a reference to the service
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // We don't crash here, db will be undefined, handled in store.ts
  }
} else {
  console.log("Firebase configuration is missing or default. App running in Offline/Demo mode.");
}

// Export initialized instances and functions
export { 
  db,
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs
};
