import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Profile from "./components/Profile";
import Home from "./components/Home";
import AddProject from "./components/AddProject";
import SignIn from "./components/SignIn";
import WelcomeScreen from "./components/WelcomeScreen";
import BottomTabBar from "./components/BottomTabBar";
import UserManagement from "./components/UserManagement";
import PrivateRoute from "./components/PrivateRoute";
import ProjectDetails from "./components/ProjectDetails";
import EditProject from "./components/EditProject";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app flex flex-col min-h-screen">
          <main className="flex-grow main-content">
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/add-project" element={<PrivateRoute><AddProject /></PrivateRoute>} />
              <Route path="/user-management" element={<PrivateRoute requireAdmin><UserManagement /></PrivateRoute>} />
              <Route path="/project/:id" element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
              <Route path="/edit-project/:id" element={<PrivateRoute requireAdmin><EditProject /></PrivateRoute>} />
            </Routes>
          </main>
          <BottomTabBar />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
