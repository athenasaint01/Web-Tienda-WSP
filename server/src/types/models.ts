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
  code?: string;
  name: string;
  name_short?: string;
  name_en?: string;
  slug: string;
  description?: string;
  display_order?: number;
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

export interface Audience {
  id: number;
  code?: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Thickness {
  id: number;
  code?: string;
  name: string;
  slug: string;
  level: number;
  created_at: Date;
  updated_at: Date;
}

export interface Size {
  id: number;
  code?: string;
  label: string;
  ring_size?: number;
  diameter_mm?: number;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Length {
  id: number;
  code?: string;
  label: string;
  value_cm: number;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Color {
  id: number;
  code?: string;
  name: string;
  slug: string;
  hex?: string | null;
  display_order: number;
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

// =============================================
// PEDIDOS (carrito -> WhatsApp)
// =============================================

export type OrderStatus = 'pendiente' | 'confirmado' | 'descartado';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_slug: string | null;
  qty: number;
  unit_price: number | null;
  line_total: number | null;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string | null;
  status: OrderStatus;
  currency_symbol: string;
  subtotal: number;
  has_unpriced: boolean;
  confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderDTO {
  customer_name: string;
  customer_phone?: string | null;
  currency_symbol?: string;
  items: {
    product_id: number;
    qty: number;
  }[];
}

export interface Product {
  id: number;
  external_id?: string;
  sku?: string | null;
  slug: string;
  name: string;
  category_id: number;
  audience_id?: number | null;
  thickness_id?: number | null;
  description?: string;
  featured: boolean;
  price?: number | null;
  discount_percent?: number | null;
  sale_price?: number | null; // DERIVADO: price * (1 - discount_percent/100)
  stock: number;
  low_stock_threshold: number;
  wa_template?: string;
  is_active: boolean;
  badge_labels: string[];
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
  audience: Audience | null;
  thickness: Thickness | null;
  sizes: Size[];
  lengths: Length[];
  colors: Color[];
}

export interface ProductListItem {
  id: number;
  sku?: string | null;
  slug: string;
  name: string;
  category: string;
  category_slug: string;
  description?: string;
  featured: boolean;
  price?: number | null;
  discount_percent?: number | null;
  sale_price?: number | null; // DERIVADO: price * (1 - discount_percent/100)
  stock: number;
  is_out_of_stock: boolean;
  image_url?: string;
  image_url_2?: string;
  materials: string[];
  tags: string[];
  audience?: string | null;
  thickness?: string | null;
  colors: string[];
}

// =============================================
// TIPOS PARA REQUESTS (DTO - Data Transfer Objects)
// =============================================

export interface CreateProductDTO {
  slug: string;
  name: string;
  sku?: string;
  category_id: number;
  audience_id?: number | null;
  thickness_id?: number | null;
  description?: string;
  featured?: boolean;
  price?: number | null;
  discount_percent?: number | null;
  sale_price?: number | null; // DERIVADO: price * (1 - discount_percent/100)
  stock?: number;
  low_stock_threshold?: number;
  wa_template?: string;
  badge_labels?: string[];
  images: {
    url: string;
    is_primary?: boolean;
    alt_text?: string;
  }[];
  material_ids?: number[];
  tag_ids?: number[];
  size_ids?: number[];
  length_ids?: number[];
  color_ids?: number[];
}

export interface UpdateProductDTO {
  slug?: string;
  name?: string;
  sku?: string;
  category_id?: number;
  audience_id?: number | null;
  thickness_id?: number | null;
  description?: string;
  featured?: boolean;
  price?: number | null;
  discount_percent?: number | null;
  sale_price?: number | null; // DERIVADO: price * (1 - discount_percent/100)
  stock?: number;
  low_stock_threshold?: number;
  wa_template?: string;
  is_active?: boolean;
  badge_labels?: string[];
  material_ids?: number[];
  tag_ids?: number[];
  size_ids?: number[];
  length_ids?: number[];
  color_ids?: number[];
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
  audience?: string | string[];
  thickness?: string | string[];
  color?: string | string[];
  q?: string; // búsqueda
  featured?: boolean;
  is_active?: boolean;
  sort?: 'relevancia' | 'nombre-asc' | 'nombre-desc' | 'recent' | 'precio-asc' | 'precio-desc';
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
