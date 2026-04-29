import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, ClipboardList, Tag } from 'lucide-react';

export default function Sidebar({ onLogout, isOpen }) {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Thống kê' },
    { path: '/books', icon: BookOpen, label: 'Quản lý sách' },
    { path: '/categories', icon: Tag, label: 'Quản lý thể loại' },
    { path: '/users', icon: Users, label: 'Quản lý độc giả' },
    { path: '/borrows', icon: ClipboardList, label: 'Quản lý mượn/trả' }
  ];

  return (
    <div style={{
      width: isOpen ? '256px' : '0px',
      minWidth: isOpen ? '256px' : '0px',
      overflow: 'hidden',
      transition: 'width 0.3s ease, min-width 0.3s ease',
      backgroundColor: '#111827',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #1F2937',
        whiteSpace: 'nowrap'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>Admin Panel</h1>
        <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '4px' }}>Library Management</p>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '16px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s',
                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                    color: isActive ? 'white' : '#D1D5DB',
                  }}
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#1F2937'; }}
                  onMouseOut={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon style={{ width: '20px', height: '20px', marginRight: '12px', flexShrink: 0 }} />
                  <span style={{ fontSize: '15px' }}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}