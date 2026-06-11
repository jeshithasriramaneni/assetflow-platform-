import axios from 'axios';

const api = axios.create({
 baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; department?: string; phone?: string; adminCode?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; department?: string; phone?: string }) => api.patch('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.patch('/auth/me/password', data),
};

// Assets
export const assetsApi = {
  list: (params?: { search?: string; categoryId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/assets', { params }),
  get: (id: string) => api.get(`/assets/${id}`),
  getByQR: (qrCode: string) => api.get(`/assets/qr/${qrCode}`),
  create: (data: Record<string, unknown>) => api.post('/assets', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  getQRCode: (id: string) => api.get(`/assets/${id}/qrcode`),
};

// Categories
export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    api.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Bookings
export const bookingsApi = {
  list: (params?: { status?: string; assetId?: string; userId?: string; page?: number; limit?: number }) =>
    api.get('/bookings', { params }),
  get: (id: string) => api.get(`/bookings/${id}`),
  create: (data: { assetId: string; quantity: number; purpose: string; startDate: string; endDate: string }) =>
    api.post('/bookings', data),
  review: (id: string, data: { action: 'approve' | 'reject'; adminNote?: string }) =>
    api.patch(`/bookings/${id}/review`, data),
  issue: (id: string) => api.patch(`/bookings/${id}/issue`),
  return: (id: string) => api.patch(`/bookings/${id}/return`),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),
  notifyMe: (assetId: string) => api.post(`/bookings/${assetId}/notify-me`),
  requestReturn: (id: string) => api.patch(`/bookings/${id}/request-return`),
};

// Analytics
export const analyticsApi = {
  summary: () => api.get('/analytics/summary'),
  topAssets: () => api.get('/analytics/top-assets'),
  bookingTrends: () => api.get('/analytics/booking-trends'),
  categoryStats: () => api.get('/analytics/category-stats'),
  bookingStatus: () => api.get('/analytics/booking-status'),
  myStats: () => api.get('/analytics/my-stats'),
};

// Notifications
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Audit logs
export const auditApi = {
  list: (params?: { page?: number; limit?: number; action?: string; entityType?: string; userId?: string }) =>
    api.get('/audit', { params }),
};

// Users
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
};

// Maintenance
export const maintenanceApi = {
  listForAsset: (assetId: string) => api.get(`/maintenance/asset/${assetId}`),
  create: (data: { assetId: string; description: string; condition: string; cost?: number; resolvedAt?: string }) =>
    api.post('/maintenance', data),
};

// Suggestions
export const suggestionsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/suggestions', { params }),
  create: (data: { assetName: string; category: string; reason: string; quantity?: number; urgency?: string }) =>
    api.post('/suggestions', data),
  review: (id: string, data: { status: string; adminNote?: string }) =>
    api.patch(`/suggestions/${id}/review`, data),
  delete: (id: string) => api.delete(`/suggestions/${id}`),
};
