import CatalogCrudPage from './CatalogCrudPage';
import * as api from '../../../services/api';
import type { Thickness } from '../../../types/api';

export default function GrosoresPage() {
  return (
    <CatalogCrudPage<Thickness & { id: number }>
      title="Grosores"
      subtitle="Escala de grosor de la pieza, de muy delgado (1) a muy grueso (5)"
      singular="grosor"
      resource="thicknesses"
      api={{ create: api.createThickness, update: api.updateThickness, remove: api.deleteThickness }}
      columns={[
        { key: 'level', label: 'Nivel', className: 'font-medium text-neutral-900' },
        { key: 'name', label: 'Nombre' },
        { key: 'slug', label: 'Slug' },
      ]}
      fields={[
        { key: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Medio' },
        { key: 'slug', label: 'Slug', type: 'slug', required: true, autoFromName: true, placeholder: 'medio' },
        { key: 'level', label: 'Nivel', type: 'number', required: true, min: 1, helperText: '1 = muy delgado ... 5 = muy grueso (define el orden)' },
      ]}
    />
  );
}
