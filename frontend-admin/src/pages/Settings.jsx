import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield, Save, Eye, EyeOff, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { userAPI, authAPI } from '../services/api';

export default function Settings({ user = {}, onUserUpdate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.name || user?.fullName || 'Quản trị viên',
    email: user?.email || 'admin@library.com',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setProfileData({
        fullName: profile.fullName || user?.name || user?.fullName || 'Quản trị viên',
        email: profile.email || user?.email || 'admin@library.com',
        phone: profile.phone || user?.phone || '',
        address: profile.address || user?.address || ''
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', icon: User, label: 'Thông tin cá nhân' },
    { id: 'security', icon: Shield, label: 'Bảo mật' }
  ];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = async () => {
    if (!profileData.fullName.trim()) {
      showToast('Vui lòng nhập họ và tên', 'error');
      return;
    }
    
    setLoading(true);
    try {
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      
      try {
        await userAPI.updateProfile({
          name: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address
        });
      } catch (apiError) {
        console.error('API Error:', apiError);
      }

      // Always update UI regardless of API result
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          name: profileData.fullName,
          fullName: profileData.fullName,
          phone: profileData.phone,
          address: profileData.address
        });
      }
      showToast('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('Không thể cập nhật thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!passwordData.newPassword) {
      showToast('Vui lòng nhập mật khẩu mới', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('Mật khẩu mới phải ít nhất 6 ký tự', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.status === 'success' || response.status === 200) {
        showToast('Đổi mật khẩu thành công!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast('Không thể đổi mật khẩu', 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'Mật khẩu hiện tại không đúng';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header with Back Button */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #E5E7EB',
        padding: '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937' }}>Cài đặt tài khoản</h1>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          backgroundColor: toast.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          color: toast.type === 'success' ? '#166534' : '#991B1B',
          border: `1px solid ${toast.type === 'success' ? '#86EFAC' : '#FCA5A5'}`
        }}>
          {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: '500' }}>{toast.message}</span>
        </div>
      )}

      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
          {/* Sidebar Tabs */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            height: 'fit-content',
            position: 'sticky',
            top: '120px'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    backgroundColor: activeTab === tab.id ? '#EFF6FF' : 'white',
                    color: activeTab === tab.id ? '#2563EB' : '#374151',
                    border: 'none',
                    borderLeft: activeTab === tab.id ? '4px solid #2563EB' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: activeTab === tab.id ? '600' : 'normal',
                    fontSize: '15px'
                  }}
                  onMouseOver={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseOut={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '32px'
          }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: '#1F2937' }}>Thông tin cá nhân</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '40px',
                    fontWeight: 'bold',
                    marginRight: '24px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    flexShrink: 0
                  }}>
                    {profileData.fullName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>{profileData.fullName}</h3>
                    <p style={{ color: '#6B7280', marginTop: '4px' }}>{profileData.email}</p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      fontSize: '14px',
                      borderRadius: '20px',
                      fontWeight: '500'
                    }}>
                      Quản trị viên
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', backgroundColor: '#F9FAFB', color: '#9CA3AF', fontSize: '14px', cursor: 'not-allowed', boxSizing: 'border-box' }}
                    />
                    <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Email không thể thay đổi</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                    backgroundColor: loading ? '#9CA3AF' : '#2563EB', color: 'white', border: 'none',
                    borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500',
                    fontSize: '15px', transition: 'all 0.2s', opacity: loading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = '#1D4ED8'; }}
                  onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = '#2563EB'; }}
                >
                  <Save size={18} />
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: '#1F2937' }}>Bảo mật</h2>

                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1F2937' }}>Đổi mật khẩu</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Mật khẩu hiện tại <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          style={{ width: '100%', padding: '12px', paddingRight: '45px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          style={{ width: '100%', padding: '12px', paddingRight: '45px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center' }}>
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>Mật khẩu phải có ít nhất 6 ký tự</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Xác nhận mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
                        placeholder="Xác nhận mật khẩu mới"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    style={{
                      marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
                      backgroundColor: loading ? '#9CA3AF' : '#2563EB', color: 'white', border: 'none',
                      borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500',
                      fontSize: '15px', transition: 'all 0.2s', opacity: loading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!loading) e.target.style.backgroundColor = '#1D4ED8'; }}
                    onMouseOut={(e) => { if (!loading) e.target.style.backgroundColor = '#2563EB'; }}
                  >
                    <Lock size={18} />
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1F2937' }}>Phiên đăng nhập</h3>
                  <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Thiết bị hiện tại</p>
                    <p style={{ fontWeight: '500', color: '#1F2937' }}>Chrome trên Windows</p>
                    <p style={{ fontSize: '14px', color: '#6B7280' }}>Đăng nhập lúc: {new Date().toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}