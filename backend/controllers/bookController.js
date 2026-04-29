const Book = require('../models/Book');

// Helper functions
const categoryCodeMap = {
  'Văn học': 'VH',
  'Khoa học - Kỹ thuật': 'KHKT',
  'Xã hội - Nhân văn': 'XHNV',
  'Giáo dục - Học tập': 'GD',
  'Thiếu nhi': 'TN',
  'Kinh tế': 'KT',
  'Lịch sử': 'LS',
  'Tâm lý': 'TL',
  'Kỹ năng sống': 'KNS',
  'Công nghệ': 'CN',
  'Nghệ thuật': 'NT',
  'Y học - Sức khỏe': 'YH'
};

const getInitials = (str) => {
  if (!str) return 'XX';
  return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('');
};

const generateBookCode = (category, publishYear, author, title) => {
  const catCode = categoryCodeMap[category] || 'XX';
  const yearCode = publishYear || '0000';
  const authorCode = getInitials(author);
  const titleCode = getInitials(title);
  return `${catCode}-${yearCode}-${authorCode}-${titleCode}`;
};

// @desc    Lấy tất cả sách
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, status } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      count: books.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Tìm kiếm sách
// @route   GET /api/books/search
// @access  Public
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const books = await Book.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { bookCode: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy chi tiết sách
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Thêm sách mới
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res) => {
  try {
    const bookData = {
      ...req.body,
      // ✅ Tự động tạo bookCode
      bookCode: generateBookCode(
        req.body.category,
        req.body.publishYear,
        req.body.author,
        req.body.title
      ),
      // ✅ Set status = 'active' (không dùng 'available')
      status: 'active',
      // ✅ Set bookConditions cho sách mới
      bookConditions: {
        normal: req.body.quantity || 0,
        damaged: 0,
        lost: 0
      }
    };

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      message: 'Thêm sách thành công',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cập nhật sách
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // ✅ Nếu có thay đổi category/author/title/year, tạo lại bookCode
    if (req.body.category || req.body.author || req.body.title || req.body.publishYear) {
      req.body.bookCode = generateBookCode(
        req.body.category || book.category,
        req.body.publishYear || book.publishYear,
        req.body.author || book.author,
        req.body.title || book.title
      );
    }

    book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật sách thành công',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Xóa sách
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa sách thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cập nhật trạng thái sách
// @route   PATCH /api/books/:id/status
// @access  Private/Admin
exports.updateBookStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cập nhật tình trạng vật lý sách
// @route   PATCH /api/books/:id/conditions
// @access  Private/Admin
exports.updateBookConditions = async (req, res) => {
  try {
    const { normal, damaged, lost } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // ✅ Kiểm tra tổng không vượt quá quantity
    const total = (normal || 0) + (damaged || 0) + (lost || 0);
    if (total !== book.quantity) {
      return res.status(400).json({
        success: false,
        message: `Tổng các loại (${total}) phải bằng tổng số sách (${book.quantity})`
      });
    }

    // Cập nhật tình trạng sách
    book.bookConditions = {
      normal: normal || 0,
      damaged: damaged || 0,
      lost: lost || 0
    };

    // Tính lại available = quantity - damaged - lost
    book.available = book.quantity - (damaged || 0) - (lost || 0);

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật tình trạng sách thành công',
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// backend/controllers/bookController.js