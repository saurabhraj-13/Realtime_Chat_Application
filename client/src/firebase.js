import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCehdI4IshmCZlfW_J1214JCo8ls_hMDC0",
  authDomain: "real-time-chat-applicati-f13a3.firebaseapp.com",
  projectId: "real-time-chat-applicati-f13a3",
  storageBucket: "real-time-chat-applicati-f13a3.firebasestorage.app",
  messagingSenderId: "274939490985",
  appId: "1:274939490985:web:fa59f25ddb64b631876fb8",
  measurementId: "G-BQ6H9JHTNJ"
};

const firebaseApp = initializeApp(firebaseConfig);

const firebaseAuth = getAuth(firebaseApp);

export { firebaseAuth };

export default firebaseApp;