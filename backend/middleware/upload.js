const multer = require('multer');

// Dùng memoryStorage thay vì diskStorage vì Vercel có hệ thống tập tin chỉ đọc (read-only)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file) {
    return cb(new Error('Không tìm thấy file'));
  }

  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'));
  }

  cb(null, true);
};

const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = {
  uploadPaymentProof
};