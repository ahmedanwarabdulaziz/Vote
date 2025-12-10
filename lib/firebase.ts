import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, ref, get } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBQpfrBbc08cG81__h1KBK86pbQYzq0gFM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vote-732f7.firebaseapp.com",
  databaseURL: (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://vote-732f7-default-rtdb.firebaseio.com").replace(/\/$/, ''),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vote-732f7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vote-732f7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "139607071592",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:139607071592:web:738a931e5ccce1715954dd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Connection status monitoring
export function monitorConnectionStatus(
  onStatusChange: (isOnline: boolean, isDatabaseConnected: boolean) => void
): () => void {
  let isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
  let isDatabaseConnected = false;

  // Monitor browser online/offline (only in browser)
  const handleOnline = () => {
    isOnline = true;
    onStatusChange(isOnline, isDatabaseConnected);
  };
  const handleOffline = () => {
    isOnline = false;
    isDatabaseConnected = false;
    onStatusChange(false, false);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Monitor Firebase database connection
  const connectedRef = ref(database, '.info/connected');
  const unsubscribe = onValue(
    connectedRef,
    (snapshot) => {
      isDatabaseConnected = snapshot.val() === true;
      onStatusChange(isOnline, isDatabaseConnected);
    },
    (error) => {
      console.error('Firebase connection error:', error);
      isDatabaseConnected = false;
      onStatusChange(isOnline, false);
    }
  );

  // Test database connection with a simple read (non-blocking)
  // This is handled by the onValue listener above, so we don't need a separate test

  // Initial status
  onStatusChange(isOnline, false);

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
    unsubscribe();
  };
}

