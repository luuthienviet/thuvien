const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const User = require('../models/User');

// Cấu hình các gói đăng ký (import từ userController)
const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Gói Bình Thường',
    price: 30000,
    maxBooksPerMonth: 15,
    maxBorrowDays: 14
  },
  yearly: {
    name: 'Gói Cao Cấp',
    price: 300000,
    maxBooksPerMonth: 30,
    maxBorrowDays: 30
  }
};

const FREE_PLAN = {
  maxBooksPerMonth: 5
};

const LEGACY_PLAN_NAME_TO_TYPE = {
  'Gói tháng': 'monthly',
  'Gói Bình Thường': 'monthly',
  'Gói năm': 'yearly',
  'Gói Cao Cấp': 'yearly'
};

const addOneMonth = (dateValue) => {
  const date = new Date(dateValue);
  date.setMonth(date.getMonth() + 1);
  return date;
};

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolvePlanConfig = (subscription = {}) => {
  const planType = subscription.planType;
  if (SUBSCRIPTION_PLANS[planType]) {
    return { planType, plan: SUBSCRIPTION_PLANS[planType] };
  }

  const planTypeFromName = LEGACY_PLAN_NAME_TO_TYPE[subscription.planName];
  if (planTypeFromName && SUBSCRIPTION_PLANS[planTypeFromName]) {
    return { planType: planTypeFromName, plan: SUBSCRIPTION_PLANS[planTypeFromName] };
  }

  const maxBooksPerMonth = Number(subscription.maxBooksPerMonth || 0);
  if (maxBooksPerMonth >= SUBSCRIPTION_PLANS.yearly.maxBooksPerMonth) {
    return { planType: 'yearly', plan: SUBSCRIPTION_PLANS.yearly };
  }

  if (maxBooksPerMonth >= SUBSCRIPTION_PLANS.monthly.maxBooksPerMonth) {
    return { planType: 'monthly', plan: SUBSCRIPTION_PLANS.monthly };
  }

  return { planType: null, plan: null };
};

const isActiveSubscription = (subscription) => {
  return (
    subscription?.paymentStatus === 'approved' &&
    subscription?.validUntil &&
    new Date(subscription.validUntil) >= new Date()
  );
};

const refreshMonthlyQuota = (subscription) => {
  if (!isActiveSubscription(subscription)) {
    return false;
  }

  const { planType, plan } = resolvePlanConfig(subscription);
  if (!plan) {
    return false;
  }

  const now = new Date();
  const validFrom = toValidDate(subscription.validFrom) || now;
  const validUntil = toValidDate(subscription.validUntil);
  if (!validUntil) {
    return false;
  }

  let remainingBooks = Number(subscription.remainingBooks || 0);
  if (!Number.isFinite(remainingBooks) || remainingBooks < 0) {
    remainingBooks = 0;
  }

  let nextResetAt = toValidDate(subscription.nextResetAt);
  let updated = false;

  if (subscription.planType !== planType) {
    subscription.planType = planType;
    subscription.planName = plan.name;
    subscription.maxBooksPerMonth = plan.maxBooksPerMonth;
    subscription.maxBorrowDays = plan.maxBorrowDays;
    updated = true;
  }

  // Legacy data có thể thiếu nextResetAt/remainingBooks dù gói vẫn còn hạn.
  if (!nextResetAt) {
    if (remainingBooks <= 0) {
      remainingBooks = plan.maxBooksPerMonth;
      updated = true;
    }

    nextResetAt = addOneMonth(validFrom);
    updated = true;
  }

  subscription.remainingBooks = remainingBooks;

  while (now >= nextResetAt && nextResetAt <= validUntil) {
    subscription.remainingBooks = Number(subscription.remainingBooks || 0) + plan.maxBooksPerMonth;
    nextResetAt = addOneMonth(nextResetAt);
    updated = true;
  }

  if (!subscription.nextResetAt || updated) {
    subscription.nextResetAt = nextResetAt;
  }

  return updated;
};

const refreshFreeQuota = (subscription) => {
  const now = new Date();
  let updated = false;

  if (!subscription.nextResetAt || now >= new Date(subscription.nextResetAt)) {
    subscription.remainingBooks = FREE_PLAN.maxBooksPerMonth;
    subscription.nextResetAt = addOneMonth(now);
    updated = true;
  }

  if (Number(subscription.remainingBooks || 0) > FREE_PLAN.maxBooksPerMonth) {
    subscription.remainingBooks = FREE_PLAN.maxBooksPerMonth;
    updated = true;
  }

  return updated;
};

