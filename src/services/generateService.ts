import { apiClient, endpoints, handleApiError } from '@/utils/apiConfig';
import { authService } from './authService';
import axios from 'axios';

export enum DesignColor {
  Black = 0,
  White = 1,
  Color = 2
}

export const getDesignColorText = (value: number): string => {
  switch (value) {
    case DesignColor.Black:
      return "Black";
    case DesignColor.White:
      return "White";
    case DesignColor.Color:
      return "Color";
    default:
      return "Color";
  }
};

export interface DesignArea {
  id: number;
  name: string;
  width: number;
  height: number;
  angle: number;
  centerX: number;
  centerY: number;
}

export interface Mockup {
  id: number;
  name: string;
  category: string;
  genderCategory: string;
  designColor: DesignColor;
  tshirtCategory: string;
  sizeCategory: string;
  backgroundImagePath: string;
  backgroundImagePreviewPath: string;
  designAreas: DesignArea[];
  createdAt: string;
  updatedAt: string;
  userId: string | null;
}

export interface GenerateRequest {
  mockupIds: number[];
  designAreaIds: number[];
  designColors: DesignColor[];
  designFiles: File[];
}

interface RawDesignArea {
  id: string | number;
  width: string | number;
  height: string | number;
  angle: string | number;
  centerX: string | number;
  centerY: string | number;
  name: string;
}

const stringToDesignColor = (colorString: string): DesignColor => {
  switch (colorString.toLowerCase()) {
    case 'black':
      return DesignColor.Black;
    case 'white':
      return DesignColor.White;
    case 'color':
      return DesignColor.Color;
    default:
      return DesignColor.Color;
  }
};

export const generateService = {
  async getMockups(userId: string): Promise<Mockup[]> {
    try {
      const response = await apiClient.get(`/Mockup/user/${userId}`);
      if (!response.data.success) {
        throw new Error('Failed to fetch mockups');
      }

      // Veri yapısını doğrula ve dönüştür
      const mockups = response.data.data;
      if (!Array.isArray(mockups)) {
        throw new Error('Invalid mockup data structure');
      }

      return mockups.map(mockup => ({
        ...mockup,
        designColor: typeof mockup.designColor === 'string' 
          ? stringToDesignColor(mockup.designColor)
          : typeof mockup.designColor === 'number'
            ? mockup.designColor
            : DesignColor.Color,
        designAreas: Array.isArray(mockup.designAreas) 
          ? mockup.designAreas.map((area: RawDesignArea) => ({
              ...area,
              id: Number(area.id),
              width: Number(area.width),
              height: Number(area.height),
              angle: Number(area.angle),
              centerX: Number(area.centerX),
              centerY: Number(area.centerY)
            }))
          : []
      }));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async generateMockups(formData: FormData, onProgress?: (progress: number) => void): Promise<Blob> {
    try {
      // FormData içeriğini kontrol et
      console.log('FormData contents before sending:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Progress başlangıcını bildir
      onProgress?.(0);

      const response = await apiClient.post(endpoints.mockup.generate, formData, {
        responseType: 'blob',
        timeout: 300000,
        headers: {
          'Accept': '*/*',
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Upload progress'i %80'e kadar göster
            const uploadPercentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const adjustedProgress = Math.min(Math.round(uploadPercentage * 0.8), 80);
            console.log('Upload Progress (Raw):', uploadPercentage);
            console.log('Adjusted Progress:', adjustedProgress);
            
            if (onProgress) {
              window.requestAnimationFrame(() => {
                onProgress(adjustedProgress);
              });
            }
          }
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // Response progress'i %80-100 arası göster
            const downloadPercentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const adjustedProgress = Math.min(80 + Math.round(downloadPercentage * 0.2), 100);
            console.log('Download Progress (Raw):', downloadPercentage);
            console.log('Adjusted Progress:', adjustedProgress);
            
            if (onProgress) {
              window.requestAnimationFrame(() => {
                onProgress(adjustedProgress);
              });
            }
          }
        }
      });

      // Progress tamamlandı
      onProgress?.(100);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      return response.data;
    } catch (error) {
      // Hata durumunda progress'i sıfırla
      onProgress?.(0);
      
      console.error('Generate error details:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Error response:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data
        });

        if (error.response?.status === 502) {
          throw new Error('Server is temporarily unavailable. Please try again later.');
        }

        if (error.code === 'ERR_NETWORK') {
          throw new Error('Network error occurred. Please check your connection and try again.');
        }
      }
      throw error;
    }
  },

  validateDesignColor(mockupColor: DesignColor | undefined, designColor: DesignColor): boolean {
    if (mockupColor === undefined) return true;
    if (designColor === DesignColor.Color) return true;
    return mockupColor === designColor;
  },

  prepareFormData(request: GenerateRequest): FormData {
    const formData = new FormData();
    
    // Her bir dosya için ayrı bir key kullan
    request.mockupIds.forEach((id, index) => {
      formData.append('mockupIds', id.toString());
    });

    request.designAreaIds.forEach((id, index) => {
      formData.append('designAreaIds', id.toString());
    });

    request.designColors.forEach((color, index) => {
      formData.append('designColors', color.toString());
    });

    request.designFiles.forEach((file, index) => {
      formData.append('designFiles', file);
    });

    // Debug için FormData içeriğini kontrol et
    console.log('FormData contents:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    return formData;
  },

  downloadGeneratedFile(blob: Blob, filename: string = 'generated-mockups.zip'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}; 