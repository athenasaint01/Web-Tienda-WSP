import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import TagModal from './TagModal';

type Tag = {
  id: number;
  name: string;
  slug: string;
};

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.ok) {
        setTags(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`¿Eliminar el tag "${tag.name}"?`)) return;

    try {
      await api.deleteTag(tag.id);
      toast.success('Tag eliminado');
      loadTags();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleModalClose = (success?: boolean) => {
    setModalOpen(false);
    setEditingTag(null);
    if (success) {
      loadTags();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tags</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona las etiquetas de los productos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Tag</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay tags creados</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-neutral-900 hover:underline"
          >
            Crear el primer tag
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Nombre
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Slug
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {tag.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {tag.slug}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
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
        <TagModal
          tag={editingTag}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
