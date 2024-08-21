import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQbYhbFlXYvDulCPz66DJEK2U7WU86Q5s",
  authDomain: "expenses-tracker-827f1.firebaseapp.com",
  projectId: "expenses-tracker-827f1",
  storageBucket: "expenses-tracker-827f1.appspot.com",
  messagingSenderId: "858895476521",
  appId: "1:858895476521:web:69ad912212e9b1067b7938"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);