import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';  // Optional, only if using Firestore for metadata
import { getAuth } from 'firebase/auth';
// Your Firebase configuration (replace with your Firebase credentials)
const firebaseConfig = {
    apiKey: "AIzaSyDEOKNyDSsGGpHSHCreZWsQ3Uhl3a0OK14",
    authDomain: "real-9f3b8.firebaseapp.com",
    projectId: "real-9f3b8",
    storageBucket: "real-9f3b8.appspot.com",
    messagingSenderId: "702132684178",
    appId: "1:702132684178:web:228b38d2a443f20435ad4b"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Storage reference
const storage = getStorage(app);
const auth = getAuth(app);
// Firestore (Optional for storing metadata)
const firestore = getFirestore(app);

export { storage, firestore, app, auth }; 
