const User = require('../models/User');

const calculateSubscriptionEndDate = (startDate, planType) => {
  const endDate = new Date(startDate);

  if (planType === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planType === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
};

const calculateNextMonthlyReset = (baseDate) => {
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
};

// Cấu hình các gói đăng ký
const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Gói Bình Thường',
    price: 30000, // 30,000 VND
    maxBooksPerMonth: 15,
    maxBorrowDays: 14
  },
  yearly: {
    name: 'Gói Cao Cấp',
    price: 300000, // 300,000 VND
    maxBooksPerMonth: 30,
    maxBorrowDays: 30
  }
};

// @desc    Lấy danh sách tất cả users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy thông tin user theo ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

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

// @desc    Cập nhật thông tin user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, address, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Thay đổi trạng thái user (khóa/mở khóa)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã ${status === 'blocked' ? 'khóa' : 'mở khóa'} tài khoản`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Độc giả gửi bill thanh toán gói
// @route   POST /api/users/subscription/payment-proof
// @access  Private/Reader
exports.submitPaymentProof = async (req, res) => {
  try {
    const { planType } = req.body;

    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Gói đăng ký không hợp lệ'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên ảnh bill thanh toán'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const billImageUrl = `/uploads/payment-proofs/${req.file.filename}`;
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const currentSubscription = user.subscription || {};
    const hasActiveSubscription =
      currentSubscription.paymentStatus === 'approved' &&
      currentSubscription.validUntil &&
      new Date(currentSubscription.validUntil) >= new Date();

    if (hasActiveSubscription) {
      // Gia hạn/nạp thêm quota khi người dùng vẫn còn quyền gói hiện tại
      user.subscription.pendingPlanType = planType;
      user.subscription.pendingPaymentStatus = 'pending_review';
      user.subscription.pendingBillImageUrl = billImageUrl;
      user.subscription.pendingSubmittedAt = new Date();
      user.subscription.pendingRejectionReason = '';
      user.updatedAt = Date.now();

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Đã gửi bill gia hạn. Trong lúc chờ duyệt bạn vẫn dùng gói hiện tại bình thường.',
        data: user
      });
    }

    // Đăng ký mới hoặc đã hết hạn
    user.subscription.planType = planType;
    user.subscription.planName = plan.name;
    user.subscription.price = plan.price;
    user.subscription.maxBooksPerMonth = plan.maxBooksPerMonth;
    user.subscription.maxBorrowDays = plan.maxBorrowDays;
    user.subscription.paymentStatus = 'pending_review';
    user.subscription.billImageUrl = billImageUrl;
    user.subscription.submittedAt = new Date();
    user.subscription.reviewedAt = null;
    user.subscription.reviewedBy = null;
    user.subscription.rejectionReason = '';
    user.subscription.validFrom = null;
    user.subscription.validUntil = null;
    user.subscription.remainingBooks = 0;
    user.subscription.nextResetAt = null;
    user.subscription.pendingPlanType = 'none';
    user.subscription.pendingPaymentStatus = 'none';
    user.subscription.pendingBillImageUrl = null;
    user.subscription.pendingSubmittedAt = null;
    user.subscription.pendingRejectionReason = '';
    user.updatedAt = Date.now();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã gửi bill thành công, vui lòng chờ admin duyệt',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy thông tin gói của user hiện tại
// @route   GET /api/users/subscription/me
// @access  Private/Reader
exports.getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription fullName cccd email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        fullName: user.fullName,
        cccd: user.cccd,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy danh sách bill chờ duyệt
