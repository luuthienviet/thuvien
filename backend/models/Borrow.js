const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },

  borrowDate: {
    type: Date,
    default: Date.now
  },

  // pending thì chưa có dueDate
  dueDate: {
    type: Date
  },

  returnDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'extended', 'returned'],
    default: 'pending'
  },

  // THÊM MỚI: Phân biệt mượn online vs trực tiếp
  borrowType: {
    type: String,
    enum: ['online', 'direct'],
    default: 'online'
  },

  extensionHistory: [{
    extendedAt: {
      type: Date,
      required: true
    },
    previousDueDate: {
      type: Date,
      required: true
    },
    newDueDate: {
      type: Date,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Virtual: số lần gia hạn trong tháng hiện tại
borrowSchema.virtual('extensionsThisMonth').get(function () {
  const now = new Date();
  return (this.extensionHistory || []).filter(ext => {
    const d = new Date(ext.extendedAt);
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  }).length;
});

borrowSchema.set('toJSON', { virtuals: true });
borrowSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Borrow', borrowSchema);
// backend/models/Borrow.js