const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOtpSms } = require('../utils/sms');

// Tạo JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Đăng ký tài khoản
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, cccd, email, password, phone, address } = req.body;

    // Validate định dạng CCCD
    if (!/^\d{12}$/.test(cccd)) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD phải gồm đúng 12 chữ số'
      });
    }

    // Kiểm tra CCCD đã tồn tại chưa
    const userExists = await User.findOne({ cccd });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Số CCCD này đã được đăng ký tài khoản'
      });
    }

    // Tạo user mới
    const user = await User.create({
      fullName,
      cccd,
      email: email || undefined,
      password,
      phone,
      address,
      role: 'reader'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        _id: user._id,
        fullName: user.fullName,
        cccd: user.cccd,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { cccd, email, password } = req.body;
    const hasCccd = typeof cccd === 'string' && cccd.trim();
    const hasEmail = typeof email === 'string' && email.trim();

    if ((!hasCccd && !hasEmail) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số CCCD hoặc email và mật khẩu'
      });
    }

    const query = [];

    if (hasCccd) {
      const trimmedCccd = cccd.trim();

      if (!/^\d{12}$/.test(trimmedCccd)) {
        return res.status(400).json({
          success: false,
          message: 'Số CCCD phải gồm đúng 12 chữ số'
        });
      }

      query.push({ cccd: trimmedCccd });
    }

    if (hasEmail) {
      query.push({ email: email.trim().toLowerCase() });
    }

    // Tìm user theo CCCD hoặc email và include password
    const user = await User.findOne(
      query.length === 1 ? query[0] : { $or: query }
    ).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Số CCCD/email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Số CCCD/email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra status
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        _id: user._id,
        fullName: user.fullName,
        cccd: user.cccd,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Gửi OTP đặt lại mật khẩu qua số điện thoại
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { cccd } = req.body;
    if (!cccd || !/^\d{12}$/.test(cccd)) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đúng số CCCD (12 chữ số)' });
    }

    const user = await User.findOne({ cccd });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với số CCCD này' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa, không thể đặt lại mật khẩu' });
    }

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    user.otpCode = otp;
    user.otpExpire = expire;
    await user.save({ validateBeforeSave: false });

    // Gửi SMS OTP thật qua eSMS.vn
    try {
      await sendOtpSms(user.phone, otp);
    } catch (smsError) {
      // Nếu gửi SMS thất bại, xóa OTP đã lưu và trả về lỗi
      user.otpCode = null;
      user.otpExpire = null;
      await user.save({ validateBeforeSave: false });
      console.error('❌ [SMS] Gửi thất bại:', smsError.message);
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi tin nhắn SMS. Vui lòng kiểm tra lại cấu hình eSMS hoặc thử lại sau.'
      });
    }

    const maskedPhone = user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
    res.status(200).json({
      success: true,
      message: `Mã OTP đã được gửi đến số điện thoại ${maskedPhone}. Kiểm tra tin nhắn để lấy mã.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Đặt lại mật khẩu bằng OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { cccd, otp, newPassword } = req.body;

    if (!cccd || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findOne({ cccd });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }
    if (!user.otpCode || !user.otpExpire) {
      return res.status(400).json({ success: false, message: 'Chưa có yêu cầu đặt lại mật khẩu' });
    }
    if (new Date() > user.otpExpire) {
      user.otpCode = null;
      user.otpExpire = null;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn, vui lòng thử lại' });
    }
    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng' });
    }

    // Đặt mật khẩu mới và xóa OTP
    user.password = newPassword;
    user.otpCode = null;
    user.otpExpire = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// backend/controllers/authController.js