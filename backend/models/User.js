const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true
  },
  // CCCD là định danh chính, dùng để đăng nhập thay cho email
  cccd: {
    type: String,
    required: [true, 'Vui lòng nhập số căn cước công dân'],
    unique: true,
    trim: true,
    match: [/^\d{12}$/, 'Số CCCD phải gồm đúng 12 chữ số']
  },
  // Email không bắt buộc, không dùng để đăng nhập
  email: {
    type: String,
    unique: true,
    sparse: true, // unique nhưng cho phép nhiều document không có email
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ'],
    trim: true
  },
  role: {
    type: String,
    enum: ['reader', 'admin'],
    default: 'reader'
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  subscription: {
    planType: {
      type: String,
      enum: ['none', 'monthly', 'yearly'],
      default: 'none'
    },
    planName: {
      type: String,
      enum: ['Gói tháng', 'Gói năm', 'Gói Bình Thường', 'Gói Cao Cấp'],
      default: null
    },
    price: {
      type: Number,
      default: 0
    },
    maxBooksPerMonth: {
      type: Number,
      default: 0
    },
    maxBorrowDays: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['none', 'pending_review', 'approved', 'rejected'],
      default: 'none'
    },
    billImageUrl: {
      type: String,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    validFrom: {
      type: Date,
      default: null
    },
    validUntil: {
      type: Date,
      default: null
    },
    remainingBooks: {
      type: Number,
      default: 0
    },
    nextResetAt: {
      type: Date,
      default: null
    },
    pendingPlanType: {
      type: String,
      enum: ['none', 'monthly', 'yearly'],
      default: 'none'
    },
    pendingPaymentStatus: {
      type: String,
      enum: ['none', 'pending_review', 'rejected'],
      default: 'none'
    },
    pendingBillImageUrl: {
      type: String,
      default: null
    },
    pendingSubmittedAt: {
      type: Date,
      default: null
    },
    pendingRejectionReason: {
      type: String,
      default: ''
    }
  },
  // OTP đặt lại mật khẩu
  otpCode: {
    type: String,
    default: null
  },
  otpExpire: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
// backend/models/User.js