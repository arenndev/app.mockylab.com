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
      const response = await apiClient.post(endpoints.mockup.generate, formData, {
        responseType: 'blob',
        timeout: 300000,
        headers: {
          'Accept': '*/*',
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log('Upload Progress:', percentCompleted);
        }
      });

      // Response türünü kontrol et
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('application/zip')) {
        if (contentType.includes('application/json')) {
          const reader = new FileReader();
          reader.readAsText(response.data);
          const text = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
          });
          const error = JSON.parse(text as string);
          throw new Error(error.message || 'Server error');
        }
        throw new Error('Unexpected response type: ' + contentType);
      }

      return response.data;
    } catch (error) {
      console.error('Generate error details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.data instanceof Blob) {
          const reader = new FileReader();
          reader.readAsText(error.response.data);
          const text = await new Promise(resolve => {
            reader.onload = () => resolve(reader.result);
          });
          console.error('Error response body:', text);
          throw new Error(text as string);
        }
        
        if (error.code === 'ECONNABORTED') {
          throw new Error('Generation is taking longer than expected. Please try with fewer mockups or smaller images.');
        }
        
        if (error.response?.status === 400) {
          throw new Error('Invalid request. Please check your design files and try again.');
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
    
    // Debug için request içeriğini kontrol edelim
    console.log('Preparing FormData with request:', {
      mockupIds: request.mockupIds,
      designAreaIds: request.designAreaIds,
      designColors: request.designColors,
      designFiles: request.designFiles.map(f => f.name)
    });

    // mockupIds - array notation'ı kaldırıyoruz
    request.mockupIds.forEach(id => {
      formData.append('mockupIds', id.toString());
    });

    // designAreaIds - array notation'ı kaldırıyoruz
    request.designAreaIds.forEach(id => {
      formData.append('designAreaIds', id.toString());
    });

    // designColors - array notation'ı kaldırıyoruz
    request.designColors.forEach(color => {
      formData.append('designColors', color.toString());
    });

    // designFiles - array notation'ı kaldırıyoruz
    request.designFiles.forEach(file => {
      formData.append('designFiles', file);
    });

    // Debug için oluşturulan FormData'yı kontrol edelim
    console.log('FormData entries:');
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