// @desc    Lấy danh sách mượn sách
// @route   GET /api/borrows
// @access  Private
exports.getBorrows = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Nếu là reader, chỉ xem mượn của mình
    if (req.user.role === 'reader') {
      query.userId = req.user.id;
    }
    
    if (status) {
      query.status = status;
    }

    const borrows = await Borrow.find(query)
      .populate('userId', 'fullName email phone')
      .populate('bookId', 'title author coverImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Borrow.countDocuments(query);

    res.status(200).json({
      success: true,
      count: borrows.length,
      total: count,
      data: borrows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy chi tiết phiếu mượn
// @route   GET /api/borrows/:id
// @access  Private
exports.getBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id)
      .populate('userId', 'fullName email phone address')
      .populate('bookId', 'title author category publisher coverImage');

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role === 'reader' && borrow.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    res.status(200).json({
      success: true,
      data: borrow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng ký mượn sách
// @route   POST /api/borrows
// @access  Private/Reader
exports.createBorrow = async (req, res) => {
  try {
    const { bookId } = req.body;

    const user = await User.findById(req.user.id).select('subscription status role');
    if (!user || user.role !== 'reader') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ độc giả mới có thể đăng ký mượn sách'
      });
    }

    const subscription = user.subscription || {};
    const hasActivePlan = isActiveSubscription(subscription);

    const quotaWasReset = hasActivePlan
      ? refreshMonthlyQuota(subscription)
      : refreshFreeQuota(subscription);

    if (quotaWasReset) {
      user.updatedAt = Date.now();
      await user.save();
    }

    let remainingBooks = Number(subscription.remainingBooks || 0);

    // Tự phục hồi quota nếu user còn gói nhưng dữ liệu remainingBooks bị sai về 0.
    if (hasActivePlan && remainingBooks <= 0) {
      const { plan } = resolvePlanConfig(subscription);
      const nextResetAt = toValidDate(subscription.nextResetAt);
      const cycleStart = nextResetAt
        ? (() => {
            const start = new Date(nextResetAt);
            start.setMonth(start.getMonth() - 1);
            return start;
          })()
        : (toValidDate(subscription.validFrom) || new Date());

      if (plan) {
        const borrowedInCurrentCycle = await Borrow.countDocuments({
          userId: req.user.id,
          status: { $in: ['pending', 'approved', 'extended', 'returned'] },
          createdAt: { $gte: cycleStart }
        });

        const recoveredRemaining = Math.max(plan.maxBooksPerMonth - borrowedInCurrentCycle, 0);
        if (recoveredRemaining > 0) {
          subscription.remainingBooks = recoveredRemaining;
          user.markModified('subscription');
          await user.save();
          remainingBooks = recoveredRemaining;
        }
      }
    }

    if (remainingBooks <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã dùng hết lượt mượn. Vui lòng chờ đủ 1 tháng để hệ thống reset lượt mượn.'
      });
    }

    // Kiểm tra sách có tồn tại
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra sách còn không
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết, vui lòng chọn sách khác'
      });
    }

    // Kiểm tra user đã mượn sách này chưa trả
    const existingBorrow = await Borrow.findOne({
      userId: req.user.id,
      bookId,
      status: { $in: ['pending', 'approved', 'extended'] }
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đang mượn hoặc chờ duyệt sách này'
      });
    }

    //  Fix: Không set dueDate ở đây nữa — admin sẽ set khi duyệt
    const borrow = await Borrow.create({
      userId: req.user.id,
      bookId,
      borrowDate: new Date(),
      status: 'pending',
      extensionHistory: []
    });

    // Mỗi lần đăng ký mượn sẽ trừ 1 lượt quota
    user.subscription.remainingBooks = remainingBooks - 1;
    user.updatedAt = Date.now();
    await user.save();

    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate('bookId', 'title author coverImage');

    res.status(201).json({
      success: true,
      message: `Đăng ký mượn sách thành công, vui lòng chờ admin duyệt. Lượt còn lại: ${user.subscription.remainingBooks}`,
      data: populatedBorrow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mượn sách trực tiếp (Admin tạo tại thư viện)
// @route   POST /api/borrows/direct
// @access  Private/Admin
exports.createDirectBorrow = async (req, res) => {
  try {
    const { userId, bookId, borrowDays } = req.body;

    // Validate
    if (!userId || !bookId || !borrowDays) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (userId, bookId, borrowDays)'
      });
    }

    // Kiểm tra user tồn tại và active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản người dùng đã bị khóa'
      });
    }

    if (user.role !== 'reader') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cho độc giả mượn sách'
      });
    }

    // Kiểm tra sách tồn tại
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Kiểm tra sách còn không
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết'
      });
    }

    // Kiểm tra user đã mượn sách này chưa trả
    const existingBorrow = await Borrow.findOne({
      userId,
      bookId,
      status: { $in: ['pending', 'approved', 'extended'] }
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đang mượn hoặc chờ duyệt sách này'
      });
    }

    // Tính ngày trả
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(borrowDays));

    // Tạo borrow record với status = 'approved' luôn
    const borrow = await Borrow.create({
      userId,
      bookId,
      borrowDate,
      dueDate,
      status: 'approved',
      borrowType: 'direct', // Đánh dấu là mượn trực tiếp
      extensionHistory: []
    });

    // Giảm số lượng available của sách
    book.available -= 1;
    await book.save();

    // Populate để trả về đầy đủ thông tin
    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate('userId', 'fullName email phone')
      .populate('bookId', 'title author coverImage');

    res.status(201).json({
      success: true,
      message: 'Mượn sách trực tiếp thành công',
      data: populatedBorrow
    });

  } catch (error) {
    console.error('Error in createDirectBorrow:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Hủy phiếu mượn (chỉ khi đang pending)
// @route   DELETE /api/borrows/:id
// @access  Private/Reader
exports.cancelBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    // Kiểm tra quyền - chỉ người tạo mới được hủy
    if (borrow.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền hủy phiếu mượn này'
      });
    }

    // Chỉ được hủy phiếu đang chờ duyệt
    if (borrow.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy phiếu mượn đang chờ duyệt'
      });
    }

    // Xóa phiếu mượn
    await Borrow.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Hủy phiếu mượn thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Duyệt mượn sách
