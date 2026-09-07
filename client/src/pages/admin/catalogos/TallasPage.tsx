import CatalogCrudPage from './CatalogCrudPage';
import * as api from '../../../services/api';
import type { Size } from '../../../types/api';

export default function TallasPage() {
  return (
    <CatalogCrudPage<Size & { id: number }>
      title="Tallas"
      subtitle="Tallas de anillo. El número y el diámetro se usan para ordenar y filtrar por rango."
      singular="talla"
      resource="sizes"
      api={{ create: api.createSize, update: api.updateSize, remove: api.deleteSize }}
      columns={[
        { key: 'label', label: 'Etiqueta', className: 'font-medium text-neutral-900' },
        { key: 'ring_size', label: 'N° anillo' },
        { key: 'diameter_mm', label: 'Diámetro (mm)' },
        { key: 'display_order', label: 'Orden' },
      ]}
      fields={[
        { key: 'label', label: 'Etiqueta visible', type: 'text', required: true, placeholder: 'Ej: 6 - 16.5 mm' },
        { key: 'ring_size', label: 'Número de anillo', type: 'number', step: '0.1', min: 0, helperText: 'Solo el número, ej: 6' },
        { key: 'diameter_mm', label: 'Diámetro en mm', type: 'number', step: '0.01', min: 0, placeholder: '16.5' },
        { key: 'display_order', label: 'Orden', type: 'number', min: 0 },
      ]}
    />
  );
}
