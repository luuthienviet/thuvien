const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Bảo vệ routes
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('🔐 Protect middleware - Path:', req.path);
  console.log('📍 Method:', req.method);
  console.log('🔑 Auth header:', req.headers.authorization ? 'Present' : 'Missing');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('✅ Token extracted');
  }

  if (!token) {
    console.log('❌ No token found');
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập, vui lòng đăng nhập'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified - User ID:', decoded.id);
    
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    console.log('✅ User found:', req.user.fullName, '- Role:', req.user.role);

    if (req.user.status === 'blocked') {
      console.log('❌ User blocked');
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa'
      });
    }

    console.log('✅ All checks passed, moving to next middleware');
    next();
  } catch (error) {
    console.log('❌ Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Kiểm tra role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorize middleware - Required roles:', roles, '- User role:', req.user?.role);
    
    if (!roles.includes(req.user.role)) {
      console.log('❌ User role not authorized');
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} không có quyền truy cập`
      });
    }
    
    console.log('✅ User authorized, moving to next middleware');
    next();
  };
};