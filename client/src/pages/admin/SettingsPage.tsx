import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FacebookIcon } from 'lucide-react';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { BsWhatsapp } from 'react-icons/bs';
import { invalidateSettingsCache } from '../../hooks/useSettings';

const API = import.meta.env.VITE_API_URL || '/api';

type Form = {
  whatsapp_phone: string;
  whatsapp_enabled: boolean;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
};

const empty: Form = {
  whatsapp_phone: '',
  whatsapp_enabled: true,
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
};

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/admin/settings`, { headers })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          const raw = data.data as Record<string, string>;
          setForm({
            ...empty,
            ...raw,
            whatsapp_enabled: raw.whatsapp_enabled !== 'false',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        whatsapp_enabled: String(form.whatsapp_enabled),
      };
      const res = await fetch(`${API}/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      invalidateSettingsCache();
      toast.success('Configuración guardada');
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-neutral-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Configuración</h1>
      <p className="text-sm text-neutral-400 mb-8">Ajustes generales de la tienda</p>

      {/* WhatsApp */}
      <div className="border border-neutral-200 p-6 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-4 flex items-center gap-2">
          <BsWhatsapp className="h-4 w-4 text-emerald-500" /> WhatsApp
        </h2>

        {/* Toggle habilitar/deshabilitar */}
        <div className="flex items-center justify-between mb-5 pb-5 border-b border-neutral-100">
          <div>
            <p className="text-sm font-medium text-neutral-800">Mostrar botones de WhatsApp</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Al desactivar, se ocultan el botón flotante y todos los enlaces de WhatsApp en la web pública.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.whatsapp_enabled}
            onClick={() => setForm(f => ({ ...f, whatsapp_enabled: !f.whatsapp_enabled }))}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
              form.whatsapp_enabled ? 'bg-emerald-500' : 'bg-neutral-300',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                form.whatsapp_enabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Número */}
        <div>
          <label className="text-sm text-neutral-700 mb-1 block">Número de teléfono</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400 border border-neutral-200 px-3 py-2 bg-neutral-50 select-none">+</span>
            <input
              type="tel"
              placeholder="51980656823"
              value={form.whatsapp_phone}
              onChange={e => setForm(f => ({ ...f, whatsapp_phone: e.target.value.replace(/\D/g, '') }))}
              className="flex-1 border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <p className="text-xs text-neutral-400 mt-1">Código de país sin +. Ej: 51980656823</p>
          {form.whatsapp_phone && (
            <a
              href={`https://wa.me/${form.whatsapp_phone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 text-xs text-emerald-600 underline"
            >
              wa.me/{form.whatsapp_phone}
            </a>
          )}
        </div>
      </div>

      {/* Redes sociales */}
      <div className="border border-neutral-200 p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-4">Redes sociales</h2>
        <p className="text-xs text-neutral-400 mb-4">Si dejas un campo vacío, ese ícono no aparecerá en el footer.</p>
        <div className="grid gap-4">
          <div>
            <label className="text-sm text-neutral-700 mb-1 flex items-center gap-2">
              <FacebookIcon className="h-4 w-4 text-[#1877F2]" /> Facebook
            </label>
            <input
              type="url"
              placeholder="https://www.facebook.com/tupagina"
              value={form.facebook_url}
              onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-700 mb-1 flex items-center gap-2">
              <FaInstagram className="h-4 w-4 text-[#E1306C]" /> Instagram
            </label>
            <input
              type="url"
              placeholder="https://www.instagram.com/tuperfil"
              value={form.instagram_url}
              onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-700 mb-1 flex items-center gap-2">
              <FaTiktok className="h-4 w-4" /> TikTok
            </label>
            <input
              type="url"
              placeholder="https://www.tiktok.com/@tuperfil"
              value={form.tiktok_url}
              onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value }))}
              className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-black text-white hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
