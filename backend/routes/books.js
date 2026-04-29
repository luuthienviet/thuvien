const express = require('express');
const router = express.Router();
const {
  getBooks,
  searchBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,
  updateBookConditions
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:id', getBook);

// Admin only routes
router.post('/', protect, authorize('admin'), createBook);
router.put('/:id', protect, authorize('admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);
router.patch('/:id/status', protect, authorize('admin'), updateBookStatus);
router.patch('/:id/conditions', protect, authorize('admin'), updateBookConditions);

module.exports = router;
// backend/routes/books.js