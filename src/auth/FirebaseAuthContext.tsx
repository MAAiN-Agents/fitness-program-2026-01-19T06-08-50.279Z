import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  hasConfig: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
};

const hasConfig = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = hasConfig
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

console.log("the NODE_ENV + ", process.env.REACT_APP_NODE_ENV)
if (auth && (process.env.REACT_APP_NODE_ENV === "development" || process.env.NODE_ENV === "development")) {
  connectAuthEmulator(auth, "http://localhost:9099");
}
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.setCustomParameters({ prompt: "select_account" });

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      hasConfig,
      signInWithGoogle: async () => {
        if (!auth || !hasConfig) {
          throw new Error("Firebase Auth is not configured.");
        }
        await signInWithPopup(auth, provider);
      },
      signOut: async () => {
        if (!auth) return;
        await signOut(auth);
      },
      getIdToken: async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null),
    }),
    [user, loading, hasConfig]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider.");
  }
  return ctx;
}
