import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  Boxes,
  Images,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Ruler,
  Palette,
  ArrowLeftRight,
  SlidersHorizontal,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path?: string;
  children?: { icon: LucideIcon; label: string; path: string }[];
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: ClipboardList, label: 'Pedidos', path: '/admin/pedidos' },
  { icon: Package, label: 'Productos', path: '/admin/productos' },
  { icon: Layers, label: 'Categorías', path: '/admin/categorias' },
  { icon: Images, label: 'Colecciones', path: '/admin/colecciones' },
  {
    icon: SlidersHorizontal,
    label: 'Atributos',
    path: '/admin/atributos',
    children: [
      { icon: Boxes, label: 'Materiales', path: '/admin/materiales' },
      { icon: Tag, label: 'Tags', path: '/admin/tags' },
      { icon: Users, label: 'Públicos', path: '/admin/publicos' },
      { icon: ArrowLeftRight, label: 'Grosores', path: '/admin/grosores' },
      { icon: Ruler, label: 'Tallas', path: '/admin/tallas' },
      { icon: Ruler, label: 'Largos', path: '/admin/largos' },
      { icon: Palette, label: 'Colores', path: '/admin/colores' },
    ],
  },
  { icon: Megaphone, label: 'Popups', path: '/admin/popups' },
  { icon: Settings, label: 'Configuración', path: '/admin/settings' },
];

// Rutas que pertenecen al grupo "Atributos" (para abrirlo automáticamente)
const attributesItem = menuItems.find((i) => i.label === 'Atributos')!;
const ATTRIBUTE_PATHS = [
  attributesItem.path!,
  ...attributesItem.children!.map((c) => c.path),
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // El grupo "Atributos" arranca abierto si estás en una de sus rutas
  const [attrsOpen, setAttrsOpen] = useState(() =>
    ATTRIBUTE_PATHS.includes(location.pathname),
  );

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (active: boolean, nested = false) =>
    `flex items-center gap-3 rounded-lg transition-colors ${
      nested ? 'px-4 py-2 text-sm' : 'px-4 py-3'
    } ${active ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`;

  const renderNav = (onNavigate?: () => void) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;

        // Item con submenú
        if (item.children) {
          const groupActive =
            (item.path && isActive(item.path)) || item.children.some((c) => isActive(c.path));
          return (
            <div key={item.label}>
              <div
                className={`${linkClass(Boolean(item.path && isActive(item.path)))} justify-between ${
                  groupActive && !attrsOpen && !(item.path && isActive(item.path))
                    ? 'text-neutral-900 font-medium'
                    : ''
                }`}
              >
                <Link
                  to={item.path!}
                  onClick={() => {
                    setAttrsOpen(true);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setAttrsOpen((o) => !o)}
                  className="p-1 -mr-1 rounded hover:bg-black/10"
                  aria-expanded={attrsOpen}
                  aria-label={attrsOpen ? 'Colapsar Atributos' : 'Expandir Atributos'}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${attrsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {attrsOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-neutral-200 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onNavigate}
                        className={linkClass(isActive(child.path), true)}
                      >
                        <ChildIcon className="w-4 h-4" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Item simple
        return (
          <Link
            key={item.path}
            to={item.path!}
            onClick={onNavigate}
            className={linkClass(isActive(item.path!))}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-white border-r border-neutral-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">Alahas Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">{renderNav()}</nav>

        {/* User info */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
              <span className="text-neutral-700 font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="absolute top-0 left-0 bottom-0 w-64 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 shrink-0">
              <h1 className="text-xl font-bold text-neutral-900">Alahas Admin</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-4 py-6 space-y-1 flex-1 overflow-y-auto">
              {renderNav(() => setSidebarOpen(false))}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-neutral-200 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Alahas Admin</h1>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
