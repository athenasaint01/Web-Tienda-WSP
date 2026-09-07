import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

// =============================================
// Tipos de configuración
// =============================================

export type FieldType = 'text' | 'slug' | 'number' | 'color';

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  /** Si es true, se autogenera desde el campo `name` al crear (solo type 'slug') */
  autoFromName?: boolean;
  step?: string;
  min?: number;
};

export type ColumnConfig<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Row = { id: number } & Record<string, any>;

type CatalogCrudPageProps<T extends Row> = {
  title: string;
  subtitle: string;
  singular: string; // "color", "talla", ...
  /** Endpoint público relativo (sin /api). Ej: "colors" */
  resource: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  api: {
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    remove: (id: number) => Promise<any>;
  };
  /** Transforma el estado del form al payload que espera el backend */
  toPayload?: (form: Record<string, any>) => Record<string, any>;
};

const toSlug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// =============================================
// Componente
// =============================================

export default function CatalogCrudPage<T extends Row>({
  title,
  subtitle,
  singular,
  resource,
  columns,
  fields,
  api,
  toPayload,
}: CatalogCrudPageProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE_URL}/${resource}`);
      const data = await res.json();
      if (data.ok) setRows(data.data);
    } catch {
      toast.error(`Error al cargar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const handleDelete = async (row: T) => {
    const label = (row as any).name ?? (row as any).label ?? `#${row.id}`;
    if (!confirm(`¿Eliminar "${label}"?`)) return;
    try {
      await api.remove(row.id);
      toast.success(`${singular[0].toUpperCase()}${singular.slice(1)} eliminado`);
      load();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const closeModal = (success?: boolean) => {
    setModalOpen(false);
    setEditing(null);
    if (success) load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="text-neutral-600 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto" />
          <p className="text-neutral-600 mt-4">Cargando...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">No hay registros</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className="text-left px-6 py-3 text-sm font-semibold text-neutral-700"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 text-sm text-neutral-700 ${col.className ?? ''}`}
                    >
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(row);
                          setModalOpen(true);
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
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

      {modalOpen && (
        <CatalogModal
          singular={singular}
          fields={fields}
          editing={editing}
          api={api}
          toPayload={toPayload}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// =============================================
// Modal de crear/editar
// =============================================

function CatalogModal<T extends Row>({
  singular,
  fields,
  editing,
  api,
  toPayload,
  onClose,
}: {
  singular: string;
  fields: FieldConfig[];
  editing: T | null;
  api: CatalogCrudPageProps<T>['api'];
  toPayload?: CatalogCrudPageProps<T>['toPayload'];
  onClose: (success?: boolean) => void;
}) {
  const isEditing = !!editing;

  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    fields.forEach((f) => {
      init[f.key] = editing ? (editing as any)[f.key] ?? '' : '';
    });
    return init;
  });
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // autogenerar slug desde name al crear
      if (key === 'name' && !slugTouched) {
        const slugField = fields.find((f) => f.type === 'slug' && f.autoFromName);
        if (slugField) next[slugField.key] = toSlug(value);
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      const v = form[f.key];
      if (f.required && (v === '' || v === undefined || v === null)) {
        errs[f.key] = 'Requerido';
      }
      if (f.type === 'slug' && v && !/^[a-z0-9-]+$/.test(v)) {
        errs[f.key] = 'Solo minúsculas, números y guiones';
      }
      if (f.type === 'color' && v && !/^#[0-9A-Fa-f]{6}$/.test(v)) {
        errs[f.key] = 'Formato #RRGGBB';
      }
      if (f.type === 'number' && v !== '' && v !== undefined && isNaN(Number(v))) {
        errs[f.key] = 'Debe ser un número';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Construir payload: números como number, vacíos opcionales omitidos
    const payload: Record<string, any> = {};
    fields.forEach((f) => {
      let v = form[f.key];
      if (v === '' || v === undefined || v === null) {
        if (f.type === 'color') payload[f.key] = null; // hex explícitamente null
        return;
      }
      if (f.type === 'number') v = Number(v);
      payload[f.key] = v;
    });

    const finalPayload = toPayload ? toPayload(payload) : payload;

    try {
      setSubmitting(true);
      if (isEditing) {
        await api.update(editing!.id, finalPayload);
        toast.success('Actualizado');
      } else {
        await api.create(finalPayload);
        toast.success('Creado');
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">
            {isEditing ? `Editar ${singular}` : `Nuevo ${singular}`}
          </h2>
          <button
            onClick={() => onClose()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {f.label}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className={f.type === 'color' ? 'flex items-center gap-3' : ''}>
                {f.type === 'color' && (
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(form[f.key] ?? '') ? form[f.key] : '#000000'}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="h-10 w-12 rounded border border-neutral-300 cursor-pointer shrink-0"
                  />
                )}
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={form[f.key] ?? ''}
                  step={f.step}
                  min={f.min}
                  placeholder={f.placeholder}
                  onChange={(e) => {
                    if (f.type === 'slug') {
                      setSlugTouched(true);
                      setField(f.key, toSlug(e.target.value));
                    } else {
                      setField(f.key, e.target.value);
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg transition-all focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                    errors[f.key] ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300'
                  }`}
                />
              </div>
              {errors[f.key] ? (
                <p className="mt-1.5 text-sm text-red-600">{errors[f.key]}</p>
              ) : f.helperText ? (
                <p className="mt-1.5 text-sm text-neutral-500">{f.helperText}</p>
              ) : null}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
