import axios, { AxiosError } from 'axios';
import { authService } from './authService';
import { getCurrentUserId } from '@/utils/apiConfig';
import {
  PrintifySettings,
  Blueprint,
  BlueprintListResponse,
  VariantResponse,
  PrintifyApiResponse,
  BlueprintVariant,
  PaginatedResponse,
  Product,
  UpdateVariantRequest,
  BulkOperationsRequest
} from '@/types/printify';

// API URL'i çevre değişkenlerinden alıyoruz, varsayılan olarak canlı ortam URL'ini kullanıyoruz
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
    list: (shopId: string) => `/api/Printify/shops/${shopId}/products`,
    get: (shopId: string, productId: string) => `/api/Printify/shops/${shopId}/products/${productId}`,
    updateTags: (shopId: string, productId: string) => `/api/Printify/shops/${shopId}/products/${productId}/tags`,
  },
  images: {
    upload: '/api/PrintifyImage/upload',
  },
  user: {
    blueprints: (userId: number) => `/api/UserOfBlueprint/user/${userId}`,
    removeBlueprint: (id: number) => `/api/UserOfBlueprint/${id}`,
    variants: {
      get: (id: number) => `/api/UserOfVariant/${id}`,
      getByUser: (userId: number) => `/api/UserOfVariant/user/${userId}`,
      getByBlueprint: (userId: number, blueprintId: number) => `/api/UserOfVariant/user/${userId}/blueprint/${blueprintId}`,
      create: '/api/UserOfVariant',
      createBulk: '/api/UserOfVariant/bulk',
      update: (id: number) => `/api/UserOfVariant/${id}`,
      delete: (id: number) => `/api/UserOfVariant/${id}`,
    },
  },
  userVariants: {
    get: (id: number) => `/api/UserOfVariant/${id}`,
    getByUser: (userId: number) => `/api/UserOfVariant/user/${userId}`,
    getByBlueprint: (userId: number, blueprintId: number) => `/api/UserOfVariant/user/${userId}/blueprint/${blueprintId}`,
    create: '/api/UserOfVariant',
    createBulk: '/api/UserOfVariant/bulk',
    update: (id: number) => `/api/UserOfVariant/${id}`,
    delete: (id: number) => `/api/UserOfVariant/${id}`
  }
};

class PrintifyService {
  private shopId: string | null = null;

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

  async getShopId(): Promise<string> {
    if (this.shopId) {
      return this.shopId;
    }

    try {
      const response = await axios.get<string>(
        `${API_URL}/api/User/printify-shop-id`,
        { headers: this.getHeaders() }
      );
      this.shopId = response.data;
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error) && error.response?.data) {
        console.error('API Error:', error.response.data);
        throw new Error(error.response.data.message || 'API request failed');
    }
    console.error('Service Error:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
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
      const response = await axios.post(
        `${API_URL}/api/User/printify-api-key`,
        { printifyApiKey: apiKey },
        { 
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update API key');
      }
    } catch (error) {
      console.error('Error updating Printify API key:', error);
      throw this.handleError(error);
    }
  }

