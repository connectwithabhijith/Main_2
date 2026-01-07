// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// const API_BASE_URL = 'http://172.20.10.3:3001/api';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper to build headers
const getHeaders = (includeAuth = true, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic fetch wrapper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: options.headers || getHeaders(options.auth !== false, options.isFormData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth API
export const authApi = {
  signup: (userData) => apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
    auth: false
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    auth: false
  }),
  
  getProfile: () => apiRequest('/auth/me'),
  
  updateProfile: (data) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest('/categories', { auth: false })
};

// ML Prediction API
export const mlApi = {
  predict: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const url = `${API_BASE_URL}/ml/predict`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Prediction failed');
    }
    
    return data;
  }
};

// Ads API
export const adsApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ads${queryString ? `?${queryString}` : ''}`, { auth: false });
  },
  
  getById: (id) => apiRequest(`/ads/${id}`, { auth: false }),
  
  getMyAds: () => apiRequest('/ads/user/my-ads'),
  
  create: (adData) => apiRequest('/ads', {
    method: 'POST',
    body: JSON.stringify(adData)
  }),
  
  update: (id, adData) => apiRequest(`/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(adData)
  }),
  
  delete: (id) => apiRequest(`/ads/${id}`, {
    method: 'DELETE'
  }),
  
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const url = `${API_BASE_URL}/ads/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data;
  }
};

// Messages API
export const messagesApi = {
  getConversations: () => apiRequest('/messages/conversations'),
  
  getOrCreateConversation: (adId, sellerId) => apiRequest('/messages/conversation', {
    method: 'POST',
    body: JSON.stringify({ adId, sellerId })
  }),
  
  getMessages: (conversationId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/messages/${conversationId}${queryString ? `?${queryString}` : ''}`);
  },
  
  sendMessage: (conversationId, content) => apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, content })
  }),
  
  getUnreadCount: () => apiRequest('/messages/unread/count')
};

export default {
  auth: authApi,
  categories: categoriesApi,
  ml: mlApi,
  ads: adsApi,
  messages: messagesApi
};
