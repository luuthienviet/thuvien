import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ArrowLeft, Phone, KeyRound, CheckCircle2, Timer } from 'lucide-react';
import { authAPI } from '../services/api';

// ─── Màn đăng nhập chính ────────────────────────────────────────────────────
function LoginForm({ onForgot }) {
  const [formData, setFormData] = useState({ cccd: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{12}$/.test(formData.cccd)) {
      setError('Số CCCD phải gồm đúng 12 chữ số');
      return;
    }
    setLoading(true);
    try {
      await login(formData.cccd, formData.password);
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Đăng nhập</h2>
      <p className="text-center text-gray-600 mb-8">Chào mừng bạn quay trở lại!</p>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số căn cước công dân</label>
          <input
            type="text"
            name="cccd"
            value={formData.cccd}
            onChange={handleChange}
            required
            maxLength={12}
            pattern="\d{12}"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="012345678901"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {/* Đổi mật khẩu */}
        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={onForgot}
            className="text-sm text-primary hover:underline font-medium"
          >
            Quên mật khẩu? Đổi mật khẩu
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">Đăng ký ngay</Link>
        </p>
        <Link to="/" className="block text-primary hover:underline text-sm font-medium">
          ← Quay về trang chủ
        </Link>
      </div>
    </>
  );
}

// ─── Bước 1: Nhập CCCD để gửi OTP ───────────────────────────────────────────
function StepEnterCccd({ onBack, onOtpSent }) {
  const [cccd, setCccd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{12}$/.test(cccd)) {
      setError('Số CCCD phải gồm đúng 12 chữ số');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(cccd);
      onOtpSent({ cccd, maskedPhone: res.data.message });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi OTP, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại đăng nhập
      </button>

      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
          <Phone className="w-7 h-7 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Đổi mật khẩu</h2>
      <p className="text-center text-gray-500 text-sm mb-8">
        Nhập số CCCD đã đăng ký. Hệ thống sẽ gửi mã OTP về số điện thoại của bạn.
      </p>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số căn cước công dân</label>
          <input
            type="text"
            value={cccd}
            onChange={(e) => setCccd(e.target.value)}
            maxLength={12}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="012345678901"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
        </button>
      </form>
    </>
  );
}

// ─── Bước 2: Nhập OTP ────────────────────────────────────────────────────────
function StepEnterOtp({ cccd, maskedPhone, onBack, onVerified }) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authAPI.forgotPassword(cccd);
      startCooldown();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Mã OTP gồm 6 chữ số');
      return;
    }
    onVerified(otp);
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
      </button>

      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Nhập mã OTP</h2>
      <p className="text-center text-gray-500 text-sm mb-1">{maskedPhone}</p>
      <p className="text-center text-gray-400 text-xs mb-6">Mã có hiệu lực trong 5 phút.</p>


      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mã OTP (6 chữ số)</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary text-center text-2xl font-bold tracking-widest"
            placeholder="• • • • • •"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-1">
        <Timer className="w-4 h-4" />
        {resendCooldown > 0 ? (
          <span>Gửi lại sau <span className="font-semibold text-primary">{resendCooldown}s</span></span>
        ) : (
          <button onClick={handleResend} className="text-primary hover:underline font-medium">
            Gửi lại OTP
          </button>
        )}
      </div>
    </>
  );
}

// ─── Bước 3: Nhập mật khẩu mới ───────────────────────────────────────────────
function StepNewPassword({ cccd, otp, onBack, onDone }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ cccd, otp, newPassword });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
      </button>

      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
          <KeyRound className="w-7 h-7 text-green-600" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Mật khẩu mới</h2>
      <p className="text-center text-gray-500 text-sm mb-8">Nhập mật khẩu mới cho tài khoản của bạn.</p>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </>
  );
}

// ─── Bước 4: Thành công ───────────────────────────────────────────────────────
function StepSuccess({ onLogin }) {
  return (
    <div className="text-center py-4">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Thành công!</h2>
      <p className="text-gray-600 mb-8">Mật khẩu của bạn đã được đặt lại. Hãy đăng nhập lại.</p>
      <button
        onClick={onLogin}
        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Đăng nhập ngay
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Login() {
  // mode: 'login' | 'step1' | 'step2' | 'step3' | 'done'
  const [mode, setMode] = useState('login');
  const [otpData, setOtpData] = useState({ cccd: '', maskedPhone: '' });
  const [verifiedOtp, setVerifiedOtp] = useState('');

  const handleOtpSent = ({ cccd, maskedPhone }) => {
    setOtpData({ cccd, maskedPhone });
    setMode('step2');
  };

  const handleOtpVerified = (otp) => {
    setVerifiedOtp(otp);
    setMode('step3');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {mode !== 'done' && (
          <div className="flex justify-center mb-6">
            <BookOpen className="w-16 h-16 text-primary" />
          </div>
        )}

        {mode === 'login' && (
          <LoginForm onForgot={() => setMode('step1')} />
        )}

        {mode === 'step1' && (
          <StepEnterCccd
            onBack={() => setMode('login')}
            onOtpSent={handleOtpSent}
          />
        )}

        {mode === 'step2' && (
          <StepEnterOtp
            cccd={otpData.cccd}
            maskedPhone={otpData.maskedPhone}
            onBack={() => setMode('step1')}
            onVerified={handleOtpVerified}
          />
        )}

        {mode === 'step3' && (
          <StepNewPassword
            cccd={otpData.cccd}
            otp={verifiedOtp}
            onBack={() => setMode('step2')}
            onDone={() => setMode('done')}
          />
        )}

        {mode === 'done' && (
          <StepSuccess onLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}
// frontend-reader/src/pages/Login.jsx