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

// Base URL de la API
// En desarrollo usa proxy de Vite (/api → http://localhost:3000)
// En producción usa la URL del backend de Railway
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Sesión expirada');
    }

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
// CATÁLOGOS DE ATRIBUTOS (PÚBLICOS)
// =============================================

/** Helper genérico para GET /api/<recurso> que responde { ok, data } */
async function getCatalog<T>(resource: string): Promise<T[]> {
  const res = await fetchAPI<ApiResponse<T[]>>(`/${resource}`);
  return res.ok && res.data ? res.data : [];
}

export const getAudiences = () => getCatalog<import('../types/api').Audience>('audiences');
export const getThicknesses = () => getCatalog<import('../types/api').Thickness>('thicknesses');
export const getSizes = () => getCatalog<import('../types/api').Size>('sizes');
export const getLengths = () => getCatalog<import('../types/api').Length>('lengths');
export const getColors = () => getCatalog<import('../types/api').Color>('colors');
export const getMaterials = () => getCatalog<import('../types/api').Material>('materials');

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
  name_short?: string;
  name_en?: string;
  slug: string;
  description?: string;
  display_order?: number;
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
// ADMIN - CATÁLOGOS DE ATRIBUTOS (audiences / thicknesses / sizes / lengths / colors)
// =============================================

export type AudienceData = { name: string; slug: string; display_order?: number };
export type ThicknessData = { name: string; slug: string; level: number };
export type SizeData = { label: string; ring_size?: number; diameter_mm?: number; display_order?: number };
export type LengthData = { label: string; value_cm: number; display_order?: number };
export type ColorData = { name: string; slug: string; hex?: string | null; display_order?: number };

/** Fábrica de CRUD admin para un recurso simple { ok, data } */
function makeAdminCrud<T>(resource: string) {
  return {
    create: (data: T) =>
      fetchAPI(`/admin/${resource}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<T>) =>
      fetchAPI(`/admin/${resource}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      fetchAPI(`/admin/${resource}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }),
  };
}

const audiencesCrud = makeAdminCrud<AudienceData>('audiences');
export const createAudience = audiencesCrud.create;
export const updateAudience = audiencesCrud.update;
export const deleteAudience = audiencesCrud.remove;

const thicknessesCrud = makeAdminCrud<ThicknessData>('thicknesses');
export const createThickness = thicknessesCrud.create;
export const updateThickness = thicknessesCrud.update;
export const deleteThickness = thicknessesCrud.remove;

const sizesCrud = makeAdminCrud<SizeData>('sizes');
export const createSize = sizesCrud.create;
export const updateSize = sizesCrud.update;
export const deleteSize = sizesCrud.remove;

const lengthsCrud = makeAdminCrud<LengthData>('lengths');
export const createLength = lengthsCrud.create;
export const updateLength = lengthsCrud.update;
export const deleteLength = lengthsCrud.remove;

const colorsCrud = makeAdminCrud<ColorData>('colors');
export const createColor = colorsCrud.create;
export const updateColor = colorsCrud.update;
export const deleteColor = colorsCrud.remove;

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
  audience_id?: number | null;
  thickness_id?: number | null;
  description?: string;
  featured?: boolean;
  price?: number | null;
  discount_percent?: number | null; // % de descuento (0-95); el sale_price se calcula en el backend
  wa_template?: string;
  images?: Array<{
    url: string;
    is_primary?: boolean;
    alt_text?: string;
  }>;
  material_ids?: number[];
  tag_ids?: number[];
  size_ids?: number[];
  length_ids?: number[];
  color_ids?: number[];
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

// =============================================
// PEDIDOS (carrito -> WhatsApp)
// =============================================

export type CreateOrderPayload = {
  customer_name: string;
  customer_phone?: string | null;
  currency_symbol?: string;
  items: { product_id: number; qty: number }[];
};

/** Público: registra un pedido en estado 'pendiente'. */
export const createOrder = async (payload: CreateOrderPayload) => {
  return fetchAPI<ApiResponse<{ id: number }>>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  product_slug: string | null;
  qty: number;
  unit_price: number | null;
  line_total: number | null;
};

export type Order = {
  id: number;
  customer_name: string;
  customer_phone: string | null;
  status: 'pendiente' | 'confirmado' | 'descartado';
  currency_symbol: string;
  subtotal: number;
  has_unpriced: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

/** Admin: lista de pedidos (paginada). */
export const getOrders = async (params: { status?: string; page?: number; limit?: number } = {}) => {
  const qs = buildQueryString(params);
  return fetchAPI<PaginatedResponse<Order>>(`/admin/orders${qs}`, {
    headers: getAuthHeaders(),
  });
};

/** Admin: confirma un pedido -> descuenta stock. Devuelve warnings de stock. */
export const confirmOrder = async (id: number) => {
  return fetchAPI<ApiResponse<Order> & { warnings?: string[] }>(`/admin/orders/${id}/confirm`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
};

/** Admin: descarta un pedido (no toca stock). */
export const discardOrder = async (id: number) => {
  return fetchAPI<ApiResponse<Order>>(`/admin/orders/${id}/discard`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
};

/** Admin: nº de pedidos pendientes (para el dashboard). */
export const getPendingOrdersCount = async () => {
  return fetchAPI<ApiResponse<{ count: number }>>('/admin/orders/pending-count', {
    headers: getAuthHeaders(),
  });
};
