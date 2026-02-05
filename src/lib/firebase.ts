import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase configuration
// These are publishable keys - safe to include in client code
const firebaseConfig = {
  apiKey: "AIzaSyDk23G58kVrMGBYIzbSHYvnN_tKcSDA9JY",
  authDomain: "akad-fbe7e.firebaseapp.com",
  databaseURL: "https://akad-fbe7e-default-rtdb.firebaseio.com",
  projectId: "akad-fbe7e",
  storageBucket: "akad-fbe7e.appspot.com",
  messagingSenderId: "1024774175861",
  appId: "1:1024774175861:web:92bea89967818b9d7e4c3c",
};

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

// Only initialize Firebase if configured
if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    client_id: "1024774175861-a9u1eoqrqajjt629velbaokr3cc8fv1q.apps.googleusercontent.com"
  });
}

export { auth, db, storage, googleProvider };
export default app;
