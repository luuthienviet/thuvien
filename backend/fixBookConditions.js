const mongoose = require('mongoose');
const Book = require('./models/Book');
require('dotenv').config();

async function fixBookConditions() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả sách
    const books = await Book.find();
    console.log(`📚 Tìm thấy ${books.length} cuốn sách`);

    let updated = 0;

    for (const book of books) {
      // Nếu chưa có bookConditions hoặc normal = 0
      if (!book.bookConditions || book.bookConditions.normal === 0) {
        book.bookConditions = {
          normal: book.quantity, // Tất cả sách cũ là bình thường
          damaged: book.bookConditions?.damaged || 0,
          lost: book.bookConditions?.lost || 0
        };
        
        await book.save();
        updated++;
        console.log(`✅ Đã cập nhật: ${book.title} - ${book.quantity} quyển bình thường`);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã cập nhật ${updated}/${books.length} cuốn sách`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

fixBookConditions();