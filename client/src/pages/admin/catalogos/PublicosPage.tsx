import CatalogCrudPage from './CatalogCrudPage';
import * as api from '../../../services/api';
import type { Audience } from '../../../types/api';

export default function PublicosPage() {
  return (
    <CatalogCrudPage<Audience & { id: number }>
      title="Públicos"
      subtitle="Para quién está pensada cada pieza (mujer, hombre, niño, unisex...)"
      singular="público"
      resource="audiences"
      api={{ create: api.createAudience, update: api.updateAudience, remove: api.deleteAudience }}
      columns={[
        { key: 'name', label: 'Nombre', className: 'font-medium text-neutral-900' },
        { key: 'slug', label: 'Slug' },
        { key: 'display_order', label: 'Orden' },
      ]}
      fields={[
        { key: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Unisex adulto' },
        { key: 'slug', label: 'Slug', type: 'slug', required: true, autoFromName: true, placeholder: 'unisex-adulto' },
        { key: 'display_order', label: 'Orden', type: 'number', min: 0, helperText: 'Posición en la lista de filtros' },
      ]}
    />
  );
}
