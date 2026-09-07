import CatalogCrudPage from './CatalogCrudPage';
import * as api from '../../../services/api';
import type { Length } from '../../../types/api';

export default function LargosPage() {
  return (
    <CatalogCrudPage<Length & { id: number }>
      title="Largos"
      subtitle="Largos de cadenas y pulseras. El valor en cm permite filtrar por rango."
      singular="largo"
      resource="lengths"
      api={{ create: api.createLength, update: api.updateLength, remove: api.deleteLength }}
      columns={[
        { key: 'label', label: 'Etiqueta', className: 'font-medium text-neutral-900' },
        { key: 'value_cm', label: 'Valor (cm)' },
        { key: 'display_order', label: 'Orden' },
      ]}
      fields={[
        { key: 'label', label: 'Etiqueta visible', type: 'text', required: true, placeholder: 'Ej: 45 cm' },
        { key: 'value_cm', label: 'Valor en cm', type: 'number', required: true, step: '0.1', min: 0, helperText: 'Solo el número, ej: 45' },
        { key: 'display_order', label: 'Orden', type: 'number', min: 0 },
      ]}
    />
  );
}
