import { apiClient, endpoints, handleApiError } from '@/utils/apiConfig';
import { authService } from './authService';

export interface FavoriteList {
  id: number;
  name: string;
  category?: string;
  Category?: string;
  mockups: Mockup[];
}

export interface Mockup {
  id: number;
  name: string;
  backgroundImagePreviewPath: string;
  category?: string;
  genderCategory?: string;
  sizeCategory?: string;
}

class FavoriteService {
  private async getUserId() {
    const user = authService.getCurrentUser();
    if (!user?.userId) throw new Error('User ID not found');
    return user.userId;
  }

  async getLists(): Promise<FavoriteList[]> {
    try {
      const userId = await this.getUserId();
      const response = await apiClient.get(endpoints.favorite.lists.list(userId));
      
      if (Array.isArray(response.data)) {
        return response.data.map(this.normalizeList);
      } else if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data.map(this.normalizeList);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async createList(name: string, category: string): Promise<FavoriteList> {
    try {
      const userId = await this.getUserId();
      const response = await apiClient.post(
        endpoints.favorite.lists.create(userId),
        null,
        { params: { listName: name, category } }
      );
      
      if (!response.data) throw new Error('Failed to create list');
      return this.normalizeList(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async deleteList(listId: number): Promise<void> {
    try {
      await apiClient.delete(endpoints.favorite.lists.delete(listId));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async addMockupsToList(listId: number, mockupIds: number[]): Promise<void> {
    try {
      await apiClient.post(endpoints.favorite.lists.mockups.add(listId), mockupIds);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async removeMockupFromList(listId: number, mockupId: number): Promise<void> {
    try {
      await apiClient.delete(endpoints.favorite.lists.mockups.remove(listId, mockupId));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getMockups(): Promise<Mockup[]> {
    try {
      const response = await apiClient.get(endpoints.mockup.list);
      
      if (!response.data.success) throw new Error('Failed to fetch mockups');
      
      return response.data.data.map((mockup: any) => ({
        id: mockup.id,
        name: mockup.name,
        backgroundImagePreviewPath: mockup.backgroundImagePreviewPath,
        category: mockup.category,
        genderCategory: mockup.genderCategory,
        sizeCategory: mockup.sizeCategory
      }));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  private normalizeList(list: any): FavoriteList {
    return {
      ...list,
      category: list.category || list.Category,
      mockups: Array.isArray(list.mockups) ? list.mockups : []
    };
  }
}

export const favoriteService = new FavoriteService(); 