import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Nosotros from "./pages/Nosotros";
import ProductoDetalle from "./pages/ProductoDetalle";
import Login from "./pages/admin/Login";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CategoriasPage from "./pages/admin/categorias/CategoriasPage";
import ColeccionesPage from "./pages/admin/colecciones/ColeccionesPage";
import MaterialesPage from "./pages/admin/materiales/MaterialesPage";
import TagsPage from "./pages/admin/tags/TagsPage";
import ProductosPage from "./pages/admin/productos/ProductosPage";
import ProductForm from "./pages/admin/productos/ProductForm";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Rutas públicas */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="productos" element={<Productos />} />
          <Route path="producto/:slug" element={<ProductoDetalle />} />
          <Route path="nosotros" element={<Nosotros />} />
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
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/nuevo" element={<ProductForm />} />
          <Route path="productos/:id/editar" element={<ProductForm />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="colecciones" element={<ColeccionesPage />} />
          <Route path="materiales" element={<MaterialesPage />} />
          <Route path="tags" element={<TagsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
