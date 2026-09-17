const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerCustomer: (data) => request('/auth/register/customer', { method: 'POST', body: JSON.stringify(data) }),
  registerProvider: (data) => request('/auth/register/provider', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/demo-accounts'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`);
  },
  getProductById: (id, coords = {}) => {
    const query = new URLSearchParams(coords).toString();
    return request(`/products/${id}${query ? `?${query}` : ''}`);
  },
  getCategories: () => request('/products/categories'),

  // Cart
  validateCart: (items) => request('/products/cart/validate', { method: 'POST', body: JSON.stringify({ items }) }),

  // Orders
  createOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getCustomerOrders: () => request('/orders'),
  getOrderById: (id) => request(`/orders/${id}`),

  // Provider
  getProviderDashboard: () => request('/provider/dashboard'),
  getProviderProducts: () => request('/provider/products'),
  createProduct: (productData) => request('/provider/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, data) => request(`/provider/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/provider/products/${id}`, { method: 'DELETE' }),
  getProviderOrders: () => request('/provider/orders'),
  updateOrderStatus: (id, status) => request(`/provider/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  verifyPickup: (data) => request('/provider/pickup/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminAnalytics: () => request('/admin/analytics'),
  getAdminProviders: () => request('/admin/providers'),
  updateProviderStatus: (id, status) => request(`/admin/providers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminUsers: () => request('/admin/users'),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminProducts: () => request('/admin/products'),
  toggleProductStatus: (id, isActive) => request(`/admin/products/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  getAdminOrders: () => request('/admin/orders'),
  refundOrder: (id) => request(`/admin/orders/${id}/refund`, { method: 'PUT' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' })
};

export default api;
