import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { CollectionWithCategory } from '../../../types/api';
import CollectionModal from './CollectionModal';

export default function ColeccionesPage() {
  const [collections, setCollections] = useState<CollectionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionWithCategory | null>(null);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await api.getAllCollections();
      setCollections(data);
    } catch (error) {
      toast.error('Error al cargar colecciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCreate = () => {
    setEditingCollection(null);
    setModalOpen(true);
  };

  const handleEdit = (collection: CollectionWithCategory) => {
    setEditingCollection(collection);
    setModalOpen(true);
  };

  const handleToggleActive = async (collection: CollectionWithCategory) => {
    try {
      await api.updateCollection(collection.id, {
        is_active: !collection.is_active,
      });
      toast.success(collection.is_active ? 'Colección desactivada' : 'Colección activada');
      loadCollections();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (collection: CollectionWithCategory) => {
    if (!confirm(`¿Eliminar la colección "${collection.title}"?`)) return;

    try {
      await api.deleteCollection(collection.id);
      toast.success('Colección eliminada');
      loadCollections();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleModalClose = (success?: boolean) => {
    setModalOpen(false);
    setEditingCollection(null);
    if (success) {
      loadCollections();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Colecciones</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona las colecciones que aparecen en el Home
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Colección</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay colecciones creadas</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-neutral-900 hover:underline"
          >
            Crear la primera colección
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Imagen
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Título
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Categoría
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Orden
                </th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-neutral-700">
                  Estado
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <img
                      src={collection.image_url}
                      alt={collection.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {collection.title}
                    </div>
                    {collection.description && (
                      <div className="text-sm text-neutral-600 mt-1 max-w-xs truncate">
                        {collection.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {collection.category_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {collection.display_order}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(collection)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        collection.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      title={collection.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {collection.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Activa
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Inactiva
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(collection)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(collection)}
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

      {/* Modal */}
      {modalOpen && (
        <CollectionModal
          collection={editingCollection}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
