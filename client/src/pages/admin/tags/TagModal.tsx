import { useForm, useWatch } from 'react-hook-form';
import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import FormInput from '../../../components/admin/ui/FormInput';

const toSlug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const tagSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  slug: z.string().min(1, 'El slug es requerido').max(50).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
});

type TagFormData = z.infer<typeof tagSchema>;

type TagModalProps = {
  tag: { id: number; name: string; slug: string } | null;
  onClose: (success?: boolean) => void;
};

export default function TagModal({ tag, onClose }: TagModalProps) {
  const isEditing = !!tag;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: tag || {},
  });

  // Auto-generar slug desde nombre solo al crear (no al editar)
  const nameValue = useWatch({ control, name: 'name' });
  const slugTouched = useRef(false);

  useEffect(() => {
    if (isEditing) return;
    if (slugTouched.current) return;
    setValue('slug', toSlug(nameValue || ''), { shouldValidate: false });
  }, [nameValue, isEditing, setValue]);

  const onSubmit = async (data: TagFormData) => {
    try {
      if (isEditing) {
        await api.updateTag(tag.id, data);
        toast.success('Tag actualizado');
      } else {
        await api.createTag(data);
        toast.success('Tag creado');
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
            {isEditing ? 'Editar Tag' : 'Nuevo Tag'}
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
          <FormInput
            label="Nombre"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ej: Minimal"
            required
          />

          <FormInput
            label="Slug"
            {...register('slug', {
              onChange: (e) => {
                slugTouched.current = true;
                const normalized = toSlug(e.target.value);
                setValue('slug', normalized, { shouldValidate: true });
              },
            })}
            error={errors.slug?.message}
            helperText="Solo minúsculas, números y guiones. Ej: minimal"
            placeholder="minimal"
            required
          />

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
