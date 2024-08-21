import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ARABIC_TEXTS } from '../constants/arabic';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserRole(userSnap.data().role);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setError(ARABIC_TEXTS.ERROR_FETCHING_USER_ROLE);
        }
      }
      setLoading(false);
    };

    checkUserRole();
  }, [user]);

  if (loading) {
    return <div>{ARABIC_TEXTS.LOADING}</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
