import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Páginas públicas: cada una en su propio chunk -- un visitante que solo
// abre la Home no debería descargar el código de Productos, la ficha de
// producto, ni (sobre todo) el panel admin completo.
const Home = lazy(() => import("./pages/Home"));
const Productos = lazy(() => import("./pages/Productos"));
const ProductoDetalle = lazy(() => import("./pages/ProductoDetalle"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Marca = lazy(() => import("./pages/Marca"));

// Admin: nadie fuera del equipo lo visita, pero antes iba en el mismo
// bundle que la Home pública -- separado por completo del chunk público.
const Login = lazy(() => import("./pages/admin/Login"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const CategoriasPage = lazy(() => import("./pages/admin/categorias/CategoriasPage"));
const ColeccionesPage = lazy(() => import("./pages/admin/colecciones/ColeccionesPage"));
const BannersPage = lazy(() => import("./pages/admin/banners/BannersPage"));
const MaterialesPage = lazy(() => import("./pages/admin/materiales/MaterialesPage"));
const TagsPage = lazy(() => import("./pages/admin/tags/TagsPage"));
const AtributosIndex = lazy(() => import("./pages/admin/catalogos/AtributosIndex"));
const PublicosPage = lazy(() => import("./pages/admin/catalogos/PublicosPage"));
const GrosoresPage = lazy(() => import("./pages/admin/catalogos/GrosoresPage"));
const TallasPage = lazy(() => import("./pages/admin/catalogos/TallasPage"));
const LargosPage = lazy(() => import("./pages/admin/catalogos/LargosPage"));
const ColoresPage = lazy(() => import("./pages/admin/catalogos/ColoresPage"));
const ProductosPage = lazy(() => import("./pages/admin/productos/ProductosPage"));
const ProductForm = lazy(() => import("./pages/admin/productos/ProductForm"));
const PedidosPage = lazy(() => import("./pages/admin/pedidos/PedidosPage"));
const PopupsPage = lazy(() => import("./pages/admin/popups/PopupsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" richColors />
      <Suspense fallback={null}>
        <Routes>
          {/* Rutas públicas */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="productos" element={<Productos />} />
            <Route path="producto/:slug" element={<ProductoDetalle />} />
            <Route path="nosotros" element={<Nosotros />} />
            <Route path="marca" element={<Marca />} />
          </Route>

          {/* Rutas admin */}
          <Route path="admin/login" element={<Login />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="productos" element={<ProductosPage />} />
            <Route path="productos/nuevo" element={<ProductForm />} />
            <Route path="productos/:id/editar" element={<ProductForm />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="colecciones" element={<ColeccionesPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="atributos" element={<AtributosIndex />} />
            <Route path="materiales" element={<MaterialesPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="publicos" element={<PublicosPage />} />
            <Route path="grosores" element={<GrosoresPage />} />
            <Route path="tallas" element={<TallasPage />} />
            <Route path="largos" element={<LargosPage />} />
            <Route path="colores" element={<ColoresPage />} />
            <Route path="popups" element={<PopupsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
