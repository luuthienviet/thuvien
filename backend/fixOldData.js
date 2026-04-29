// Script để fix dữ liệu cũ trong database
// Chạy: node fixOldData.js

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

const fixOldData = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Đã kết nối MongoDB');

    // 1. Fix tất cả sách có status = 'available' → 'active'
    const result1 = await Book.updateMany(
      { status: 'available' },
      { $set: { status: 'active' } }
    );
    console.log(`✅ Đã fix ${result1.modifiedCount} sách có status = 'available' → 'active'`);

    // 2. Fix tất cả sách thiếu bookConditions
    const result2 = await Book.updateMany(
      { bookConditions: { $exists: false } },
      { 
        $set: { 
          bookConditions: {
            normal: 0,
            damaged: 0,
            lost: 0
          }
        } 
      }
    );
    console.log(`✅ Đã thêm bookConditions cho ${result2.modifiedCount} sách`);

    // 3. Fix sách có bookConditions.normal = 0 nhưng quantity > 0
    const booksToFix = await Book.find({
      quantity: { $gt: 0 },
      'bookConditions.normal': 0
    });

    for (const book of booksToFix) {
      book.bookConditions.normal = book.quantity;
      await book.save();
    }
    console.log(`✅ Đã fix bookConditions.normal cho ${booksToFix.length} sách`);

    // 4. Thống kê sau khi fix
    const totalBooks = await Book.countDocuments();
    const activeBooks = await Book.countDocuments({ status: 'active' });
    const inactiveBooks = await Book.countDocuments({ status: 'inactive' });

    console.log('\n📊 Thống kê sau khi fix:');
    console.log(`   Tổng số sách: ${totalBooks}`);
    console.log(`   Sách active: ${activeBooks}`);
    console.log(`   Sách inactive: ${inactiveBooks}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

fixOldData();