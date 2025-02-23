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

export interface VariantImages {
  black: string;
  white: string;
  color?: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  blueprintId: number;
  variantImages: VariantImages;
  tags: string[];
  userId: number;
}

export interface PrintifyApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface UserOfVariant {
  id: number;
  userId: number;
  blueprintId: number;
  variantId: number;
  defaultPrice: number;
  isEnabled: boolean;
  isActive: boolean;
  designColor: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductImage {
  src: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
  visible: boolean;
}

export interface PaginatedResponse<T> {
  currentPage: number;
  data: T[];
  lastPage: number;
  total: number;
  perPage: number;
}

export interface UpdateVariantRequest {
  id: number;
  defaultPrice: number;
  isEnabled: boolean;
  isActive: boolean;
  designColor: number;
}

export interface CreateVariantRequest {
  userId: number;
  blueprintId: number;
  variantId: number;
  defaultPrice: number;
  isEnabled: boolean;
  designColor: number;
}

export const DesignColorEnum = {
  Black: 0,
  White: 1,
  Color: 2
} as const;

export type DesignColorEnum = typeof DesignColorEnum[keyof typeof DesignColorEnum];

// Bulk operations için yeni interface'ler
export interface BulkOperationUpdateRequest {
  id: number;
  defaultPrice: number;
  isEnabled: boolean;
  isActive: boolean;
  isSelected: boolean;
  designColor: number;
}

export interface BulkOperationCreateRequest {
  userId: number;
  blueprintId: number;
  variantId: number;
  defaultPrice: number;
  isEnabled: boolean;
  isSelected: boolean;
  designColor: number;
}

export interface BulkOperationsRequest {
  updateRequests?: BulkOperationUpdateRequest[];
  createRequests?: BulkOperationCreateRequest[];
} 