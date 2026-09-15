import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { Banner } from '../../../types/api';
import BannerModal from './BannerModal';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await api.getAllBanners();
      setBanners(data);
    } catch (error) {
      toast.error('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleCreate = () => {
    setEditingBanner(null);
    setModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setModalOpen(true);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.updateBanner(banner.id, {
        is_active: !banner.is_active,
      });
      toast.success(banner.is_active ? 'Banner desactivado' : 'Banner activado');
      loadBanners();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`¿Eliminar este banner?`)) return;

    try {
      await api.deleteBanner(banner.id);
      toast.success('Banner eliminado');
      loadBanners();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleModalClose = (success?: boolean) => {
    setModalOpen(false);
    setEditingBanner(null);
    if (success) {
      loadBanners();
    }
  };

  const activeCount = banners.filter((b) => b.is_active).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Banner Principal</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona la imagen grande del Home.{' '}
            {activeCount >= 2
              ? `Hay ${activeCount} banners activos: rotan automáticamente como carrusel.`
              : 'Con 2 o más banners activos, rotan automáticamente como carrusel.'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Banner</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay banners creados</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-neutral-900 hover:underline"
          >
            Crear el primer banner
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
                  Alt / descripción
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                  Link
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
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900 max-w-xs truncate">
                      {banner.alt_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 max-w-[160px] truncate">
                    {banner.link_url || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {banner.display_order}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                      title={banner.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {banner.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner)}
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
        <BannerModal
          banner={editingBanner}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
