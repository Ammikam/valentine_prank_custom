
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD2JDKXZonrK2cdXGkZx1JWjfSQtU8tDrg",
  authDomain: "valentines-3c364.firebaseapp.com",
  databaseURL: "https://valentines-3c364-default-rtdb.firebaseio.com",
  projectId: "valentines-3c364",
  storageBucket: "valentines-3c364.firebasestorage.app",
  messagingSenderId: "998587613936",
  appId: "1:998587613936:web:348caf513e709c12797835",
  measurementId: "G-3NKXPMKLC9"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);