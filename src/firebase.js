// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCIYqi5Q5gWR1TOlCwzbq_t0o6qnyuK6HE",
  authDomain: "quiz-app-c8c7c.firebaseapp.com",
  projectId: "quiz-app-c8c7c",
  storageBucket: "quiz-app-c8c7c.firebasestorage.app",
  messagingSenderId: "823094975786",
  appId: "1:823094975786:web:15059f6ca6ab7856ea5253",
  measurementId: "G-Z173CBYQZP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
