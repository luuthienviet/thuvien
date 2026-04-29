const mongoose = require('mongoose');

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

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },

    category: {
      type: String,
      required: true,
      enum: Object.keys(categoryCodeMap)
    },

    publisher: { type: String, required: true },
    publishYear: { type: Number, required: true },

    isbn: { type: String, trim: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true },

    quantity: {
      type: Number,
      required: true,
      min: 0
    },

    
    available: {
      type: Number,
      required: true,
      min: 0
    },

    bookCode: {
      type: String,
      trim: true,
      unique: true
    },

    shelfLocation: { type: String, trim: true },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },

    bookConditions: {
      normal: { type: Number, default: 0, min: 0 },
      damaged: { type: Number, default: 0, min: 0 },
      lost: { type: Number, default: 0, min: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
// backend/models/Book.js