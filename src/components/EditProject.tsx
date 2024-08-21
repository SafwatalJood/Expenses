import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { ARABIC_TEXTS } from '../constants/arabic';

const EditProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const userRole = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const docRef = doc(db, 'projects', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProject({ name: docSnap.data().name, description: docSnap.data().description });
          } else {
            setError(ARABIC_TEXTS.PROJECT_NOT_FOUND);
          }
        } catch (err) {
          setError(ARABIC_TEXTS.FETCH_ERROR);
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProject();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || userRole !== 'admin') return;

    try {
      await updateDoc(doc(db, 'projects', id), {
        name: project.name,
        description: project.description,
        updatedBy: user.email,
        updatedAt: new Date(),
      });
      navigate(`/project/${id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      setError(ARABIC_TEXTS.UPDATE_ERROR);
    }
  };

  if (loading) return <div className="loading">{ARABIC_TEXTS.LOADING}</div>;
  if (error) return <div className="error">{error}</div>;
  if (userRole !== 'admin') return <div className="error">{ARABIC_TEXTS.UNAUTHORIZED}</div>;

  return (
    <div className="edit-project p-4 rtl">
      <h1 className="text-2xl font-bold mb-4">{ARABIC_TEXTS.EDIT_PROJECT}</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2">{ARABIC_TEXTS.PROJECT_NAME}</label>
          <input
            type="text"
            id="name"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block mb-2">{ARABIC_TEXTS.PROJECT_DESCRIPTION}</label>
          <textarea
            id="description"
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            className="w-full p-2 border rounded"
            rows={4}
          ></textarea>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
          {ARABIC_TEXTS.UPDATE_PROJECT}
        </button>
      </form>
    </div>
  );
};

export default EditProject;
