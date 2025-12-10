// Tipos importados - Si hay problemas de HMR, estos tipos están definidos inline
import type {
  ProductListItem,
  ProductDetail,
  ProductFilters,
  CollectionWithCategory,
  CreateCollectionDTO,
  UpdateCollectionDTO,
  ReorderCollectionItem,
} from '../types/api';

// Tipos inline para evitar problemas de HMR de Vite
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PaginatedResponse<T> = {
  ok: boolean;
  data: T[];
  pagination: Pagination;
}

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Base URL de la API (Vite proxy en desarrollo)
const API_BASE_URL = '/api';

// =============================================
// HELPER: Construir query params
// =============================================
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// =============================================
// HELPER: Fetch wrapper con manejo de errores
// =============================================
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// =============================================
// PRODUCTOS
// =============================================

/**
 * Obtener lista de productos con filtros
 */
export const getProducts = async (
  filters: ProductFilters = {}
): Promise<PaginatedResponse<ProductListItem>> => {
  const queryString = buildQueryString(filters);
  return fetchAPI<PaginatedResponse<ProductListItem>>(`/products${queryString}`);
};

/**
 * Obtener producto por slug
 */
export const getProductBySlug = async (slug: string): Promise<ProductDetail> => {
  console.log('[API] getProductBySlug called with slug:', slug);
  const response = await fetchAPI<ApiResponse<ProductDetail>>(`/products/${slug}`);
  console.log('[API] getProductBySlug response:', response);

  if (!response.ok || !response.data) {
    console.error('[API] getProductBySlug error:', response.error);
    throw new Error(response.error || 'Producto no encontrado');
  }

  return response.data;
};

/**
 * Obtener producto por ID (admin)
 */
export const getProductById = async (id: number): Promise<ApiResponse<any>> => {
  return fetchAPI<ApiResponse<any>>(`/products/id/${id}`, {
    headers: getAuthHeaders(),
  });
};

/**
 * Obtener solo productos destacados
 */
export const getFeaturedProducts = async (): Promise<ProductListItem[]> => {
  const response = await getProducts({ featured: true, limit: 10 });
  return response.data;
};

// =============================================
// HEALTH CHECK
// =============================================

/**
 * Verificar estado de la API
 */
export const healthCheck = async (): Promise<{ ok: boolean; message: string }> => {
  return fetchAPI<{ ok: boolean; message: string }>('/health');
};

// =============================================
// CONTACTO
// =============================================

export interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  mensaje?: string;
  fecha?: string;
  origen?: string;
}

/**
 * Enviar formulario de contacto
 */
export const sendContactForm = async (data: ContactFormData): Promise<ApiResponse<void>> => {
  return fetchAPI<ApiResponse<void>>('/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =============================================
// CATEGORÍAS, MATERIALES Y TAGS
// =============================================
// Nota: Los filtros ahora se obtienen directamente desde la API
// usando el hook useFilters() en lugar de extraerlos de los productos

// =============================================
// ADMIN API - REQUIEREN AUTENTICACIÓN
// =============================================

/**
 * Helper para obtener el token JWT del localStorage
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// =============================================
// ADMIN - CATEGORÍAS
// =============================================

export type CategoryData = {
  name: string;
  slug: string;
  description?: string;
};

export const createCategory = async (data: CategoryData) => {
  return fetchAPI('/admin/categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (id: number, data: Partial<CategoryData>) => {
  return fetchAPI(`/admin/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (id: number) => {
  return fetchAPI(`/admin/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

// =============================================
// ADMIN - MATERIALES
// =============================================

export type MaterialData = {
  name: string;
  slug: string;
  description?: string;
};

export const createMaterial = async (data: MaterialData) => {
  return fetchAPI('/admin/materials', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateMaterial = async (id: number, data: Partial<MaterialData>) => {
  return fetchAPI(`/admin/materials/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteMaterial = async (id: number) => {
  return fetchAPI(`/admin/materials/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

// =============================================
// ADMIN - TAGS
// =============================================

export type TagData = {
  name: string;
  slug: string;
};

export const createTag = async (data: TagData) => {
  return fetchAPI('/admin/tags', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateTag = async (id: number, data: Partial<TagData>) => {
  return fetchAPI(`/admin/tags/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteTag = async (id: number) => {
  return fetchAPI(`/admin/tags/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

// =============================================
// ADMIN - PRODUCTOS
// =============================================

export type ProductData = {
  slug: string;
  name: string;
  category_id: number;
  description?: string;
  featured?: boolean;
  wa_template?: string;
  images?: Array<{
    url: string;
    is_primary?: boolean;
    alt_text?: string;
  }>;
  material_ids?: number[];
  tag_ids?: number[];
};

export const createProduct = async (data: ProductData) => {
  return fetchAPI('/admin/products', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateProduct = async (id: number, data: Partial<ProductData>) => {
  return fetchAPI(`/admin/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteProduct = async (id: number) => {
  return fetchAPI(`/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};

// =============================================
// COLECCIONES (PÚBLICAS)
// =============================================

/**
 * Obtener colecciones activas (para Home)
 */
export const getActiveCollections = async (): Promise<CollectionWithCategory[]> => {
  const response = await fetchAPI<ApiResponse<CollectionWithCategory[]>>('/collections');

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Error al obtener colecciones');
  }

  return response.data;
};

/**
 * Obtener colección por ID
 */
export const getCollectionById = async (id: number): Promise<CollectionWithCategory> => {
  const response = await fetchAPI<ApiResponse<CollectionWithCategory>>(`/collections/${id}`);

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Colección no encontrada');
  }

  return response.data;
};

// =============================================
// ADMIN - COLECCIONES
// =============================================

/**
 * Obtener todas las colecciones (admin)
 */
export const getAllCollections = async (): Promise<CollectionWithCategory[]> => {
  const response = await fetchAPI<ApiResponse<CollectionWithCategory[]>>('/admin/collections', {
    headers: getAuthHeaders(),
  });

  if (!response.ok || !response.data) {
    throw new Error(response.error || 'Error al obtener colecciones');
  }

  return response.data;
};

/**
 * Crear nueva colección
 */
export const createCollection = async (data: CreateCollectionDTO) => {
  return fetchAPI('/admin/collections', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

/**
 * Actualizar colección
 */
export const updateCollection = async (id: number, data: UpdateCollectionDTO) => {
  return fetchAPI(`/admin/collections/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

/**
 * Reordenar colecciones
 */
export const reorderCollections = async (items: ReorderCollectionItem[]) => {
  return fetchAPI('/admin/collections/reorder', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(items),
  });
};

/**
 * Eliminar colección
 */
export const deleteCollection = async (id: number) => {
  return fetchAPI(`/admin/collections/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};
