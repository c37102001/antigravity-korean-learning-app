import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyB-jfMNzQBoBjf-Rabl2-V1bdI9btfAUEM",
    authDomain: "ko-learning-app.firebaseapp.com",
    projectId: "ko-learning-app",
    storageBucket: "ko-learning-app.firebasestorage.app",
    messagingSenderId: "274827027225",
    appId: "1:274827027225:web:0b9eaf3f503b3d51a2db88",
    measurementId: "G-D7ZK818CVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
