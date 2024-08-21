import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ARABIC_TEXTS } from '../constants/arabic';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'collaborator' | 'viewer';
  assignedProjects: string[];
}

interface Project {
  id: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsersAndProjects = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(), 
          assignedProjects: doc.data().assignedProjects || [] 
        } as User));
        setUsers(usersData);

        const projectsQuery = query(collection(db, 'projects'));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setProjects(projectsData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching users and projects:', err);
        setError(ARABIC_TEXTS.LOAD_USERS_PROJECTS_ERROR);
        setLoading(false);
      }
    };

    fetchUsersAndProjects();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'collaborator' | 'viewer') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
      setError(ARABIC_TEXTS.UPDATE_USER_ROLE_ERROR);
    }
  };

  const handleProjectAssignment = async (userId: string, projectId: string, assign: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      let assignedProjects = [...user.assignedProjects];

      if (assign) {
        assignedProjects = [...new Set([...assignedProjects, projectId])];
      } else {
        assignedProjects = assignedProjects.filter(id => id !== projectId);
      }

      await updateDoc(userRef, { assignedProjects });
      setUsers(users.map(u => u.id === userId ? { ...u, assignedProjects } : u));
    } catch (error) {
      console.error('Error updating project assignment:', error);
      setError(ARABIC_TEXTS.UPDATE_PROJECT_ASSIGNMENT_ERROR);
    }
  };

  if (loading) return <div className="loading">{ARABIC_TEXTS.LOADING}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-management p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">{ARABIC_TEXTS.USER_MANAGEMENT}</h2>
      {users.map(user => (
        <div key={user.id} className="user-item mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h3 className="text-xl mb-4 font-semibold text-right">{user.email}</h3>
          <div className="mb-4">
            <label className="mr-2 font-medium text-right">{ARABIC_TEXTS.ROLE}:</label>
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'collaborator' | 'viewer')}
              className="p-2 border rounded-md bg-gray-50 text-right"
              style={{ width: '100%', maxWidth: '200px', padding: '8px', borderRadius: '5px', background: '#f9f9f9', border: '1px solid #ccc' }}
            >
              <option value="admin">{ARABIC_TEXTS.ADMIN}</option>
              <option value="collaborator">{ARABIC_TEXTS.COLLABORATOR}</option>
              <option value="viewer">{ARABIC_TEXTS.VIEWER}</option>
            </select>
          </div>
          <div>
            <h4 className="text-lg mb-3 font-medium text-right">{ARABIC_TEXTS.ASSIGNED_PROJECTS}:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {projects.map(project => (
                <label key={project.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 transition-colors text-right">
                  <input
                    type="checkbox"
                    checked={user.assignedProjects.includes(project.id)}
                    onChange={(e) => handleProjectAssignment(user.id, project.id, e.target.checked)}
                    className="ml-2 form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserManagement;
