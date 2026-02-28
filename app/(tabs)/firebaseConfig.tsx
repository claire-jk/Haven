// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAd_XROSvZYvToqNAbIeUpyK8ioLNuH6SA",
  authDomain: "haven-c1607.firebaseapp.com",
  projectId: "haven-c1607",
  storageBucket: "haven-c1607.firebasestorage.app",
  messagingSenderId: "484805354919",
  appId: "1:484805354919:web:acf39d42722f8c43cac282",
  measurementId: "G-NR0B6CX77T"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 關鍵在於這裡的 export
export const db = getFirestore(app);
export const auth = getAuth(app);