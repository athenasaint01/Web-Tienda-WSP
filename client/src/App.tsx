import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import Nosotros from "./pages/Nosotros";
import ProductoDetalle from "./pages/ProductoDetalle";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="productos" element={<Productos />} />
        <Route path="producto/:slug" element={<ProductoDetalle />} />
        <Route path="nosotros" element={<Nosotros />} />
      </Route>
    </Routes>
  );
}
