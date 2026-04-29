const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Database connection (chỉ kết nối 1 lần, tránh tạo nhiều kết nối trên Vercel)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Không dùng process.exit(1) trên Vercel
  }
};

// Kết nối DB trước mỗi request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/borrows', require('./routes/borrows'));
app.use('/api/users', require('./routes/users'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    status: 'running',
    db: isConnected ? 'connected' : 'disconnected',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      borrows: '/api/borrows',
      users: '/api/users'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.message === 'Unexpected end of form') {
    return res.status(400).json({
      success: false,
      message: 'Lỗi upload file: Dữ liệu không hợp lệ'
    });
  }

  if (err.message && err.message.includes('LIMIT_FILE_SIZE')) {
    return res.status(413).json({
      success: false,
      message: 'File quá lớn (tối đa 5MB)'
    });
  }

  if (err.message && (err.message.includes('image') || err.message.includes('MIME'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Loại file không hợp lệ'
    });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại`
  });
});

// Chạy local (không cần thiết trên Vercel nhưng giữ để dev)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;