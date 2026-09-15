import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { Banner } from '../../../types/api';
import FormInput from '../../../components/admin/ui/FormInput';
import ImageUpload from '../../../components/admin/ui/ImageUpload';

const bannerSchema = z.object({
  alt_text: z.string().min(1, 'El texto alternativo es requerido').max(255),
  link_url: z.string().max(500).optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

type BannerModalProps = {
  banner: Banner | null;
  onClose: (success?: boolean) => void;
};

export default function BannerModal({ banner, onClose }: BannerModalProps) {
  const isEditing = !!banner;
  const [images, setImages] = useState<(File | string)[]>(banner?.image_url ? [banner.image_url] : []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: banner
      ? {
          alt_text: banner.alt_text,
          link_url: banner.link_url || '',
          display_order: banner.display_order,
          is_active: banner.is_active,
        }
      : {
          display_order: 0,
          is_active: true,
        },
  });

  const onSubmit = async (data: BannerFormData) => {
    if (!isEditing && images.length === 0) {
      toast.error('Debes subir una imagen');
      return;
    }

    try {
      if (isEditing) {
        const newImage = images[0] instanceof File ? images[0] : null;

        if (newImage) {
          const formData = new FormData();
          formData.append('alt_text', data.alt_text);
          formData.append('link_url', data.link_url ?? '');
          if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
          if (data.is_active !== undefined) formData.append('is_active', data.is_active ? 'true' : 'false');
          formData.append('image', newImage);

          const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`${API_BASE_URL}/admin/banners/${banner.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const result = await response.json();
          if (!result.ok) throw new Error(result.error || 'Error al actualizar banner');
        } else {
          await api.updateBanner(banner.id, data);
        }
        toast.success('Banner actualizado');
      } else {
        const formData = new FormData();
        formData.append('alt_text', data.alt_text);
        formData.append('link_url', data.link_url ?? '');
        if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
        if (data.is_active !== undefined) formData.append('is_active', data.is_active ? 'true' : 'false');

        const firstImage = images[0];
        if (firstImage && firstImage instanceof File) {
          formData.append('image', firstImage);
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/admin/banners`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Error al crear banner');
        }

        toast.success('Banner creado');
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">
            {isEditing ? 'Editar Banner' : 'Nuevo Banner'}
          </h2>
          <button
            onClick={() => onClose()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Imagen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Imagen <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Esta imagen ocupa el banner completo del Home
            </p>
            <ImageUpload images={images} onChange={setImages} maxImages={1} />
          </div>

          {/* Alt / descripción */}
          <FormInput
            label="Texto alternativo (alt)"
            {...register('alt_text')}
            error={errors.alt_text?.message}
            placeholder="Ej: Colección Navidad 2026 — aretes y collares de oro"
            helperText="Describe la imagen: ayuda al SEO/accesibilidad y te sirve para identificar este banner en la lista"
            required
          />

          {/* Link opcional */}
          <FormInput
            label="Link al hacer clic"
            {...register('link_url')}
            error={errors.link_url?.message}
            placeholder="Ej: /productos?categoria=outlet"
            helperText="Opcional. Si lo dejas vacío, el banner no será clickeable"
          />

          {/* Orden de visualización */}
          <FormInput
            label="Orden de visualización"
            type="number"
            {...register('display_order', { valueAsNumber: true })}
            error={errors.display_order?.message}
            placeholder="0"
            helperText="Número menor aparece primero. Con 2+ banners activos, rotan automáticamente como carrusel"
          />

          {/* Activo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
              Mostrar en Home
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
