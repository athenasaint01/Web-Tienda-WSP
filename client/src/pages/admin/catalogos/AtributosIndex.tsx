import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Tag, Users, ArrowLeftRight, Ruler, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

type CatalogCard = {
  icon: LucideIcon;
  label: string;
  desc: string;
  path: string;
  resource: string; // endpoint público para contar
};

const catalogs: CatalogCard[] = [
  { icon: Boxes, label: 'Materiales', desc: 'Plata, acero, oro, baños y enchapados', path: '/admin/materiales', resource: 'materials' },
  { icon: Tag, label: 'Tags', desc: 'Etiquetas de estilo (minimal, statement...)', path: '/admin/tags', resource: 'tags' },
  { icon: Users, label: 'Públicos', desc: 'Mujer, hombre, niño, unisex...', path: '/admin/publicos', resource: 'audiences' },
  { icon: ArrowLeftRight, label: 'Grosores', desc: 'De muy delgado a muy grueso', path: '/admin/grosores', resource: 'thicknesses' },
  { icon: Ruler, label: 'Tallas', desc: 'Tallas de anillo con diámetro', path: '/admin/tallas', resource: 'sizes' },
  { icon: Ruler, label: 'Largos', desc: 'Largos de cadenas y pulseras (cm)', path: '/admin/largos', resource: 'lengths' },
  { icon: Palette, label: 'Colores', desc: 'Colores con muestra visual', path: '/admin/colores', resource: 'colors' },
];

export default function AtributosIndex() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(
      catalogs.map((c) =>
        fetch(`${API}/${c.resource}`)
          .then((r) => r.json())
          .then((d) => [c.resource, d.data?.length ?? 0] as const)
          .catch(() => [c.resource, 0] as const),
      ),
    ).then((entries) => setCounts(Object.fromEntries(entries)));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Atributos de producto</h1>
        <p className="text-neutral-600 mt-1">
          Catálogos maestros que alimentan el formulario de producto. Edita aquí las opciones
          disponibles; luego se asignan por producto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalogs.map(({ icon: Icon, label, desc, path, resource }) => (
          <Link
            key={path}
            to={path}
            className="flex items-start gap-4 bg-white border border-neutral-200 rounded-lg p-5 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
          >
            <div className="inline-flex p-2.5 rounded-lg bg-neutral-100 shrink-0">
              <Icon className="w-5 h-5 text-neutral-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-neutral-900">{label}</p>
                <span className="text-xs text-neutral-400">
                  {counts[resource] ?? '—'}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
