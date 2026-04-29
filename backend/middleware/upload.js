const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'payment-proofs');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `bill-${req.user.id}-${Date.now()}${safeExt}`);
  }
});

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
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadPaymentProof
};