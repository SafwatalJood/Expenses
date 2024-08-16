// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOkIghRKHFsP1WVbm_IzrnVjM2a0U62cs",
  authDomain: "expense-tracker-412b2.firebaseapp.com",
  projectId: "expense-tracker-412b2",
  storageBucket: "expense-tracker-412b2.appspot.com",
  messagingSenderId: "802525395906",
  appId: "1:802525395906:web:fd6e26ab26388cfd59b45b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };