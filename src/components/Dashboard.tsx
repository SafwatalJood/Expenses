import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import ProjectList from './ProjectList';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const role = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h1>لوحة التحكم</h1>
      <p>مرحبًا، {user?.email}</p>
      <p>الدور: {role}</p>
      {role === 'admin' && (
        <button onClick={() => navigate('/users')}>إدارة المستخدمين</button>
      )}
      <ProjectList />
      <button onClick={handleSignOut}>تسجيل الخروج</button>
    </div>
  );
};

export default Dashboard;