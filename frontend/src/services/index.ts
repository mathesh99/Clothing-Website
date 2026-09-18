import api from './api';

export const authService = {
  sendRegistrationOtp: (email: string) =>
    api.post('/auth/send-registration-otp', { email }),

  verifyRegistrationOtp: (email: string, otp: string) =>
    api.post('/auth/verify-registration-otp', { email, otp }),

  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

export const productService = {
  getProducts: (params?: Record<string, any>) =>
    api.get('/products', { params }),

  getProduct: (slug: string) =>
    api.get(`/products/${slug}`),

  getFeatured: (limit = 8) =>
    api.get('/products/featured', { params: { limit } }),

  getNewArrivals: (limit = 8) =>
    api.get('/products/new-arrivals', { params: { limit } }),

  getRelated: (productId: string, categoryId: string) =>
    api.get('/products/related', { params: { productId, categoryId } }),
};

export const categoryService = {
  getCategories: () => api.get('/categories'),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (variantId: string, quantity = 1) =>
    api.post('/cart/items', { variantId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) =>
    api.delete(`/cart/items/${itemId}`),
  mergeGuestCart: (guestId: string) =>
    api.post('/cart/merge', { guestId }),
};

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addItem: (productId: string) =>
    api.post('/wishlist/items', { productId }),
  removeItem: (productId: string) =>
    api.delete(`/wishlist/items/${productId}`),
};

export const orderService = {
  createOrder: (data: { addressId: string; couponCode?: string }) =>
    api.post('/orders', data),
  getMyOrders: (page = 1) =>
    api.get('/orders', { params: { page } }),
  getOrder: (id: string) =>
    api.get(`/orders/${id}`),
};

export const paymentService = {
  createRazorpayOrder: (orderId: string) =>
    api.post('/payments/create-order', { orderId }),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post('/payments/verify', data),
};

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.patch('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/me/password', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: any) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: any) => api.patch(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
};

export const couponService = {
  validate: (code: string, subtotal: number) =>
    api.post('/coupons/validate', { code, subtotal }),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getProducts: (params?: any) => api.get('/admin/products', { params }),
  getProduct: (id: string) => api.get(`/admin/products/${id}`),
  createProduct: (data: any) => api.post('/admin/products', data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  uploadImages: (productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return api.post(`/admin/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getInventory: (params?: any) => api.get('/admin/inventory', { params }),
  updateStock: (variantId: string, stock: number, note?: string) =>
    api.patch(`/admin/inventory/${variantId}/stock`, { stock, note }),
  getOrders: (params?: any) => api.get('/admin/orders', { params }),
  getOrder: (id: string) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id: string, status: string, trackingNumber?: string) =>
    api.patch(`/admin/orders/${id}/status`, { status, trackingNumber }),
  getCustomers: (params?: any) => api.get('/admin/customers', { params }),
  toggleCustomerStatus: (id: string) => api.patch(`/admin/customers/${id}/toggle-status`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  getClothingTypes: () => api.get('/admin/clothing-types'),
  saveClothingTypes: (types: string[]) => api.post('/admin/clothing-types', { types }),
  getSiteContent: () => api.get('/site-content'),
  saveSiteContent: (data: any) => api.put('/admin/site-content', data),
  getReviews: (params?: any) => api.get('/admin/reviews', { params }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),
};
