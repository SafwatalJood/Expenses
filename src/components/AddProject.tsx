import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { ARABIC_TEXTS } from '../constants/arabic';

const AddProject: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(ARABIC_TEXTS.AUTHENTICATION_ERROR);
      return;
    }

    if (!name.trim()) {
      setError(ARABIC_TEXTS.PROJECT_NAME_REQUIRED);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: name.trim(),
        description: description.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        totalExpenses: 0,
        totalDeposits: 0,
      });

      console.log("Project created with ID: ", docRef.id);
      setName("");
      setDescription("");
      navigate("/home");
    } catch (error) {
      console.error("Error adding project:", error);
      setError(ARABIC_TEXTS.PROJECT_CREATION_ERROR);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-project p-4 mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 text-center">{ARABIC_TEXTS.ADD_PROJECT}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
          {ARABIC_TEXTS.PROJECT_NAME}
        </label>
        <input
          type="text"
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
          {ARABIC_TEXTS.PROJECT_DESCRIPTION} ({ARABIC_TEXTS.OPTIONAL})
        </label>
        <textarea
          id="projectDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors duration-300"
      >
        {ARABIC_TEXTS.ADD_PROJECT}
      </button>
    </form>
  );
};

export default AddProject;
