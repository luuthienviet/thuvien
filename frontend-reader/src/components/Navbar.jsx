import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, BookOpen, Home as HomeIcon, ChevronDown, List, FileWarning, CreditCard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleProtectedNavigation = (path, label) => {
    if (!user) {
      alert(`Vui lòng đăng nhập để truy cập ${label}!`);
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleSubscriptionClick = () => {
    setShowUserMenu(false);
    navigate('/subscription');
  };

  const isActive = (path) => location.pathname === path;
  const isUserMenuActive = location.pathname === '/profile' || location.pathname === '/subscription';

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <BookOpen className="w-6 h-6" />
            <span>Thư Viện</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {/* Trang chủ - Luôn hiển thị */}
            <Link
              to="/"
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>

            {/* NÚT THỂ LOẠI - Giữa Trang chủ và Quy định */}
            <Link
              to="/categories"
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                isActive('/categories')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Thể loại</span>
            </Link>

            {/* NÚT QUY ĐỊNH - Sau Thể loại, trước Sách đã mượn */}
            <Link
              to="/rules"
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                isActive('/rules')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileWarning className="w-4 h-4" />
              <span>Quy định</span>
            </Link>

            {user ? (
              // Khi đã đăng nhập
              <>
                <button
                  onClick={() => navigate('/my-borrows')}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/my-borrows') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Danh sách mượn</span>
                </button>

                {/* User Dropdown Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isUserMenuActive
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{user.fullName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Cập nhật thông tin</span>
                      </button>

                      <button
                        onClick={handleSubscriptionClick}
                        className="w-full flex items-center space-x-2 px-4 py-2 border-t border-gray-100 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Đăng ký gói</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Khi chưa đăng nhập
              <>
                <button
                  onClick={() => handleProtectedNavigation('/my-borrows', 'Sách đã mượn')}
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Sách đã mượn</span>
                </button>

                <button
                  onClick={() => handleProtectedNavigation('/profile', 'Trang cá nhân')}
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Tài khoản</span>
                </button>

                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}