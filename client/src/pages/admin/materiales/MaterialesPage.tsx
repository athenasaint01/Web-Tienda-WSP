import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import MaterialModal from './MaterialModal';

type Material = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export default function MaterialesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/materials`);
      const data = await response.json();
      if (data.ok) {
        setMaterials(data.data);
      }
    } catch (error) {
      toast.error('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleCreate = () => {
    setEditingMaterial(null);
    setModalOpen(true);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setModalOpen(true);
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`¿Eliminar el material "${material.name}"?`)) return;

    try {
      await api.deleteMaterial(material.id);
      toast.success('Material eliminado');
      loadMaterials();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleModalClose = (success?: boolean) => {
    setModalOpen(false);
    setEditingMaterial(null);
    if (success) {
      loadMaterials();
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Materiales</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona los materiales de los productos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Material</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay materiales creados</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-neutral-900 hover:underline"
          >
            Crear el primer material
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
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Descripción
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {material.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {material.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {material.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(material)}
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
        <MaterialModal
          material={editingMaterial}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
