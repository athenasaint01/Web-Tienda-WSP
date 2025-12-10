// =============================================
// TIPOS DE DATOS - MODELOS DE BASE DE DATOS
// =============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Material {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

export interface Collection {
  id: number;
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  external_id?: string;
  slug: string;
  name: string;
  category_id: number;
  description?: string;
  featured: boolean;
  stock: number;
  low_stock_threshold: number;
  wa_template?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductMaterial {
  id: number;
  product_id: number;
  material_id: number;
  created_at: Date;
}

export interface ProductTag {
  id: number;
  product_id: number;
  tag_id: number;
  created_at: Date;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// =============================================
// TIPOS EXTENDIDOS PARA RESPUESTAS DE API
// =============================================

export interface ProductWithDetails extends Product {
  category: Category;
  images: ProductImage[];
  materials: Material[];
  tags: Tag[];
}

export interface ProductListItem {
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
  materials: string[];
  tags: string[];
}

// =============================================
// TIPOS PARA REQUESTS (DTO - Data Transfer Objects)
// =============================================

export interface CreateProductDTO {
  slug: string;
  name: string;
  category_id: number;
  description?: string;
  featured?: boolean;
  stock?: number;
  low_stock_threshold?: number;
  wa_template?: string;
  images: {
    url: string;
    is_primary?: boolean;
    alt_text?: string;
  }[];
  material_ids?: number[];
  tag_ids?: number[];
}

export interface UpdateProductDTO {
  slug?: string;
  name?: string;
  category_id?: number;
  description?: string;
  featured?: boolean;
  stock?: number;
  low_stock_threshold?: number;
  wa_template?: string;
  is_active?: boolean;
}

export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface CreateMaterialDTO {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateTagDTO {
  name: string;
  slug: string;
}

export interface CreateCollectionDTO {
  category_id: number;
  title: string;
  description?: string;
  image_url: string;
  display_order?: number;
  is_active?: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterUserDTO {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

// =============================================
// TIPOS PARA RESPUESTAS DE AUTENTICACIÓN
// =============================================

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
  token: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// =============================================
// TIPOS PARA FILTROS Y PAGINACIÓN
// =============================================

export interface ProductFilters {
  category?: string | string[];
  material?: string | string[];
  tag?: string | string[];
  q?: string; // búsqueda
  featured?: boolean;
  is_active?: boolean;
  sort?: 'relevancia' | 'nombre-asc' | 'nombre-desc' | 'recent';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
