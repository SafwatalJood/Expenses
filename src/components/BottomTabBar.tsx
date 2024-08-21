import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home as HomeIcon, User, PlusSquare, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ARABIC_TEXTS } from '../constants/arabic';

const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="bottom-nav bg-gray-800 text-white p-4 flex justify-around items-center fixed bottom-0 left-0 right-0 z-50">
      <Link
        to="/home"
        className={`text-2xl ${location.pathname === "/home" ? "text-blue-400" : ""}`}
        aria-label={ARABIC_TEXTS.HOME}
      >
        <HomeIcon size={24} />
      </Link>
      {(user.role === 'admin' || user.role === 'collaborator') && (
        <Link
          to="/add-project"
          className={`text-2xl ${location.pathname === "/add-project" ? "text-blue-400" : ""}`}
          aria-label={ARABIC_TEXTS.ADD_PROJECT}
        >
          <PlusSquare size={24} />
        </Link>
      )}
      {user.role === 'admin' && (
        <Link
          to="/user-management"
          className={`text-2xl ${location.pathname === "/user-management" ? "text-blue-400" : ""}`}
          aria-label={ARABIC_TEXTS.USER_MANAGEMENT}
        >
          <Users size={24} />
        </Link>
      )}
      <Link
        to="/profile"
        className={`text-2xl ${location.pathname === "/profile" ? "text-blue-400" : ""}`}
        aria-label={ARABIC_TEXTS.PROFILE}
      >
        <User size={24} />
      </Link>
    </nav>
  );
};

export default BottomTabBar;
