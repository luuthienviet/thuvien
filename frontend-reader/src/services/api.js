import axios from 'axios';

const API_URL = 'https://luuthienvietthuvien.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (cccd) => api.post('/auth/forgot-password', { cccd }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
  getMySubscription: () => api.get('/users/subscription/me'),
  submitPaymentProof: (formData) =>
    api.post('/users/subscription/payment-proof', formData),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
};

// Book APIs
export const bookAPI = {
  getBooks: (params) => api.get('/books', { params }),
  searchBooks: (query) => api.get('/books/search', { params: { q: query } }),
  getBook: (id) => api.get(`/books/${id}`),
};

// Borrow APIs
export const borrowAPI = {
  getBorrows: (params) => api.get('/borrows', { params }),
  getBorrow: (id) => api.get(`/borrows/${id}`),
  createBorrow: (data) => api.post('/borrows', data),
  extendBorrow: (id) => api.patch(`/borrows/${id}/extend`),
  // NEW: Hủy phiếu mượn (chỉ khi status = pending)
  cancelBorrow: (id) => api.delete(`/borrows/${id}`),
};

export default api;