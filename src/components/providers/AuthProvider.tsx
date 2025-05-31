
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
  updatePassword,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { User, AuthContextType, SignUpData, SignInData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


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
      setFirebaseUser(fbUser); // Store the raw FirebaseUser
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const appUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || userData.fullName,
            country: userData.country,
          };
          setCurrentUser(appUser);
        } else {
           // Fallback if Firestore doc doesn't exist (e.g. only Auth record)
           const appUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          };
          setCurrentUser(appUser);
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
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        fullName,
        email,
        country,
        createdAt: serverTimestamp(),
      });
      
      // No need to call setCurrentUser here, onAuthStateChanged will handle it
      toast({ title: "Success", description: "Account created successfully!" });
      router.push('/'); 
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
      // onAuthStateChanged will handle setting user and redirecting
      toast({ title: "Success", description: "Signed in successfully!" });
      router.push('/');
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
      // onAuthStateChanged will set currentUser to null
      toast({ title: "Success", description: "Signed out successfully." });
      router.push('/login'); 
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const updateProfileDisplayName = useCallback(async (newName: string): Promise<boolean> => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      // Update Firebase Auth display name
      await updateProfile(firebaseUser, { displayName: newName });

      // Update Firestore 'fullName' field
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { fullName: newName });

      // Update local currentUser state
      setCurrentUser(prevUser => prevUser ? { ...prevUser, displayName: newName } : null);
      
      toast({ title: "Success", description: "Your name has been updated." });
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: `Failed to update name: ${err.message}`, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, toast]);

  const updateUserPasswordInAuth = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "You must be logged in to update your password.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(firebaseUser, newPassword);
      toast({ title: "Success", description: "Your password has been updated successfully." });
      return true;
    } catch (err: any) {
      setError(err.message);
      // Firebase often requires recent login for password changes.
      let specificMessage = err.message;
      if (err.code === 'auth/requires-recent-login') {
        specificMessage = "This operation is sensitive and requires recent authentication. Please log out and log back in to update your password.";
      }
      toast({ title: "Error", description: `Failed to update password: ${specificMessage}`, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, toast]);


  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      firebaseUser, 
      loading, 
      error, 
      signUp, 
      signIn, 
      signOut,
      updateProfileDisplayName,
      updateUserPasswordInAuth
    }}>
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
