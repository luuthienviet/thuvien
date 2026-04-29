import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Nếu data là FormData, xóa Content-Type header để axios tự set
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Users
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  getPendingSubscriptionPayments: () => api.get('/users/subscription/pending'),
  approveSubscriptionPayment: (id) => api.patch(`/users/${id}/subscription/approve`),
  rejectSubscriptionPayment: (id, data) => api.patch(`/users/${id}/subscription/reject`, data),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Books
export const bookAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
  updateStatus: (id, status) => api.patch(`/books/${id}/status`, { status }),
  updateConditions: (id, conditions) => api.patch(`/books/${id}/conditions`, conditions),
};

// Borrows
export const borrowAPI = {
  getBorrows: (params) => api.get('/borrows', { params }),
  // ✅ Fix: truyền { borrowDays } vào body của request
  approveBorrow: (id, data) => api.patch(`/borrows/${id}/approve`, data),
  returnBorrow: (id) => api.patch(`/borrows/${id}/return`),
  // ✅ THÊM MỚI: API mượn sách trực tiếp
  createDirectBorrow: (data) => api.post('/borrows/direct', data),
};

export default api;
// frontend-admin/src/services/api.js