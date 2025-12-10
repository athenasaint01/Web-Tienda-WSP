import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import FormInput from '../../../components/admin/ui/FormInput';
import FormTextarea from '../../../components/admin/ui/FormTextarea';

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  slug: z.string().min(1, 'El slug es requerido').max(100).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  description: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

type MaterialModalProps = {
  material: { id: number; name: string; slug: string; description?: string } | null;
  onClose: (success?: boolean) => void;
};

export default function MaterialModal({ material, onClose }: MaterialModalProps) {
  const isEditing = !!material;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: material || {},
  });

  const onSubmit = async (data: MaterialFormData) => {
    try {
      if (isEditing) {
        await api.updateMaterial(material.id, data);
        toast.success('Material actualizado');
      } else {
        await api.createMaterial(data);
        toast.success('Material creado');
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
            {isEditing ? 'Editar Material' : 'Nuevo Material'}
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
            placeholder="Ej: Acero"
            required
          />

          <FormInput
            label="Slug"
            {...register('slug')}
            error={errors.slug?.message}
            helperText="Solo minúsculas, números y guiones. Ej: acero"
            placeholder="acero"
            required
          />

          <FormTextarea
            label="Descripción"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Descripción opcional del material"
            rows={3}
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
