import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ARABIC_TEXTS } from '../constants/arabic';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate("/home");
    } catch (err) {
      setError(ARABIC_TEXTS.SIGN_IN_ERROR);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate("/home");
    } catch (err) {
      setError(ARABIC_TEXTS.GOOGLE_SIGN_IN_ERROR);
    }
  };

  return (
    <div className="sign-in p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">{ARABIC_TEXTS.SIGN_IN}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <input
          type="email"
          placeholder={ARABIC_TEXTS.EMAIL}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="password"
          placeholder={ARABIC_TEXTS.PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          {ARABIC_TEXTS.SIGN_IN}
        </button>
      </form>
      <button
        onClick={handleGoogleSignIn}
        className="mt-4 bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow flex items-center"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="w-6 h-6 mr-2"
        />
        {ARABIC_TEXTS.SIGN_IN_WITH_GOOGLE}
      </button>
    </div>
  );
};

export default SignIn;