// @route   PATCH /api/borrows/:id/approve
// @access  Private/Admin
exports.approveBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    if (borrow.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu mượn đã được xử lý'
      });
    }

    // Kiểm tra sách còn không
    const book = await Book.findById(borrow.bookId);
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết'
      });
    }

    // Fix: Đọc borrowDays từ req.body, mặc định 7 nếu không truyền
    const { borrowDays = 7 } = req.body;

    // Fix: Tính dueDate từ hôm nay + borrowDays do admin chọn
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(borrowDays));

    // Cập nhật trạng thái, borrowDate và dueDate
    borrow.status = 'approved';
    borrow.borrowDate = new Date();
    borrow.dueDate = dueDate;
    await borrow.save();

    book.available -= 1;
    await book.save();

    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate('userId', 'fullName email')
      .populate('bookId', 'title author');

    res.status(200).json({
      success: true,
      message: 'Duyệt mượn sách thành công',
      data: populatedBorrow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Trả sách
// @route   PATCH /api/borrows/:id/return
// @access  Private/Admin
exports.returnBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    if (borrow.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Sách đã được trả'
      });
    }

    // Cập nhật trạng thái và tăng số lượng sách
    borrow.status = 'returned';
    borrow.returnDate = new Date();
    await borrow.save();

    const book = await Book.findById(borrow.bookId);
    book.available += 1;
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Trả sách thành công',
      data: borrow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Gia hạn sách (6 lần/tháng)
// @route   PATCH /api/borrows/:id/extend
// @access  Private/Reader
exports.extendBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu mượn'
      });
    }

    // Kiểm tra quyền
    if (borrow.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền gia hạn'
      });
    }

    // Kiểm tra trạng thái
    if (borrow.status !== 'approved' && borrow.status !== 'extended') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gia hạn sách đang mượn'
      });
    }

    // Kiểm tra đã quá hạn chưa
    if (new Date() > borrow.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã quá hạn, không thể gia hạn'
      });
    }

    // Tính số lần gia hạn trong tháng hiện tại
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const MAX_EXTENSIONS_PER_MONTH = 6;

    // Đếm số lần gia hạn trong tháng hiện tại
    const extensionsThisMonth = (borrow.extensionHistory || []).filter(ext => {
      const extDate = new Date(ext.extendedAt);
      return extDate.getMonth() === currentMonth && extDate.getFullYear() === currentYear;
    }).length;

    if (extensionsThisMonth >= MAX_EXTENSIONS_PER_MONTH) {
      return res.status(400).json({
        success: false,
        message: `Đã hết lượt gia hạn trong tháng này (${MAX_EXTENSIONS_PER_MONTH}/${MAX_EXTENSIONS_PER_MONTH})`
      });
    }

    // Lưu thông tin gia hạn cũ
    const previousDueDate = new Date(borrow.dueDate);
    
    // Gia hạn thêm 7 ngày
    const newDueDate = new Date(borrow.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Khởi tạo extensionHistory nếu chưa có
    if (!borrow.extensionHistory) {
      borrow.extensionHistory = [];
    }

    // Thêm vào lịch sử gia hạn
    borrow.extensionHistory.push({
      extendedAt: new Date(),
      previousDueDate: previousDueDate,
      newDueDate: newDueDate
    });

    // Cập nhật thông tin
    borrow.dueDate = newDueDate;
    borrow.extensionCount = (borrow.extensionCount || 0) + 1;
    borrow.status = 'extended';
    
    await borrow.save();

    const remainingExtensions = MAX_EXTENSIONS_PER_MONTH - extensionsThisMonth - 1;

    res.status(200).json({
      success: true,
      message: `Gia hạn thành công. Còn ${remainingExtensions} lượt gia hạn trong tháng này`,
      data: borrow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// backend/controllers/borrowController.js