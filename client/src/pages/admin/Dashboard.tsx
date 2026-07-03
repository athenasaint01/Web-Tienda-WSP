import { useEffect, useState } from 'react';
import { Package, Layers, Tag, Boxes, Megaphone, Settings, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';

type Stats = {
  products: number;
  categories: number;
  materials: number;
  tags: number;
  popup_active: boolean;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/products`, { headers: h }).then(r => r.json()),
      fetch(`${API}/categories`, { headers: h }).then(r => r.json()),
      fetch(`${API}/materials`, { headers: h }).then(r => r.json()),
      fetch(`${API}/tags`, { headers: h }).then(r => r.json()),
      fetch(`${API}/popup/active`).then(r => r.json()),
    ]).then(([products, categories, materials, tags, popup]) => {
      setStats({
        products: products.pagination?.total ?? products.data?.length ?? 0,
        categories: categories.data?.length ?? 0,
        materials: materials.data?.length ?? 0,
        tags: tags.data?.length ?? 0,
        popup_active: !!popup.data,
      });
    }).catch(() => {});
  }, []);

  const statCards = [
    { icon: Package, label: 'Productos', value: stats?.products, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/productos' },
    { icon: Layers, label: 'Categorías', value: stats?.categories, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/categorias' },
    { icon: Boxes, label: 'Materiales', value: stats?.materials, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/materiales' },
    { icon: Tag, label: 'Tags', value: stats?.tags, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/tags' },
  ];

  const quickActions = [
    { icon: Plus, label: 'Nuevo producto', desc: 'Agregar al catálogo', link: '/admin/productos/nuevo' },
    { icon: Package, label: 'Ver productos', desc: 'Gestionar productos existentes', link: '/admin/productos' },
    { icon: Megaphone, label: 'Popups', desc: 'Gestionar banners promocionales', link: '/admin/popups' },
    { icon: Settings, label: 'Configuración', desc: 'Número de WhatsApp y más', link: '/admin/settings' },
    { icon: ExternalLink, label: 'Ver tienda', desc: 'Abrir la tienda en nueva pestaña', link: '/', external: true },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-1">Dashboard</h2>
        <p className="text-sm text-neutral-400">Resumen general de tu tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, value, color, bg, link }) => (
          <Link key={label} to={link} className="bg-white border border-neutral-200 p-5 hover:border-neutral-400 transition group">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              {stats === null ? '—' : value}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Popup status */}
      {stats !== null && (
        <Link to="/admin/popups" className="flex items-center justify-between border border-neutral-200 bg-white px-5 py-4 mb-8 hover:border-neutral-400 transition">
          <div className="flex items-center gap-3">
            <Megaphone className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700">Popup promocional</span>
          </div>
          <span className={`text-xs px-2.5 py-1 font-medium ${stats.popup_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
            {stats.popup_active ? 'Activo' : 'Inactivo'}
          </span>
        </Link>
      )}

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, desc, link, external }) =>
            external ? (
              <a
                key={label}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 border border-neutral-200 bg-white p-4 hover:border-neutral-400 hover:bg-neutral-50 transition"
              >
                <Icon className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-800">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </div>
              </a>
            ) : (
              <Link
                key={label}
                to={link}
                className="flex items-start gap-3 border border-neutral-200 bg-white p-4 hover:border-neutral-400 hover:bg-neutral-50 transition"
              >
                <Icon className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-800">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
