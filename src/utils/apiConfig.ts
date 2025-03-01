import axios from 'axios';
import { authService } from '@/services/authService';
import metrics from './metrics';

export const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.mockylab.com'}/api`;

console.log('Environment Config:', {
  API_URL,
  NODE_ENV: process.env.NODE_ENV,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
});

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  withCredentials: true,
  headers: {
    'Accept': '*/*'
  }
});

// FormData gönderirken Content-Type header'ını otomatik ayarla
apiClient.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    // FormData için Content-Type'ı browser otomatik ayarlasın
    delete config.headers['Content-Type'];
  }
  return config;
});

// API istek interceptor'ını güncelleyelim
apiClient.interceptors.request.use(request => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('API Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    headers: request.headers,
    environment: process.env.NODE_ENV,
    data: request.data instanceof FormData ? 
      'FormData Contents:' + Array.from(request.data.entries()).map(([key, value]) => 
        `${key}: ${value instanceof File ? value.name : value}`
      ).join(', ') 
      : request.data
  });

  return request;
}, error => {
  console.error('Request Error:', error);
  return Promise.reject(error);
});

// Request interceptor for adding auth token and start time for metrics
apiClient.interceptors.request.use(
  (config) => {
    // İstek başlangıç zamanını kaydet
    config.headers['x-request-start-time'] = Date.now().toString();
    
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(response => {
  console.log('API Response:', {
    url: response.config.url,
    status: response.status,
    data: response.data
  });
  
  // Başarılı API isteklerini metrik olarak kaydet
  try {
    const startTime = response.config.headers['x-request-start-time'];
    if (startTime && typeof metrics.recordApiRequest === 'function') {
      const duration = (Date.now() - Number(startTime)) / 1000;
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const endpoint = response.config.url || 'unknown';
      metrics.recordApiRequest(method, endpoint, response.status, duration);
    }
  } catch (error) {
    console.error('API metrics recording error:', error);
  }
  
  return response;
}, error => {
  console.error('Response Error:', {
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  
  // Hatalı API isteklerini metrik olarak kaydet
  try {
    const startTime = error.config?.headers?.['x-request-start-time'];
    if (startTime && typeof metrics.recordApiRequest === 'function') {
      const duration = (Date.now() - Number(startTime)) / 1000;
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const endpoint = error.config?.url || 'unknown';
      const status = error.response?.status || 500;
      metrics.recordApiRequest(method, endpoint, status, duration);
    }
  } catch (metricError) {
    console.error('API error metrics recording error:', metricError);
  }
  
  if (error.response?.status === 401) {
    // Token expired or invalid
    authService.logout();
    window.location.href = '/login';
    return Promise.reject(new Error('Authentication failed. Please login again.'));
  }
  return Promise.reject(error);
});

// Auth endpoints
export const AUTH_ENDPOINTS = {
  login: '/Auth/login'
};

// Tam URL oluşturmak için yardımcı fonksiyon
export const getFullUrl = (endpoint: string) => `${API_URL}${endpoint}`;

// API endpoints
export const endpoints = {
  auth: {
    login: '/Auth/login',
    refreshToken: '/Auth/refresh-token',
  },
  user: {
    printifySettings: '/User/printify-settings',
    printifyApiKey: '/User/printify-api-key',
    shopId: '/User/shop-id',
    blueprints: (userId: string) => `/UserOfBlueprint/user/${userId}`,
  },
  printify: {
    blueprints: {
      list: '/Printify/blueprints',
      details: (id: string) => `/Printify/blueprints/${id}`,
      variants: (blueprintId: string) => `/Printify/blueprints/${blueprintId}/variants`,
      syncVariants: (blueprintId: string) => `/Printify/blueprints/${blueprintId}/variants/sync`,
    },
    products: '/Printify/products',
    images: {
      upload: '/PrintifyImage/upload',
    },
  },
  mockup: {
    list: '/Mockup',
    details: (id: number) => `/Mockup/${id}`,
    create: '/Mockup',
    update: (id: number) => `/Mockup/${id}`,
    delete: (id: number) => `/Mockup/${id}`,
    generate: '/Mockup/generate',
    designAreas: {
      list: (mockupId: number) => `/mockups/${mockupId}/design-areas`,
      create: (mockupId: number) => `/mockups/${mockupId}/design-areas`,
      update: (mockupId: number, areaId: number) => `/mockups/${mockupId}/design-areas/${areaId}`,
      delete: (mockupId: number, areaId: number) => `/mockups/${mockupId}/design-areas/${areaId}`,
    },
  },
  favorite: {
    lists: {
      list: (userId: string) => `/Favorite/${userId}/lists`,
      create: (userId: string) => `/Favorite/${userId}/lists`,
      delete: (listId: number) => `/Favorite/lists/${listId}`,
      mockups: {
        add: (listId: number) => `/Favorite/lists/${listId}/mockups/batch`,
        remove: (listId: number, mockupId: number) => `/Favorite/lists/${listId}/mockups/${mockupId}`,
      },
    },
  },
  ideogram: {
    getDescription: '/Ideogram/get-description',
    remix: '/Ideogram/remix',
  },
};

// Helper function to get user ID from token
export const getCurrentUserId = (): string => {
  const user = authService.getCurrentUser();
  if (!user?.userId) {
    throw new Error('User ID not found');
  }
  return user.userId;
};

// Error handler helper
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.title) {
      return error.response.data.title;
    }
    if (typeof error.response?.data === 'string') {
      return error.response.data;
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}; 