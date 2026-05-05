const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary từ biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload ảnh từ buffer lên Cloudinary
 * @param {Buffer} buffer - Buffer của file ảnh
 * @param {string} folder - Thư mục trên Cloudinary (VD: 'payment-proofs')
 * @param {string} publicId - Tên file trên Cloudinary (không cần extension)
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadFromBuffer = (buffer, folder = 'payment-proofs', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `thuvien/${folder}`,
      resource_type: 'image',
      format: 'webp', // Tự động convert sang WebP cho nhẹ hơn
      quality: 'auto',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = { cloudinary, uploadFromBuffer };
