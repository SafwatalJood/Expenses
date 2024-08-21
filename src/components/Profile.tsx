import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useUserRole } from "../hooks/useUserRole";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ARABIC_TEXTS } from '../constants/arabic';

interface Project {
  id: string;
  name: string;
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const userRole = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (user) {
        const q = query(collection(db, "projects"), where("users", "array-contains", user.uid));
        const querySnapshot = await getDocs(q);
        const userProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          userProjects.push({ id: doc.id, name: doc.data().name });
        });
        setProjects(userProjects);
      }
    };

    fetchUserProjects();
  }, [user]);

  if (!user) {
    return <div className="text-center p-4">{ARABIC_TEXTS.PLEASE_SIGN_IN}</div>;
  }

  return (
    <div className="profile p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">{ARABIC_TEXTS.PROFILE}</h2>
      <div className="mx-auto max-w-2xl">
        <p className="mb-2">{ARABIC_TEXTS.EMAIL}: {user.email}</p>
        <p className="mb-4">{ARABIC_TEXTS.ROLE}: {ARABIC_TEXTS[userRole?.toUpperCase() || 'VIEWER']}</p>
        <h3 className="text-xl font-semibold mt-4 mb-2">{ARABIC_TEXTS.ASSIGNED_PROJECTS}:</h3>
        {projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className="bg-white shadow-md rounded-lg p-4 mb-2">
              {project.name}
            </div>
          ))
        ) : (
          <p className="text-gray-500">{ARABIC_TEXTS.NO_ASSIGNED_PROJECTS}</p>
        )}
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600 transition-colors duration-300"
        >
          {ARABIC_TEXTS.SIGN_OUT}
        </button>
      </div>
    </div>
  );
};

export default Profile;
