import { apiClient, endpoints, handleApiError } from '@/utils/apiConfig';
import { authService } from './authService';

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

class GenerateService {
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
  }

  async generateMockups(data: FormData): Promise<Blob> {
    try {
      const response = await apiClient.post(endpoints.mockup.generate, data, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  validateDesignColor(mockupColor: DesignColor | undefined, designColor: DesignColor): boolean {
    if (mockupColor === undefined) return true;
    if (designColor === DesignColor.Color) return true;
    return mockupColor === designColor;
  }

  prepareFormData(request: GenerateRequest): FormData {
    const formData = new FormData();
    
    request.mockupIds.forEach(id => {
      formData.append('mockupIds', id.toString());
    });

    request.designAreaIds.forEach(id => {
      formData.append('designAreaIds', id.toString());
    });

    request.designColors.forEach(color => {
      formData.append('designColors', color.toString());
    });

    request.designFiles.forEach(file => {
      formData.append('designFiles', file);
    });

    return formData;
  }

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
}

export const generateService = new GenerateService(); 