import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { ProductFilters } from '../../../types/api';
import { useCurrency, formatPrice, getOffer } from '../../../hooks/useSettings';

type Product = {
  id: number;
  name: string;
  sku?: string | null;
  slug: string;
  category: string;
  featured: boolean;
  price?: number | null;
  discount_percent?: number | null;
  sale_price?: number | null;
  stock?: number;
  image_url?: string;
  has_variants?: boolean;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type SortKey = NonNullable<ProductFilters['sort']>;
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevancia', label: 'Orden de catálogo' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'nombre-asc', label: 'Nombre (A–Z)' },
  { value: 'nombre-desc', label: 'Nombre (Z–A)' },
  { value: 'precio-asc', label: 'Precio (menor a mayor)' },
  { value: 'precio-desc', label: 'Precio (mayor a menor)' },
];

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const currency = useCurrency();

  // Filtros
  const [categories, setCategories] = useState<api.CategoryLite[]>([]);
  const [categoria, setCategoria] = useState('');           // slug ('' = todas)
  const [sort, setSort] = useState<SortKey>('relevancia');
  const [searchInput, setSearchInput] = useState('');       // lo que se teclea
  const [q, setQ] = useState('');                           // valor con debounce que se envía

  // Debounce del buscador
  const debRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(() => setQ(searchInput.trim()), 300);
    return () => window.clearTimeout(debRef.current);
  }, [searchInput]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Volver a la página 1 cuando cambia un filtro
  useEffect(() => {
    setPage(1);
  }, [categoria, sort, q, limit]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getProducts({
        page,
        limit,
        sort,
        categoria: categoria || undefined,
        q: q || undefined,
      });
      setProducts(response.data as Product[]);
      setPagination(response.pagination);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, categoria, q]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const hasFilters = categoria !== '' || q !== '' || sort !== 'relevancia';
  const clearFilters = () => {
    setCategoria('');
    setSort('relevancia');
    setSearchInput('');
    setQ('');
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return;

    try {
      await api.deleteProduct(product.id);
      toast.success('Producto eliminado');
      // Si borramos el último de la página, retroceder una página
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const totalPages = pagination?.totalPages ?? 1;
  // Número global de la fila (1-based) considerando la página actual
  const rowNumber = (index: number) => (page - 1) * limit + index + 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Productos</h1>
          <p className="text-neutral-600 mt-1">Gestiona el catálogo de productos</p>
        </div>
        <Link
          to="/admin/productos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </Link>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          Categoría
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border border-neutral-300 rounded-lg px-2 py-2 bg-white text-sm focus:outline-none focus:border-neutral-900"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-neutral-600">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-neutral-300 rounded-lg px-2 py-2 bg-white text-sm focus:outline-none focus:border-neutral-900"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Barra: total + selector de tamaño de página */}
      {!loading && pagination && pagination.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-sm text-neutral-500">
          <span>
            {pagination.total} producto{pagination.total !== 1 ? 's' : ''}
            {totalPages > 1 && ` · página ${page} de ${totalPages}`}
          </span>
          <label className="flex items-center gap-2">
            Mostrar
            <select
              value={limit}
              onChange={(e) => changeLimit(Number(e.target.value))}
              className="border border-neutral-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-neutral-900"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            por página
          </label>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto" />
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          {hasFilters ? (
            <>
              <p className="text-neutral-600">Ningún producto coincide con los filtros</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-neutral-900 hover:underline inline-block"
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-neutral-600">No hay productos creados</p>
              <Link
                to="/admin/productos/nuevo"
                className="mt-4 text-neutral-900 hover:underline inline-block"
              >
                Crear el primer producto
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700 w-12">#</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700 w-20">Imagen</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">Categoría</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">Precio</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">Stock</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">Destacado</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-4 text-sm text-neutral-400 tabular-nums">
                      {rowNumber(index)}
                    </td>
                    <td className="px-6 py-4">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
                          <span className="text-neutral-400 text-xs">Sin img</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-neutral-900">{product.name}</p>
                      <p className="text-xs text-neutral-500">{product.sku ?? '—'} · {product.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {product.has_variants ? (
                        <span className="text-xs text-neutral-500 italic">Con variantes</span>
                      ) : (() => {
                        const offer = getOffer(product.price, product.sale_price);
                        if (offer) {
                          return (
                            <span className="flex items-baseline gap-1.5">
                              <span className="font-medium text-[#c4927a]">
                                {formatPrice(offer.salePrice, currency)}
                              </span>
                              <span className="text-xs text-neutral-400 line-through">
                                {formatPrice(offer.price, currency)}
                              </span>
                              <span className="text-[10px] font-semibold text-[#a06f57]">
                                -{offer.percent}%
                              </span>
                            </span>
                          );
                        }
                        return product.price != null ? (
                          formatPrice(product.price, currency)
                        ) : (
                          <span className="text-neutral-400">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {product.has_variants ? (
                        <span className="text-xs text-neutral-400">Por variante</span>
                      ) : product.stock == null ? (
                        <span className="text-neutral-400">—</span>
                      ) : product.stock <= 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Agotado
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="text-amber-600 font-medium tabular-nums">{product.stock}</span>
                      ) : (
                        <span className="text-neutral-700 tabular-nums">{product.stock}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.featured ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Destacado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/producto/${product.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Ver en tienda"
                        >
                          <Eye className="w-4 h-4 text-neutral-600" />
                        </Link>
                        <Link
                          to={`/admin/productos/${product.id}/editar`}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4 text-neutral-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                  const isCurrent = n === page;
                  const isNear = Math.abs(n - page) <= 1;
                  const isEdge = n === 1 || n === totalPages;
                  if (!isCurrent && !isNear && !isEdge) {
                    if (n === page - 2 || n === page + 2) {
                      return (
                        <span key={n} className="px-1.5 text-neutral-400">
                          …
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
