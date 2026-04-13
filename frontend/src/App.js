import React, { useState, useEffect } from 'react';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('healthai_token');
    const savedUser = localStorage.getItem('healthai_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setPage(parsedUser.role === 'admin' ? 'admin' : 'chat');
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('healthai_token', userToken);
    localStorage.setItem('healthai_user', JSON.stringify(userData));
    setPage(userData.role === 'admin' ? 'admin' : 'chat');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('healthai_token');
    localStorage.removeItem('healthai_user');
    setPage('login');
  };

  return (
    <div className="app">
      {page === 'login' && (
        <LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />
      )}
      {page === 'register' && (
        <RegisterPage onRegister={handleLogin} onGoLogin={() => setPage('login')} />
      )}
      {page === 'chat' && (
        <ProtectedRoute user={user}>
          <ChatPage
            user={user}
            token={token}
            onLogout={handleLogout}
            onGoProfile={() => setPage('dashboard')}
          />
        </ProtectedRoute>
      )}
      {page === 'dashboard' && (
        <ProtectedRoute user={user}>
          <Dashboard
            user={user}
            token={token}
            onLogout={handleLogout}
            onGoChat={() => setPage('chat')}
          />
        </ProtectedRoute>
      )}
      {page === 'admin' && (
        <AdminRoute user={user} fallback={<LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />}>
          <AdminDashboard
            token={token}
            onGoUsers={() => setPage('admin-users')}
            onGoStats={() => setPage('admin-stats')}
            onLogout={handleLogout}
          />
        </AdminRoute>
      )}
      {page === 'admin-users' && (
        <AdminRoute user={user} fallback={<LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />}>
          <AdminUsers
            token={token}
            onGoDashboard={() => setPage('admin')}
            onGoStats={() => setPage('admin-stats')}
            onLogout={handleLogout}
          />
        </AdminRoute>
      )}
      {page === 'admin-stats' && (
        <AdminRoute user={user} fallback={<LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />}>
          <AdminStats
            token={token}
            onGoDashboard={() => setPage('admin')}
            onGoUsers={() => setPage('admin-users')}
            onLogout={handleLogout}
          />
        </AdminRoute>
      )}
    </div>
  );
}

export default App;
