import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { CollectionWithCategory, Category } from '../../../types/api';
import FormInput from '../../../components/admin/ui/FormInput';
import FormTextarea from '../../../components/admin/ui/FormTextarea';
import FormSelect from '../../../components/admin/ui/FormSelect';
import ImageUpload from '../../../components/admin/ui/ImageUpload';

const collectionSchema = z.object({
  category_id: z.number({ message: 'La categoría es requerida' }).int().positive(),
  title: z.string().min(1, 'El título es requerido').max(255),
  description: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

type CollectionModalProps = {
  collection: CollectionWithCategory | null;
  onClose: (success?: boolean) => void;
};

export default function CollectionModal({ collection, onClose }: CollectionModalProps) {
  const isEditing = !!collection;
  const [images, setImages] = useState<(File | string)[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: collection
      ? {
          category_id: collection.category_id,
          title: collection.title,
          description: collection.description || '',
          display_order: collection.display_order,
          is_active: collection.is_active,
        }
      : {
          display_order: 0,
          is_active: true,
        },
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        if (data.ok) {
          setCategories(data.data);
        }
      } catch (error) {
        toast.error('Error al cargar categorías');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();

    // Cargar imagen existente si estamos editando
    if (collection && collection.image_url) {
      setImages([collection.image_url]);
    }
  }, [collection]);

  const onSubmit = async (data: CollectionFormData) => {
    if (!isEditing && images.length === 0) {
      toast.error('Debes subir al menos una imagen');
      return;
    }

    try {
      if (isEditing) {
        // For editing, send JSON (image handled separately)
        await api.updateCollection(collection.id, data);
        toast.success('Colección actualizada');
      } else {
        // For creating, use FormData to send file
        const formData = new FormData();
        formData.append('category_id', data.category_id.toString());
        formData.append('title', data.title);

        if (data.description) formData.append('description', data.description);
        if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
        if (data.is_active !== undefined) formData.append('is_active', data.is_active ? 'true' : 'false');

        // Append image file (only if it's a new File, not a URL string)
        const firstImage = images[0];
        if (firstImage && firstImage instanceof File) {
          formData.append('image', firstImage);
        }

        // Send FormData
        const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/admin/collections`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Error al crear colección');
        }

        toast.success('Colección creada');
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
            {isEditing ? 'Editar Colección' : 'Nueva Colección'}
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
          {/* Categoría */}
          <div className="space-y-2">
            {loadingCategories ? (
              <div className="text-sm text-neutral-500">Cargando categorías...</div>
            ) : (
              <FormSelect
                label="Categoría"
                {...register('category_id', { valueAsNumber: true })}
                error={errors.category_id?.message}
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            )}
            <p className="text-xs text-neutral-500">
              Al hacer clic en esta colección, el usuario irá a la página de productos filtrados por esta categoría
            </p>
          </div>

          {/* Título */}
          <FormInput
            label="Título"
            {...register('title')}
            error={errors.title?.message}
            placeholder="Ej: Anillos y Aros"
            helperText="Puedes personalizar el título que aparece en la colección"
            required
          />

          {/* Descripción */}
          <FormTextarea
            label="Descripción"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Descripción breve de la colección"
            rows={3}
          />

          {/* Imagen */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Imagen <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-neutral-500 mb-2">
              Esta imagen se mostrará en la sección de Colecciones del Home
            </p>
            <ImageUpload images={images} onChange={setImages} maxImages={1} />
          </div>

          {/* Orden de visualización */}
          <FormInput
            label="Orden de visualización"
            type="number"
            {...register('display_order', { valueAsNumber: true })}
            error={errors.display_order?.message}
            placeholder="0"
            helperText="Número menor aparece primero (0, 1, 2, ...)"
          />

          {/* Activa */}
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
