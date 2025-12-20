import { Package, Users, Tag, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">
          ¡Bienvenido!
        </h2>
        <p className="text-neutral-600">
          Aquí puedes gestionar todo el contenido de tu tienda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card: Productos */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-1">6</h3>
          <p className="text-sm text-neutral-600">Productos totales</p>
        </div>

        {/* Card: Categorías */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Layers className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-1">4</h3>
          <p className="text-sm text-neutral-600">Categorías</p>
        </div>

        {/* Card: Materiales */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-1">2</h3>
          <p className="text-sm text-neutral-600">Materiales</p>
        </div>

        {/* Card: Tags */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-1">10</h3>
          <p className="text-sm text-neutral-600">Tags disponibles</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/productos/nuevo"
            className="p-4 border-2 border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left block"
          >
            <Package className="w-6 h-6 text-neutral-900 mb-2" />
            <h4 className="font-semibold text-neutral-900 mb-1">
              Nuevo Producto
            </h4>
            <p className="text-sm text-neutral-600">
              Agregar un producto al catálogo
            </p>
          </Link>

          <Link
            to="/admin/categorias"
            className="p-4 border-2 border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left block"
          >
            <Layers className="w-6 h-6 text-neutral-900 mb-2" />
            <h4 className="font-semibold text-neutral-900 mb-1">
              Nueva Categoría
            </h4>
            <p className="text-sm text-neutral-600">
              Crear una nueva categoría
            </p>
          </Link>

          <Link
            to="/admin/productos"
            className="p-4 border-2 border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left block"
          >
            <Tag className="w-6 h-6 text-neutral-900 mb-2" />
            <h4 className="font-semibold text-neutral-900 mb-1">
              Ver todos los productos
            </h4>
            <p className="text-sm text-neutral-600">
              Gestionar productos existentes
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
