// =============================================
// TIPOS DE LA API - FRONTEND
// =============================================

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export type Material = {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export type Tag = {
  id: number;
  name: string;
  slug: string;
}

export type Collection = {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CollectionWithCategory = Collection & {
  category_name: string;
  category_slug: string;
}

export type CreateCollectionDTO = {
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order?: number;
  is_active?: boolean;
}

export type UpdateCollectionDTO = Partial<CreateCollectionDTO>;

export type ReorderCollectionItem = {
  id: number;
  display_order: number;
}

export type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text?: string;
}

// Producto en listado (vista simplificada)
export type ProductListItem = {
  id: number;
  slug: string;
  name: string;
  category: string;
  category_slug: string;
  description?: string;
  featured: boolean;
  stock: number;
  is_out_of_stock: boolean;
  image_url?: string;
  materials: Array<{ name: string; slug: string }>;
  tags: Array<{ name: string; slug: string }>;
}

// Producto completo (vista detalle)
export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  featured: boolean;
  stock: number;
  low_stock_threshold: number;
  wa_template?: string;
  is_active: boolean;
  category: Category;
  images: ProductImage[];
  materials: Material[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

// Filtros de productos
export type ProductFilters = {
  categoria?: string | string[];
  material?: string | string[];
  tag?: string | string[];
  q?: string;
  featured?: boolean;
  sort?: 'relevancia' | 'nombre-asc' | 'nombre-desc' | 'recent';
  page?: number;
  limit?: number;
}

// Paginación
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Respuesta de API con paginación
export type PaginatedResponse<T> = {
  ok: boolean;
  data: T[];
  pagination: Pagination;
}

// Respuesta de API simple
export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}
