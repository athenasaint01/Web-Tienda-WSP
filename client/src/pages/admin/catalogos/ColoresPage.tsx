import CatalogCrudPage from './CatalogCrudPage';
import * as api from '../../../services/api';
import type { Color } from '../../../types/api';

export default function ColoresPage() {
  return (
    <CatalogCrudPage<Color & { id: number }>
      title="Colores"
      subtitle="Colores disponibles. El hex se usa para el círculo de color en el catálogo."
      singular="color"
      resource="colors"
      api={{ create: api.createColor, update: api.updateColor, remove: api.deleteColor }}
      columns={[
        {
          key: 'name',
          label: 'Color',
          className: 'font-medium text-neutral-900',
          render: (row) => (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded-full border border-black/20 shrink-0"
                style={
                  row.hex
                    ? { background: row.hex }
                    : { background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)' }
                }
              />
              {row.name}
            </span>
          ),
        },
        { key: 'slug', label: 'Slug' },
        { key: 'hex', label: 'Hex', render: (row) => row.hex ?? '— (multicolor)' },
        { key: 'display_order', label: 'Orden' },
      ]}
      fields={[
        { key: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Dorado' },
        { key: 'slug', label: 'Slug', type: 'slug', required: true, autoFromName: true, placeholder: 'dorado' },
        { key: 'hex', label: 'Color (hex)', type: 'color', helperText: 'Déjalo vacío para multicolor / bicolor' },
        { key: 'display_order', label: 'Orden', type: 'number', min: 0 },
      ]}
    />
  );
}