// @route   GET /api/users/subscription/pending
// @access  Private/Admin
exports.getPendingSubscriptionPayments = async (req, res) => {
  try {
    const users = await User.find({
      role: 'reader',
      $or: [
        { 'subscription.paymentStatus': 'pending_review' },
        { 'subscription.pendingPaymentStatus': 'pending_review' }
      ]
    })
      .select('-password')
      .sort({ 'subscription.submittedAt': -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin duyệt thanh toán gói
// @route   PATCH /api/users/:id/subscription/approve
// @access  Private/Admin
exports.approveSubscriptionPayment = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const now = new Date();
    const isRenewalRequest = user.subscription?.pendingPaymentStatus === 'pending_review';
    const isNewRequest = user.subscription?.paymentStatus === 'pending_review';

    if (!isRenewalRequest && !isNewRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bill này không ở trạng thái chờ duyệt'
      });
    }

    const planType = isRenewalRequest
      ? user.subscription.pendingPlanType
      : user.subscription.planType;

    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng chưa đăng ký gói hợp lệ'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const hasActiveSubscription =
      user.subscription?.paymentStatus === 'approved' &&
      user.subscription?.validUntil &&
      new Date(user.subscription.validUntil) >= now;

    const validFrom = hasActiveSubscription && user.subscription.validFrom
      ? user.subscription.validFrom
      : now;

    const validityBase = hasActiveSubscription
      ? new Date(user.subscription.validUntil)
      : now;
    const validUntil = calculateSubscriptionEndDate(validityBase, planType);

    const previousRemaining = Number(user.subscription?.remainingBooks || 0);
    user.subscription.planType = planType;
    user.subscription.planName = plan.name;
    user.subscription.price = plan.price;
    user.subscription.maxBooksPerMonth = plan.maxBooksPerMonth;
    user.subscription.maxBorrowDays = plan.maxBorrowDays;
    user.subscription.paymentStatus = 'approved';
    user.subscription.reviewedAt = now;
    user.subscription.reviewedBy = req.user.id;
    user.subscription.rejectionReason = '';
    user.subscription.validFrom = validFrom;
    user.subscription.validUntil = validUntil;
    user.subscription.remainingBooks = previousRemaining + plan.maxBooksPerMonth;
    user.subscription.nextResetAt =
      hasActiveSubscription && user.subscription.nextResetAt && new Date(user.subscription.nextResetAt) > now
        ? user.subscription.nextResetAt
        : calculateNextMonthlyReset(now);

    if (isRenewalRequest) {
      user.subscription.pendingPlanType = 'none';
      user.subscription.pendingPaymentStatus = 'none';
      user.subscription.pendingBillImageUrl = null;
      user.subscription.pendingSubmittedAt = null;
      user.subscription.pendingRejectionReason = '';
    }

    user.updatedAt = Date.now();

    await user.save();

    res.status(200).json({
      success: true,
      message: `Duyệt thanh toán thành công. Đã cộng thêm ${plan.maxBooksPerMonth} lượt mượn.`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin từ chối bill thanh toán
// @route   PATCH /api/users/:id/subscription/reject
// @access  Private/Admin
exports.rejectSubscriptionPayment = async (req, res) => {
  try {
    const { reason = '' } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const isRenewalRequest = user.subscription?.pendingPaymentStatus === 'pending_review';
    const isNewRequest = user.subscription?.paymentStatus === 'pending_review';

    if (!isRenewalRequest && !isNewRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bill này không ở trạng thái chờ duyệt'
      });
    }

    if (isRenewalRequest) {
      user.subscription.pendingPaymentStatus = 'rejected';
      user.subscription.pendingRejectionReason = reason.trim();
      user.subscription.reviewedAt = new Date();
      user.subscription.reviewedBy = req.user.id;
    } else {
      user.subscription.paymentStatus = 'rejected';
      user.subscription.reviewedAt = new Date();
      user.subscription.reviewedBy = req.user.id;
      user.subscription.rejectionReason = reason.trim();
      user.subscription.validFrom = null;
      user.subscription.validUntil = null;
      user.subscription.remainingBooks = 0;
      user.subscription.nextResetAt = null;
    }

    user.updatedAt = Date.now();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đã từ chối bill thanh toán',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// backend/controllers/userController.js