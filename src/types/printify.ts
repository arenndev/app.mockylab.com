export interface PrintifySettings {
  printifyApiKey?: string;
  shopId?: string;
}

export interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
  printProviderId?: number;
}

export interface BlueprintListResponse {
  items: Blueprint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BlueprintVariant {
  id: number;
  blueprintId: number;
  printProviderId: number;
  variantId: number;
  title: string;
  options: Record<string, string>;
  isActive: boolean;
  placeholders: VariantPlaceholder[];
}

export interface VariantPlaceholder {
  id: number;
  variantId: number;
  position: string;
  width: number;
  height: number;
  isActive: boolean;
}

export interface VariantResponse {
  printProviderId: number;
  title: string;
  variants: BlueprintVariant[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  tags: string[];
  blueprintId: number;
  variants: {
    variantId: number;
    price: number;
    isEnabled: boolean;
  }[];
  printifyImageId: string;
  catalogImageIds?: string[];
  userId?: string;
}

export interface PrintifyApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
} 