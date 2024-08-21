import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'collaborator' | 'viewer' | null;

export const useUserRole = (): UserRole => {
  const [role, setRole] = useState<UserRole>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setRole(doc.data().role as UserRole);
        }
      });

      return () => unsubscribe();
    } else {
      setRole(null);
    }
  }, [user]);

  return role;
};