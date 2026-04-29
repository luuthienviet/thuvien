import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header({ user, onLogout, onToggleSidebar }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #E5E7EB',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          style={{
            padding: '8px',
            backgroundColor: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            flexShrink: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          title="Thu/mở menu"
        >
          <Menu size={22} color="#4B5563" />
        </button>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2937' }}>
            Chào mừng, {user?.name || user?.fullName || 'Administrator'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Quản lý thư viện của bạn</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* User Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {(user?.name || user?.fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: '500', color: '#1F2937', fontSize: '14px' }}>
                {user?.name || user?.fullName || 'Administrator'}
              </p>
              <p style={{ fontSize: '12px', color: '#6B7280' }}>
                {user?.email || 'admin@library.com'}
              </p>
            </div>
            <ChevronDown size={16} color="#6B7280" />
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
              minWidth: '220px',
              overflow: 'hidden',
              zIndex: 50
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontWeight: '600', color: '#1F2937' }}>
                  {user?.name || user?.fullName || 'Administrator'}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>Quản trị viên</p>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/settings');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textAlign: 'left',
                  color: '#374151'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={18} />
                <span style={{ fontSize: '14px' }}>Cài đặt tài khoản</span>
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    onLogout();
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderTop: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textAlign: 'left',
                  color: '#DC2626'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={18} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}