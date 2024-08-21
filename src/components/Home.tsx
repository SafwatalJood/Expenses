import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ARABIC_TEXTS, formatCurrency } from '../constants/arabic';

interface Project {
  id: string;
  name: string;
  totalExpenses: number;
  totalDeposits: number;
}

const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const projectsQuery = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
          projectsQuery, 
          async (snapshot) => {
            const projectPromises = snapshot.docs.map(async (docSnapshot) => {
              const projectData = docSnapshot.data();
              const projectRef = doc(db, "projects", docSnapshot.id);
              const projectDoc = await getDoc(projectRef);

              return {
                id: docSnapshot.id,
                name: projectData.name,
                totalExpenses: projectDoc.data()?.totalExpenses || 0,
                totalDeposits: projectDoc.data()?.totalDeposits || 0
              };
            });

            const projectList = await Promise.all(projectPromises);
            setProjects(projectList);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching projects:", error);
            setError(ARABIC_TEXTS.FAILED_LOAD_PROJECTS);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(ARABIC_TEXTS.ERROR_FETCHING_PROJECTS);
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user, navigate]);

  if (loading) return <div className="text-center p-4">{ARABIC_TEXTS.LOADING}</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="home p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4 text-center">{ARABIC_TEXTS.PROJECTS_DASHBOARD}</h1>
      <div className="max-w-6xl mx-auto">
        {projects.length === 0 ? (
          <p className="text-center text-gray-500">{ARABIC_TEXTS.NO_PROJECTS}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="project bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                <h2 className="text-xl font-bold mb-3 text-center">{project.name}</h2>
                <div className="flex justify-between items-center mb-2">
                  <span>{ARABIC_TEXTS.TOTAL_EXPENSES}:</span>
                  <span className="negative-amount">{formatCurrency(project.totalExpenses)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>{ARABIC_TEXTS.TOTAL_DEPOSITS}:</span>
                  <span className="positive-amount">{formatCurrency(project.totalDeposits)}</span>
                </div>
                <div className="text-center mt-3">
                  <Link 
                    to={`/project/${project.id}`} 
                    className="btn btn-primary w-full"
                  >
                    {ARABIC_TEXTS.VIEW_DETAILS}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(user?.role === 'admin' || user?.role === 'collaborator') && (
        <div className="fixed bottom-20 right-4 z-10">
          <Link to="/add-project" className="btn btn-primary rounded-full shadow-lg">
            {ARABIC_TEXTS.ADD_PROJECT}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
