
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types'; // Your custom User type
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
}

interface SignUpData {
  fullName: string;
  email: string;
  passwordOne: string;
  country: string;
}

interface SignInData {
  email: string;
  passwordOne: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch additional user profile data from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || userData.fullName,
            country: userData.country,
          });
        } else {
          // This case might happen if Firestore doc creation failed or user signed up elsewhere
           setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async ({ fullName, email, passwordOne, country }: SignUpData) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, passwordOne);
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // Store additional user info in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        fullName,
        email,
        country,
        createdAt: serverTimestamp(),
      });
      
      setCurrentUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: fullName,
        country,
      });
      toast({ title: "Success", description: "Account created successfully!" });
      router.push('/'); // Redirect to home or dashboard
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const signIn = useCallback(async ({ email, passwordOne }: SignInData) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, passwordOne);
      toast({ title: "Success", description: "Signed in successfully!" });
      router.push('/'); // Redirect to home or dashboard
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      toast({ title: "Success", description: "Signed out successfully." });
      router.push('/login'); // Redirect to login page
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  return (
    <AuthContext.Provider value={{ currentUser, firebaseUser, loading, error, signUp, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
