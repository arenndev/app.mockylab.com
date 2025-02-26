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

export const generateService = {
  async getMockups(): Promise<Mockup[]> {
    try {
      const response = await apiClient.get(endpoints.mockup.list);
      if (!response.data.success) {
        throw new Error('Failed to fetch mockups');
      }
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async generateMockups(formData: FormData): Promise<Blob> {
    try {
      // FormData içeriğini kontrol et
      console.log('FormData contents before sending:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await apiClient.post(endpoints.mockup.generate, formData, {
        responseType: 'blob',
        timeout: 300000,
        headers: {
          'Accept': '*/*',
          // Content-Type header'ını FormData için kaldırıyoruz
          // Browser otomatik olarak boundary ile birlikte ekleyecek
        },
        // CORS için credentials ekle
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log('Upload Progress:', percentCompleted);
        }
      });

      // Response kontrolü
      if (!response.data) {
        throw new Error('No data received from server');
      }

      return response.data;
    } catch (error) {
      console.error('Generate error details:', error);
      
      if (axios.isAxiosError(error)) {
        // Response detaylarını logla
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