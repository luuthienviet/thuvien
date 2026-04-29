const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  submitPaymentProof,
  getMySubscription,
  getPendingSubscriptionPayments,
  approveSubscriptionPayment,
  rejectSubscriptionPayment
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadPaymentProof } = require('../middleware/upload');

router.use(protect); // Tất cả routes đều cần authentication

// DEBUG: Test routes
router.get('/test/hello', (req, res) => {
  res.json({ message: 'Test route works', user: req.user?.fullName });
});

// Specific routes (subscription) phải được định nghĩa TRƯỚC generic routes (:id)
router.get('/subscription/pending', authorize('admin'), getPendingSubscriptionPayments);
router.get('/subscription/me', authorize('reader'), getMySubscription);

// Route upload với error handling riêng cho multer
router.post('/subscription/payment-proof', authorize('reader'), (req, res, next) => {
  console.log('📤 POST /subscription/payment-proof route hit');
  console.log('User:', req.user?.id, req.user?.fullName);
  
  uploadPaymentProof.single('billImage')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi upload file'
      });
    }
    console.log('✅ File uploaded successfully');
    next();
  });
}, submitPaymentProof);

router.patch('/:id/subscription/approve', authorize('admin'), approveSubscriptionPayment);
router.patch('/:id/subscription/reject', authorize('admin'), rejectSubscriptionPayment);

// Generic routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.patch('/:id/status', authorize('admin'), updateUserStatus);

module.exports = router;