import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

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

// Stacks API (floor positions in a room)
export const stacksAPI = {
  getAll: (roomId) => api.get('/api/stacks', { params: { room_id: roomId } }),
  getOne: (id) => api.get(`/api/stacks/${id}`),
  create: (data) => api.post('/api/stacks', data),
  update: (id, data) => api.put(`/api/stacks/${id}`, data),
  delete: (id) => api.delete(`/api/stacks/${id}`),
};

// Bins API (covers both top-level bins and nested sub-bins)
export const binsAPI = {
  getAll: (params) => api.get('/api/bins', { params }),
  getTopLevel: () => api.get('/api/bins', { params: { top_level: true } }),
  getUnassigned: () => api.get('/api/bins', { params: { unassigned: true } }),
  getByStack: (stackId) => api.get('/api/bins', { params: { stack_id: stackId } }),
  getChildren: (parentId) => api.get('/api/bins', { params: { parent_id: parentId } }),
  getOne: (binId) => api.get(`/api/bins/${binId}`),
  create: (data) => api.post('/api/bins', data),
  update: (binId, data) => api.put(`/api/bins/${binId}`, data),
  delete: (binId) => api.delete(`/api/bins/${binId}`),
  getQRCode: (binId, size = 200) => api.get(`/api/bins/${binId}/qr-code`, { params: { size } }),
  getItems: (binId) => api.get(`/api/bins/${binId}/items`),
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/api/items', { params }),
  count: (params) => api.get('/api/items/count', { params }),
  getOne: (id) => api.get(`/api/items/${id}`),
  create: (data) => api.post('/api/items', data),
  update: (id, data) => api.put(`/api/items/${id}`, data),
  delete: (id) => api.delete(`/api/items/${id}`),
  search: (query) => api.get('/api/items/search', { params: { q: query } }),
  getCategories: () => api.get('/api/items/categories/list'),
};

// Images API
export const imagesAPI = {
  getForBin: (binId) => api.get('/api/images', { params: { bin_id: binId } }),
  getForItem: (itemId) => api.get('/api/images', { params: { item_id: itemId } }),
  upload: (file, { bin_id, item_id } = {}) => {
    const form = new FormData();
    form.append('file', file);
    const params = {};
    if (bin_id) params.bin_id = bin_id;
    if (item_id) params.item_id = item_id;
    return api.post('/api/images/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    });
  },
  delete: (id) => api.delete(`/api/images/${id}`),
};

// Layout Slots API
export const layoutSlotsAPI = {
  getAll: (stackId) => api.get('/api/layout-slots', { params: { stack_id: stackId } }),
  create: (data) => api.post('/api/layout-slots', data),
  update: (id, data) => api.put(`/api/layout-slots/${id}`, data),
  delete: (id) => api.delete(`/api/layout-slots/${id}`),
};

// Bin Types API
export const binTypesAPI = {
  getAll: () => api.get('/api/bin-types'),
  getOne: (id) => api.get(`/api/bin-types/${id}`),
  create: (data) => api.post('/api/bin-types', data),
  update: (id, data) => api.put(`/api/bin-types/${id}`, data),
  delete: (id) => api.delete(`/api/bin-types/${id}`),
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/bin-types/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (id) => api.delete(`/api/bin-types/${id}/image`),
};

export default api;
