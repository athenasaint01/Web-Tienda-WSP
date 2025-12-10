import { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import type { ProductListItem, ProductFilters } from '../types/api';

// Tipo inline para evitar problemas de importación
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseProductsResult {
  products: ProductListItem[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para obtener productos con filtros
 */
export const useProducts = (filters: ProductFilters = {}): UseProductsResult => {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Crear una clave única para los filtros para usar en el useEffect
  const filtersKey = JSON.stringify(filters);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getProducts(filters);

      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return {
    products,
    pagination,
    loading,
    error,
    refetch: fetchProducts,
  };
};
