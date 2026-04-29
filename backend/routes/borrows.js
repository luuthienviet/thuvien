const express = require('express');
const router = express.Router();
const {
  getBorrows,
  getBorrow,
  createBorrow,
  createDirectBorrow,  // ✅ THÊM MỚI
  cancelBorrow,
  approveBorrow,
  returnBorrow,
  extendBorrow
} = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // Tất cả routes đều cần authentication

router.get('/', getBorrows);
router.get('/:id', getBorrow);
router.post('/', authorize('reader'), createBorrow);
router.post('/direct', authorize('admin'), createDirectBorrow); // ✅ THÊM MỚI - Mượn sách trực tiếp
router.delete('/:id', authorize('reader'), cancelBorrow);
router.patch('/:id/approve', authorize('admin'), approveBorrow);
router.patch('/:id/return', authorize('admin'), returnBorrow);
router.patch('/:id/extend', authorize('reader'), extendBorrow);

module.exports = router;
// backend/routes/borrows.js