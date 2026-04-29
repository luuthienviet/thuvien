const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['0.0.0.0', '8.8.8.8']);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
  console.log(`\n📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  console.log('📍 Full URL:', req.originalUrl);
  console.log('Headers:', Object.keys(req.headers).join(', '));
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
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
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      borrows: '/api/borrows'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Multer errors
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
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});