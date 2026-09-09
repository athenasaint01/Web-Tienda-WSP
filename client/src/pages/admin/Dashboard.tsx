import { useEffect, useState, lazy, Suspense } from 'react';
import { Package, Layers, Boxes, Megaphone, Settings, Plus, ExternalLink, SlidersHorizontal, ClipboardList, MessageCircle, Eye, BarChart3, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopConsultedProducts, type TopConsultedProduct } from '../../services/api';

// El gráfico (recharts) se carga solo cuando el admin abre esta vista.
const TopConsultedChart = lazy(() => import('../../components/admin/TopConsultedChart'));

const API = import.meta.env.VITE_API_URL || '/api';

type Stats = {
  products: number;
  categories: number;
  materials: number;
  tags: number;
  popup_active: boolean;
  pending_orders: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topConsulted, setTopConsulted] = useState<TopConsultedProduct[] | null>(null);
  const [topView, setTopView] = useState<'chart' | 'list'>('chart');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/products`, { headers: h }).then(r => r.json()),
      fetch(`${API}/categories`, { headers: h }).then(r => r.json()),
      fetch(`${API}/materials`, { headers: h }).then(r => r.json()),
      fetch(`${API}/tags`, { headers: h }).then(r => r.json()),
      fetch(`${API}/popup/active`).then(r => r.json()),
      fetch(`${API}/admin/orders/pending-count`, { headers: h }).then(r => r.json()).catch(() => ({})),
    ]).then(([products, categories, materials, tags, popup, pending]) => {
      setStats({
        products: products.pagination?.total ?? products.data?.length ?? 0,
        categories: categories.data?.length ?? 0,
        materials: materials.data?.length ?? 0,
        tags: tags.data?.length ?? 0,
        popup_active: !!popup.data,
        pending_orders: pending?.data?.count ?? 0,
      });
    }).catch(() => {});

    getTopConsultedProducts(8)
      .then(res => setTopConsulted(res.ok && res.data ? res.data : []))
      .catch(() => setTopConsulted([]));
  }, []);

  const statCards = [
    { icon: ClipboardList, label: 'Pedidos pendientes', value: stats?.pending_orders, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/pedidos' },
    { icon: Package, label: 'Productos', value: stats?.products, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/productos' },
    { icon: Layers, label: 'Categorías', value: stats?.categories, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/admin/categorias' },
    { icon: Boxes, label: 'Materiales', value: stats?.materials, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/materiales' },
  ];

  const quickActions = [
    { icon: ClipboardList, label: 'Pedidos', desc: 'Confirmar ventas y actualizar stock', link: '/admin/pedidos' },
    { icon: Plus, label: 'Nuevo producto', desc: 'Agregar al catálogo', link: '/admin/productos/nuevo' },
    { icon: SlidersHorizontal, label: 'Atributos', desc: 'Materiales, tallas, colores, públicos...', link: '/admin/atributos' },
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

      {/* Top productos consultados */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
            Top productos consultados
          </h3>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-neutral-400">
              Ordenado por clics a WhatsApp
            </span>
            {topConsulted && topConsulted.length > 0 && (
              <div className="inline-flex rounded-lg border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setTopView('chart')}
                  className={`p-1.5 transition-colors ${topView === 'chart' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                  title="Ver gráfico"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTopView('list')}
                  className={`p-1.5 transition-colors ${topView === 'list' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
                  title="Ver lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="border border-neutral-200 bg-white">
          {topConsulted === null ? (
            <p className="text-sm text-neutral-400 px-5 py-6">Cargando…</p>
          ) : topConsulted.length === 0 ? (
            <p className="text-sm text-neutral-400 px-5 py-6">
              Aún no hay consultas registradas. Cuando los clientes vean fichas y pulsen
              “Consulta este producto”, aparecerán aquí.
            </p>
          ) : topView === 'chart' ? (
            <div className="p-4">
              <Suspense
                fallback={<p className="text-sm text-neutral-400 py-8 text-center">Cargando gráfico…</p>}
              >
                <TopConsultedChart data={topConsulted} />
              </Suspense>
              <div className="flex items-center gap-4 justify-center mt-2 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-600" /> Consultas (clic WhatsApp)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-neutral-300" /> Vistas de ficha
                </span>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {topConsulted.map((p, idx) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-5 text-center text-sm font-semibold text-neutral-400 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 shrink-0 bg-neutral-50 overflow-hidden rounded">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/producto/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm font-medium text-neutral-800 truncate hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p.stock <= 0 && (
                      <span className="text-[11px] text-red-600">Agotado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-sm tabular-nums">
                    <span className="inline-flex items-center gap-1 text-emerald-700" title="Clics en “Consulta este producto”">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {p.wa_click_count}
                    </span>
                    <span className="inline-flex items-center gap-1 text-neutral-400" title="Veces que se abrió la ficha">
                      <Eye className="w-3.5 h-3.5" />
                      {p.view_count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
