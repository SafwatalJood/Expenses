import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ARABIC_TEXTS } from '../constants/arabic';

const WelcomeScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="welcome-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">{ARABIC_TEXTS.WELCOME_TITLE}</h1>
      <p className="mb-4">{ARABIC_TEXTS.WELCOME_DESCRIPTION}</p>
      <div className="mb-4">
        <img
          src="/public/logo.png"
          alt={ARABIC_TEXTS.COMPANY_LOGO_ALT}
          className="rounded-lg shadow-md mx-auto"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-2">{ARABIC_TEXTS.FEATURES}:</h2>
      <ul className="list-disc list-inside mb-4">
        <li>{ARABIC_TEXTS.FEATURE_1}</li>
        <li>{ARABIC_TEXTS.FEATURE_2}</li>
        <li>{ARABIC_TEXTS.FEATURE_3}</li>
        <li>{ARABIC_TEXTS.FEATURE_4}</li>
        <li>{ARABIC_TEXTS.FEATURE_5}</li>
      </ul>
      {user ? (
        <Link to="/home" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">
          {ARABIC_TEXTS.GO_TO_DASHBOARD}
        </Link>
      ) : (
        <Link to="/signin" className="bg-blue-500 text-white px-4 py-2 rounded mt-4 inline-block">
          {ARABIC_TEXTS.SIGN_IN}
        </Link>
      )}
    </div>
  );
};

export default WelcomeScreen;
