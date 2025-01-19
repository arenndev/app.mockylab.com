const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
export const API_URL = `${API_BASE_URL}/api`;

// Auth endpoints
export const AUTH_ENDPOINTS = {
  login: '/Auth/login'
};

// Tam URL oluşturmak için yardımcı fonksiyon
export const getFullUrl = (endpoint: string) => `${API_URL}${endpoint}`;

// API endpoint'lerini oluştur
export const endpoints = {
  auth: {
    login: '/Auth/login',
  },
  printify: {
    blueprints: '/Printify/blueprints',
    products: '/Printify/products',
    variants: (blueprintId: string) => `/Printify/blueprints/${blueprintId}/variants`,
    syncVariants: (blueprintId: string) => `/Printify/blueprints/${blueprintId}/variants/sync`,
    uploadImage: '/PrintifyImage/upload',
  },
  user: {
    printifySettings: '/User/printify-settings',
    printifyApiKey: '/User/printify-api-key',
    shopId: '/User/shop-id',
    blueprints: (userId: number) => `/UserOfBlueprint/user/${userId}`,
  },
  ideogram: {
    getDescription: '/Ideogram/get-description',
  },
}; 