import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useUserRole } from '../hooks/useUserRole';

interface Project {
  id: string;
  name: string;
  users: string[];
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const role = useUserRole();

  useEffect(() => {
    const fetchProjects = async () => {
      const q = query(collection(db, 'projects'));
      const querySnapshot = await getDocs(q);
      const projectList: Project[] = [];
      querySnapshot.forEach((doc) => {
        projectList.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectList);
    };

    fetchProjects();
  }, []);

  return (
    <div className="project-list">
      <h2>المشاريع</h2>
      {projects.map((project) => (
        <div key={project.id} className="project-item">
          <Link to={`/project/${project.id}`}>{project.name}</Link>
          {role === 'admin' && (
            <p>المستخدمون: {project.users.join(', ')}</p>
          )}
        </div>
      ))}
      {(role === 'admin' || role === 'collaborator') && (
        <button>إضافة مشروع جديد</button>
      )}
    </div>
  );
};

export default ProjectList;