  // Shop ID sync için mevcut endpoint'i kullanalım
  async syncShopId(): Promise<void> {
    try {
      const response = await axios.post(
        `${API_URL}/api/User/shop-id`,
        {},
        { headers: this.getHeaders() }
      );

      if (!response.data.shopId) {
        throw new Error('Failed to sync shop ID');
      }
    } catch (error) {
      console.error('Error syncing shop ID:', error);
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
  async createProduct(data: {
    title: string;
    description: string;
    blueprintId: number;
    variantImages: {
        black: string | undefined;
        white: string | undefined;
        color: string | undefined;
    };
    tags: string[];
    userId: number;
  }): Promise<any> {
    try {
        console.log('Creating product with data:', data);

        // API'nin beklediği formata dönüştür
        const requestBody = {
            title: data.title,
            description: data.description,
            blueprintId: data.blueprintId,
            variantImages: {
                black: data.variantImages.black || undefined,
                white: data.variantImages.white || undefined
                // color anahtarını kaldırdık
            },
            tags: data.tags || [],
            userId: data.userId
        };

        // Boş değerleri temizle
        if (!requestBody.variantImages.black) delete requestBody.variantImages.black;
        if (!requestBody.variantImages.white) delete requestBody.variantImages.white;

        // Request'i yazdır
        console.log('Sending request with body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${API_URL}/api/Printify/products`,
            requestBody,
            { 
                headers: {
                    ...this.getHeaders(),
                    'Accept': 'application/json'
                }
            }
        );

        console.log('Create product response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Create product error:', error);
        if (axios.isAxiosError(error) && error.response?.data) {
            console.error('Error response:', error.response.data);
            throw new Error(error.response.data.message || 'Failed to create product');
        }
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
  async getUserBlueprints(userId: number) {
    try {
      console.log(`Fetching user blueprints for user ID: ${userId}`);
      const response = await axios.get(`${API_URL}${ENDPOINTS.user.blueprints(userId)}`, {
        headers: this.getHeaders(),
      });

      console.log('Raw user blueprints response:', response.data);

      // Kullanıcı blueprint'lerini al
      const userBlueprints = response.data;

      if (!userBlueprints || userBlueprints.length === 0) {
        console.log('No user blueprints found');
        return [];
      }

      // Eğer blueprint detayları yoksa, her bir blueprint için detayları ayrıca getir
      const enrichedBlueprints = await Promise.all(
        userBlueprints.map(async (userBlueprint: { blueprintId: number; blueprint?: any }) => {
          if (!userBlueprint.blueprint) {
            try {
              const blueprintDetails = await this.getBlueprintDetails(userBlueprint.blueprintId);
              return {
                ...userBlueprint,
                blueprint: blueprintDetails
              };
            } catch (error) {
              console.error(`Error fetching details for blueprint ${userBlueprint.blueprintId}:`, error);
              return userBlueprint;
            }
          }
          return userBlueprint;
        })
      );

      console.log('Enriched blueprints:', enrichedBlueprints);
      return enrichedBlueprints;
    } catch (error) {
      this.handleError(error);
    }
  }

  async addBlueprintToUser(userId: number, blueprintId: number): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/UserOfBlueprint`, {
        blueprintId,
        userId,
        isActive: true
      }, { headers: this.getHeaders() });
    } catch (error) {
      console.error('Error adding blueprint to user:', error);
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
  async getUserVariants(userId: number) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.userVariants.getByUser(userId)}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserVariantsByBlueprint(userId: number, blueprintId: number) {
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
    designColor: 'Black' | 'White' | 'Color';
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
    designColor: 'Black' | 'White' | 'Color';
  }[]) {
    try {
      const response = await axios.post(
        `${API_URL}/api/UserOfVariant/bulk`,
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
    designColor: 'Black' | 'White' | 'Color';
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

  // Products list
  async getProducts(shopId: string, page: number = 1, limit: number = 20) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.products.list(shopId)}`,
        {
          params: {
            page,
            limit,
            useCache: false
          },
          headers: this.getHeaders()
        }
      );
      
      console.log('Products API Full Response:', response);
      
      // Ensure we're accessing the nested data structure correctly
      const responseData = response.data;
      const products = responseData.data?.data || [];
      const paginationData = responseData.data;

      return {
        data: products,
        currentPage: paginationData?.current_page || page,
        lastPage: paginationData?.last_page || 1,
        total: paginationData?.total || 0,
        perPage: paginationData?.per_page || limit
      };
    } catch (error) {
      console.error('Products API Error:', error);
      throw this.handleError(error);
    }
  }

  // Single product detail
  async getProduct(shopId: string, productId: string) {
    try {
      const response = await axios.get(
        `${API_URL}${ENDPOINTS.products.get(shopId, productId)}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProductTags(shopId: string, productId: string, tags: string[]) {
    try {
      const response = await axios.post(
        `${API_URL}${ENDPOINTS.products.updateTags(shopId, productId)}`,
        { tags },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk update methodunu güncelle
  async updateUserVariantsBulk(updates: UpdateVariantRequest[]) {
    try {
      const response = await axios.put(
        `${API_URL}/api/UserOfVariant/bulk-update`,
        updates,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Yeni bulk operations methodu
  async bulkOperations(data: BulkOperationsRequest) {
    try {
      const response = await axios.post(
        `${API_URL}/api/UserOfVariant/bulk-operations`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const printifyService = new PrintifyService(); 