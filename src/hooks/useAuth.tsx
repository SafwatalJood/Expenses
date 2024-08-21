import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ARABIC_TEXTS } from '../constants/arabic';

interface AuthUser extends User {
  role?: 'admin' | 'collaborator' | 'viewer';
}

interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          let role: 'admin' | 'collaborator' | 'viewer' = 'viewer';
          if (userSnap.exists()) {
            role = userSnap.data().role || 'viewer';
          } else {
            await setDoc(userRef, {
              email: firebaseUser.email,
              role: 'viewer'
            });
          }
          setUser({ ...firebaseUser, role });
        } catch (err) {
          console.error("Error setting up user:", err);
          setError(ARABIC_TEXTS.ERROR_SETTING_UP_USER);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Error during sign-in:", err);
      setError(ARABIC_TEXTS.ERROR_SIGN_IN);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error("Error during Google sign-in:", err);
      setError(ARABIC_TEXTS.ERROR_SIGN_IN_GOOGLE);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Error during sign-out:", err);
      setError(ARABIC_TEXTS.ERROR_SIGN_OUT);
    }
  };

  const value = { user, signIn, signInWithGoogle, signOut, loading, error };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
