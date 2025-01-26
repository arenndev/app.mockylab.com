import axios, { AxiosError } from 'axios';
import { authService } from './authService';
import {
  PrintifySettings,
  Blueprint,
  BlueprintListResponse,
  VariantResponse,
  CreateProductRequest,
  PrintifyApiResponse,
  BlueprintVariant
} from '@/types/printify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mockylab.com';

const ENDPOINTS = {
  settings: {
    get: '/api/User/printify-settings',
    updateApiKey: '/api/User/printify-api-key',
    updateShopId: '/api/User/shop-id',
  },
  blueprints: {
    list: '/api/Printify/blueprints',
    get: (id: number) => `/api/Printify/blueprints/${id}`,
    variants: (id: number) => `/api/Printify/blueprints/${id}/variants`,
    syncVariants: (id: number) => `/api/Printify/blueprints/${id}/variants/sync`,
  },
  products: {
    create: '/api/Printify/products',
  },
  images: {
    upload: '/api/PrintifyImage/upload',
  },
  user: {
    blueprints: (userId: string) => `/api/UserOfBlueprint/user/${userId}`,
    removeBlueprint: (id: number) => `/api/UserOfBlueprint/${id}`,
    variants: {
      get: (id: number) => `/api/UserOfVariant/${id}`,
      getByUser: (userId: string) => `/api/UserOfVariant/user/${userId}`,
      getByBlueprint: (userId: string, blueprintId: number) => `/api/UserOfVariant/user/${userId}/blueprint/${blueprintId}`,
      create: '/api/UserOfVariant',
      createBulk: '/api/UserOfVariant/bulk',
      update: (id: number) => `/api/UserOfVariant/${id}`,
      delete: (id: number) => `/api/UserOfVariant/${id}`,
    },
  },
  userVariants: {
    get: (id: number) => `/api/UserOfVariant/${id}`,
    getByUser: (userId: string) => `/api/UserOfVariant/user/${userId}`,
    getByBlueprint: (userId: string, blueprintId: number) => `/api/UserOfVariant/user/${userId}/blueprint/${blueprintId}`,
    create: '/api/UserOfVariant',
    createBulk: '/api/UserOfVariant/bulk',
    update: (id: number) => `/api/UserOfVariant/${id}`,
    delete: (id: number) => `/api/UserOfVariant/${id}`
  }
};

class PrintifyService {
  private getHeaders() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // API key hatası
      if (axiosError.response?.status === 400) {
        if (typeof axiosError.response?.data === 'string' && axiosError.response?.data.includes('API key not found')) {
          throw new Error('Printify API key not found. Please configure it in settings.');
        }
        throw new Error(axiosError.response?.data?.message || axiosError.response?.data || 'Bad request');
      }
      
      // Blueprint bulunamadı hatası
      if (axiosError.response?.status === 500 && typeof axiosError.response?.data === 'string' && axiosError.response?.data.includes('404')) {
        throw new Error('Blueprint not found on Printify. It might have been deleted or is temporarily unavailable.');
      }

      // Diğer API hataları
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'An error occurred');
    }
    
    throw error;
  }

  // Settings
  async getSettings(): Promise<PrintifySettings> {
    try {
      const response = await axios.get<PrintifySettings>(
        `${API_URL}${ENDPOINTS.settings.get}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateApiKey(apiKey: string): Promise<void> {
    try {
      await axios.post(
        `${API_URL}${ENDPOINTS.settings.updateApiKey}`,
        { apiKey },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Blueprints
  async getBlueprints(params: {
    search?: string;
    brand?: string;
    page: number;
    pageSize: number;
  }): Promise<BlueprintListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.brand) {
        queryParams.append('brand', params.brand);
      }
      queryParams.append('page', params.page.toString());
      queryParams.append('pageSize', params.pageSize.toString());

      const response = await axios.get<BlueprintListResponse>(
        `${API_URL}${ENDPOINTS.blueprints.list}?${queryParams.toString()}`,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBlueprintDetails(id: number): Promise<Blueprint> {
    try {
      const response = await axios.get<Blueprint>(
        `${API_URL}${ENDPOINTS.blueprints.get(id)}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBlueprintVariants(
    blueprintId: number,
    params: { printProviderId: number; page: number; pageSize: number }
  ): Promise<VariantResponse> {
    try {
      const response = await axios.get<VariantResponse>(
        `${API_URL}${ENDPOINTS.blueprints.variants(blueprintId)}`,
        {
          params: {
            printProviderId: params.printProviderId,
            page: 1,
            pageSize: 1000 // Increased page size to get more variants at once
          },
          headers: this.getHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async syncBlueprintVariants(
    blueprintId: number,
    printProviderId: number
  ): Promise<void> {
    try {
      await axios.post(
        `${API_URL}${ENDPOINTS.blueprints.syncVariants(blueprintId)}`,
        {},
        {
          params: { printProviderId },
          headers: this.getHeaders(),
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Products
  async createProduct(data: CreateProductRequest): Promise<PrintifyApiResponse<any>> {
    try {
      const response = await axios.post<PrintifyApiResponse<any>>(
        `${API_URL}${ENDPOINTS.products.create}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Images
  async uploadImage(formData: FormData): Promise<PrintifyApiResponse<{ printifyImageId: string }>> {
    try {
      const response = await axios.post<PrintifyApiResponse<{ printifyImageId: string }>>(
        `${API_URL}${ENDPOINTS.images.upload}`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User Blueprints
  async getUserBlueprints(userId: string) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.user.blueprints(userId)}`,
        { headers: this.getHeaders() }
      );
      
      const userBlueprints = response.data;
      const detailedBlueprints = await Promise.all(
        userBlueprints.map(async (userBlueprint: any) => {
          try {
            const blueprintDetails = await this.getBlueprintDetails(userBlueprint.blueprintId);
            return {
              ...userBlueprint,
              blueprint: blueprintDetails
            };
          } catch (error) {
            console.error(`Error fetching blueprint details for ID ${userBlueprint.blueprintId}:`, error);
            return {
              ...userBlueprint,
              blueprint: {
                id: userBlueprint.blueprintId,
                title: 'Blueprint not found',
                description: 'This blueprint may have been deleted or is temporarily unavailable.',
                brand: 'Unknown',
                model: 'Unknown',
                images: []
              }
            };
          }
        })
      );

      return detailedBlueprints;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async addBlueprintToUser(userId: string, blueprintId: number): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/api/UserOfBlueprint`,
        { 
          userId: parseInt(userId), 
          blueprintId 
        },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeUserBlueprint(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}${ENDPOINTS.user.removeBlueprint(id)}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User Variants
  async getUserVariants(userId: string) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.user.variants.getByUser(userId)}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserVariantsByBlueprint(userId: string, blueprintId: number) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.userVariants.getByBlueprint(userId, blueprintId)}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createUserVariant(data: {
    userId: number;
    blueprintId: number;
    variantId: number;
    defaultPrice: number;
    isEnabled: boolean;
  }) {
    try {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.userVariants.create}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createUserVariantsBulk(data: {
    userId: number;
    blueprintId: number;
    variantId: number;
    defaultPrice: number;
    isEnabled: boolean;
  }[]) {
    try {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.userVariants.createBulk}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUserVariant(id: number, data: {
    defaultPrice: number;
    isEnabled: boolean;
    isActive: boolean;
  }) {
    try {
      const response = await axios.put(
        `${API_URL}${ENDPOINTS.userVariants.update(id)}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteUserVariant(id: number) {
    try {
      await axios.delete(
        `${API_URL}${ENDPOINTS.userVariants.delete(id)}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const printifyService = new PrintifyService(); 