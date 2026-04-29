import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    cccd: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Xóa lỗi của field khi user bắt đầu sửa
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  // Validate từng field, trả về object lỗi
  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.cccd.trim()) {
      errors.cccd = 'Vui lòng nhập số căn cước công dân';
    } else if (!/^\d{12}$/.test(formData.cccd)) {
      errors.cccd = 'Số CCCD phải gồm đúng 12 chữ số (không chứa chữ cái hay ký tự đặc biệt)';
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email không đúng định dạng';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^\d{9,11}$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại chỉ được chứa chữ số (9–11 chữ số)';
    }

    if (!formData.address.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Helper: class viền đỏ nếu field có lỗi
  const inputClass = (field) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
      fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <BookOpen className="w-16 h-16 text-primary" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Đăng ký
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Tạo tài khoản để bắt đầu mượn sách
        </p>

        {/* Lỗi từ server (ví dụ: CCCD đã tồn tại) */}
        {serverError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ và tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass('fullName')}
              placeholder="Nguyễn Văn A"
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.fullName}</p>
            )}
          </div>

          {/* CCCD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số căn cước công dân <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              maxLength={12}
              className={inputClass('cccd')}
              placeholder="012345678901 (12 chữ số)"
            />
            {fieldErrors.cccd ? (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.cccd}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Dùng để đăng nhập và xác minh danh tính. Mỗi CCCD chỉ đăng ký được một tài khoản.
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass('email')}
              placeholder="your@email.com"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.email}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass('password')}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.password}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass('phone')}
              placeholder="0373239689"
            />
            {fieldErrors.phone && (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.phone}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className={inputClass('address')}
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
            />
            {fieldErrors.address && (
              <p className="text-red-500 text-xs mt-1">⚠ {fieldErrors.address}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
// Register.jsx