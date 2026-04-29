import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BooksManagement from './pages/BooksManagement';
import CategoryManagement from './pages/CategoryManagement';
import UsersManagement from './pages/UsersManagement';
import BorrowsManagement from './pages/BorrowsManagement';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const response = await authAPI.getMe();
        if (response.data.data.role === 'admin') {
          setUser(response.data.data);
        } else {
          localStorage.removeItem('adminToken');
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #2563EB',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <Sidebar onLogout={handleLogout} isOpen={sidebarOpen} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header
            user={user}
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/books" element={<BooksManagement />} />
              <Route path="/categories" element={<CategoryManagement />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/borrows" element={<BorrowsManagement />} />
              <Route path="/settings" element={<Settings user={user} onUserUpdate={setUser} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;