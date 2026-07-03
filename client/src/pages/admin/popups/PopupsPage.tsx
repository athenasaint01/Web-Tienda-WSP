import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, X, Upload } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

type Popup = {
  id: number;
  title: string;
  image_url: string;
  button_url: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const empty: Omit<Popup, 'id'> = {
  title: '',
  image_url: '',
  button_url: '',
  is_active: false,
  starts_at: null,
  ends_at: null,
};

// Convierte datetime-local (sin zona) a ISO UTC asumiendo GMT-5
const toUTC = (local: string | null): string | null => {
  if (!local) return null;
  const date = new Date(local + ':00-05:00');
  return date.toISOString();
};

// Convierte ISO UTC a datetime-local en GMT-5 para mostrar en el input
const toLocal = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = -5 * 60;
  const local = new Date(date.getTime() + offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchPopups = async () => {
    try {
      const res = await fetch(`${API}/admin/popups`, { headers });
      const data = await res.json();
      if (data.ok) setPopups(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPopups(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({ ...p, starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at) });
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API}/admin/popups/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setForm(f => ({ ...f, image_url: data.url }));
      toast.success('Imagen subida');
    } catch (e: any) {
      toast.error(e.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        message: '',
        button_text: '',
        starts_at: toUTC(form.starts_at),
        ends_at: toUTC(form.ends_at),
      };
      const url = editing ? `${API}/admin/popups/${editing.id}` : `${API}/admin/popups`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(editing ? 'Popup actualizado' : 'Popup creado');
      closeModal();
      fetchPopups();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este popup?')) return;
    try {
      const res = await fetch(`${API}/admin/popups/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success('Popup eliminado');
      fetchPopups();
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  const handleToggle = async (p: Popup) => {
    try {
      const res = await fetch(`${API}/admin/popups/${p.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...p, message: '', button_text: '', is_active: !p.is_active }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(p.is_active ? 'Popup desactivado' : 'Popup activado');
      fetchPopups();
    } catch (e: any) {
      toast.error(e.message || 'Error');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Popups promocionales</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm hover:bg-neutral-800 transition"
        >
          <Plus size={16} /> Nuevo popup
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-400 text-sm">Cargando...</p>
      ) : popups.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p>No hay popups creados aún.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {popups.map((p) => (
            <div key={p.id} className="border border-neutral-200 p-4 flex items-start gap-4">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-20 h-20 object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-neutral-300'}`} />
                  <h3 className="font-medium">{p.title}</h3>
                </div>
                {p.button_url && (
                  <p className="text-xs text-neutral-400 mt-1 truncate">{p.button_url}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(p)}
                  className={`text-xs px-3 py-1 border transition ${p.is_active ? 'border-green-500 text-green-600 hover:bg-green-50' : 'border-neutral-300 text-neutral-500 hover:bg-neutral-50'}`}
                >
                  {p.is_active ? 'Activo' : 'Inactivo'}
                </button>
                <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-neutral-100 transition">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 p-1 hover:bg-neutral-100">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar popup' : 'Nuevo popup'}</h2>

            <div className="grid gap-3">
              <input
                placeholder="Título *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="border border-neutral-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-amber-400"
              />

              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {form.image_url ? (
                  <div className="relative">
                    <img src={form.image_url} alt="Preview" className="w-full object-cover max-h-64" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border border-dashed border-neutral-300 py-8 flex flex-col items-center gap-2 text-neutral-400 hover:border-amber-400 hover:text-amber-500 transition"
                  >
                    <Upload size={20} />
                    <span className="text-sm">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs text-neutral-400 mb-1 block">URL de destino (click en el banner)</label>
                <input
                  placeholder="https://... o /productos"
                  value={form.button_url}
                  onChange={e => setForm(f => ({ ...f, button_url: e.target.value }))}
                  className="border border-neutral-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Fecha inicio (GMT-5)</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at ?? ''}
                    onChange={e => setForm(f => ({ ...f, starts_at: e.target.value || null }))}
                    className="border border-neutral-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Fecha fin (GMT-5)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at ?? ''}
                    onChange={e => setForm(f => ({ ...f, ends_at: e.target.value || null }))}
                    className="border border-neutral-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="accent-amber-500"
                />
                Activar popup inmediatamente
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={closeModal} className="px-4 py-2 text-sm border border-neutral-200 hover:bg-neutral-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-black text-white hover:bg-neutral-800 transition">
                {editing ? 'Guardar cambios' : 'Crear popup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
