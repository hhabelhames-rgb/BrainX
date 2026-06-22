import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Bearer Token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brainx_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Auto-refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('brainx_access_token', newToken);
        api.defaults.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('brainx_access_token');
        localStorage.removeItem('brainx_user');
        window.location.reload();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (token) => api.post('/auth/google', { token }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar: () => api.delete('/users/avatar'),
  deleteAccount: () => api.delete('/users/account'),
};

// ─── Matches API ──────────────────────────────────────────────────────────────
export const matchesApi = {
  getAll: () => api.get('/matches'),
  accept: (matchId) => api.post('/matches/accept', { matchId }),
  reject: (matchId) => api.post('/matches/reject', { matchId }),
};

// ─── Conversations API ────────────────────────────────────────────────────────
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  createOrGet: (recipientId) => api.post('/conversations', { recipientId }),
  createSupport: () => api.post('/conversations/support'),
};

// ─── Messages API ─────────────────────────────────────────────────────────────
export const messagesApi = {
  getByConversation: (convId, params) => api.get(`/messages/${convId}`, { params }),
  send: (data) => api.post('/messages', data),
};

// ─── Sessions API ─────────────────────────────────────────────────────────────
export const sessionsApi = {
  create: (data) => api.post('/sessions', data),
  getAll: (params) => api.get('/sessions', { params }),
  accept: (id) => api.put(`/sessions/${id}/accept`),
  cancel: (id, reason) => api.put(`/sessions/${id}/cancel`, { reason }),
  complete: (id) => api.put(`/sessions/${id}/complete`),
  delete: (id) => api.delete(`/sessions/${id}`),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/read/${id}`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ─── Reviews API ──────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (data) => api.post('/reviews', data),
  getByUser: (userId) => api.get(`/reviews/user/${userId}`),
};

// ─── Reports API ──────────────────────────────────────────────────────────────
export const reportsApi = {
  create: (data) => api.post('/reports', data),
};

// ─── Admin API ────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getReports: () => api.get('/admin/reports'),
  getSessions: () => api.get('/admin/sessions'),
  getReviews: () => api.get('/admin/reviews'),
  blockUser: (id) => api.put(`/admin/block-user/${id}`),
  unblockUser: (id) => api.put(`/admin/unblock-user/${id}`),
  deleteUser: (id) => api.delete(`/admin/user/${id}`),
};

export default api;
