import { useState, useEffect } from 'react';
import { getProductBySlug } from '../services/api';

// Tipos inline para evitar problemas de importación
type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

type Material = {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

type Tag = {
  id: number;
  name: string;
  slug: string;
}

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  alt_text?: string;
}

type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  featured: boolean;
  wa_template?: string;
  is_active: boolean;
  category: Category;
  images: ProductImage[];
  materials: Material[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

interface UseProductResult {
  product: ProductDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener un producto por slug
 */
export const useProduct = (slug: string): UseProductResult => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[useProduct] Fetching product with slug:', slug);
      const data = await getProductBySlug(slug);
      console.log('[useProduct] Product data received:', data);
      setProduct(data);
    } catch (err) {
      console.error('[useProduct] Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar producto');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
};
