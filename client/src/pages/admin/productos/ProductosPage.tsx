import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import * as api from '../../../services/api';

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  featured: boolean;
  image_url?: string;
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts({ limit: 100 });
      setProducts(response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return;

    try {
      await api.deleteProduct(product.id);
      toast.success('Producto eliminado');
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Productos</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona el catálogo de productos
          </p>
        </div>
        <Link
          to="/admin/productos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Producto</span>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay productos creados</p>
          <Link
            to="/admin/productos/nuevo"
            className="mt-4 text-neutral-900 hover:underline inline-block"
          >
            Crear el primer producto
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700 w-20">
                  Imagen
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Categoría
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Destacado
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50">
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
                    <p className="text-xs text-neutral-500">{product.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {product.category}
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
      )}
    </div>
  );
}
