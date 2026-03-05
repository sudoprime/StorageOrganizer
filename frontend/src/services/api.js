import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rooms API
export const roomsAPI = {
  getAll: () => api.get('/api/rooms'),
  getOne: (id) => api.get(`/api/rooms/${id}`),
  create: (data) => api.post('/api/rooms', data),
  update: (id, data) => api.put(`/api/rooms/${id}`, data),
  delete: (id) => api.delete(`/api/rooms/${id}`),
};

// Bins API
export const binsAPI = {
  getAll: (params) => api.get('/api/bins', { params }),
  getOne: (binId) => api.get(`/api/bins/${binId}`),
  create: (data) => api.post('/api/bins', data),
  update: (binId, data) => api.put(`/api/bins/${binId}`, data),
  delete: (binId) => api.delete(`/api/bins/${binId}`),
  getQRCode: (binId, size = 200) => api.get(`/api/bins/${binId}/qr-code`, { params: { size } }),
  getItems: (binId) => api.get(`/api/bins/${binId}/items`),
};

// Containers API
export const containersAPI = {
  getAll: () => api.get('/api/containers'),
  getOne: (containerId) => api.get(`/api/containers/${containerId}`),
  create: (data) => api.post('/api/containers', data),
  update: (containerId, data) => api.put(`/api/containers/${containerId}`, data),
  delete: (containerId) => api.delete(`/api/containers/${containerId}`),
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/api/items', { params }),
  getOne: (id) => api.get(`/api/items/${id}`),
  create: (data) => api.post('/api/items', data),
  update: (id, data) => api.put(`/api/items/${id}`, data),
  delete: (id) => api.delete(`/api/items/${id}`),
  search: (query) => api.get('/api/items/search', { params: { q: query } }),
  getCategories: () => api.get('/api/items/categories/list'),
};

export default api;
