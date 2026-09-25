import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import NewTask from './components/NewTask';
import AdminUsers from './components/AdminUsers';
import AdminTasks from './components/AdminTasks';
import Profile from './components/Profile';
import { refreshToken, logoutUser, getCurrentUser } from './api';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('tasktrack_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const data = await refreshToken();
        if (data?.access_token) {
          setToken(data.access_token);
          const user = await getCurrentUser();
          setCurrentUser(user);
        }
      } catch {
        localStorage.removeItem('tasktrack_token');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = async (tokenData) => {
    setToken(tokenData.access_token);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setToken(null);
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !token ? (
              <div className="min-h-screen bg-surface flex flex-col">
                <Auth initialMode="signin" onLoginSuccess={handleLoginSuccess} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !token ? (
              <div className="min-h-screen bg-surface flex flex-col">
                <Auth initialMode="signup" onLoginSuccess={handleLoginSuccess} />
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            token ? (
              <Dashboard currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tasks/new"
          element={
            token ? (
              <NewTask onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tasks/:id/edit"
          element={
            token ? (
              <NewTask onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tasks/edit/:id"
          element={
            token ? (
              <NewTask onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            token ? (
              <Profile currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* ─── Admin Routes ──────────────────────────────────────────────── */}
        <Route
          path="/admin/users"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : currentUser?.role === 'admin' ? (
              <AdminUsers currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/tasks"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : currentUser?.role === 'admin' ? (
              <AdminTasks currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
