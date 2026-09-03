import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    projectId: "fledgeportal",
    appId: "1:844515198625:web:d1febaeabb62cc7756d2e0",
    storageBucket: "fledgeportal.firebasestorage.app",
    apiKey: "AIzaSyCLAPwadPE7TDzrkZoH7ax_CrR6b3RP054",
    authDomain: "fledgeportal.firebaseapp.com",
    messagingSenderId: "844515198625",
    measurementId: "G-V9FHCDV2G8"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
const db = getFirestore(app);

export { app, auth, googleProvider, db };
