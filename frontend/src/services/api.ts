
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tgcloud_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: async (username: string, password: string) => {
    const response = await api.post('/register', { username, password });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  }
};

// Telegram auth endpoints - Updated with robust error handling
export const telegramAPI = {
  checkConfig: async () => {
    const response = await api.get('/tgcloud/config/check');
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get('/tgcloud/auth/status');
    return response.data;
  },

  sendPhone: async (phone: string) => {
    const response = await api.post('/tgcloud/auth/phone', { phone });
    return response.data;
  },
  
  verifyCode: async (phone: string, code: string) => {
    const response = await api.post('/tgcloud/auth/verify_code', { phone, code });
    return response.data;
  },
  
  sendPassword: async (password: string) => {
    const response = await api.post('/tgcloud/auth/password', { password });
    return response.data;
  }
};

// Folders endpoints
export const foldersAPI = {
  list: async () => {
    const response = await api.get('/folders/');
    return response.data;
  },

  create: async (folder: string) => {
    const response = await api.post('/folders/', { folder });
    return response.data;
  },

  delete: async (foldername: string) => {
    const response = await api.delete(`/folders/${foldername}/`);
    return response.data;
  },

  rename: async (foldername: string, newName: string) => {
    const response = await api.put(`/folders/${foldername}/rename`, { new_name: newName });
    return response.data;
  },

  share: async (foldername: string) => {
    const response = await api.post(`/folders/${foldername}/share`);
    return response.data;
  }
};

// Files endpoints
export const filesAPI = {
  list: async (foldername: string) => {
    const response = await api.get(`/folders/${foldername}/files/`);
    return response.data;
  },

  upload: async (foldername: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/folders/${foldername}/files/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  download: async (foldername: string, filename: string) => {
    const response = await api.get(`/folders/${foldername}/files/${filename}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (foldername: string, filename: string) => {
    const response = await api.delete(`/folders/${foldername}/files/${filename}`);
    return response.data;
  },

  rename: async (foldername: string, filename: string, newName: string) => {
    const response = await api.put(`/folders/${foldername}/files/${filename}/rename`, { new_name: newName });
    return response.data;
  },

  move: async (foldername: string, filename: string, destFolder: string) => {
    const response = await api.post(`/folders/${foldername}/files/${filename}/move`, { dest_folder: destFolder });
    return response.data;
  },

  share: async (foldername: string, filename: string) => {
    const response = await api.post(`/folders/${foldername}/files/${filename}/share`);
    return response.data;
  }
};

// Stats endpoint
export const statsAPI = {
  get: async () => {
    const response = await api.get('/stats/');
    return response.data;
  }
};

// Encryption endpoints
export const encryptionAPI = {
  enable: async () => {
    const response = await api.post('/encryption/on');
    return response.data;
  },

  disable: async () => {
    const response = await api.post('/encryption/off');
    return response.data;
  }
};
