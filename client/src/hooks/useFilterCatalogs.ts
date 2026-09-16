import { useEffect, useState } from 'react';
import {
  getMaterials,
  getAudiences,
  getThicknesses,
  getColors,
  getCategories,
} from '../services/api';

type Option = { name: string; slug: string; hex?: string | null };

type Catalogs = {
  materials: Option[];
  audiences: Option[];
  thicknesses: Option[];
  colors: Option[];
  categories: Option[];
};

const EMPTY: Catalogs = { materials: [], audiences: [], thicknesses: [], colors: [], categories: [] };

/**
 * Carga los catálogos completos usados por los filtros del catálogo público.
 * Se cargan una sola vez (no dependen de los productos filtrados) -- a
 * diferencia de derivarlos de `products`, que solo trae la página actual
 * ya filtrada y por eso ocultaba categorías sin productos en esa página.
 * Tags sigue derivándose de los productos en Productos.tsx.
 */
export const useFilterCatalogs = (): Catalogs => {
  const [catalogs, setCatalogs] = useState<Catalogs>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getMaterials(), getAudiences(), getThicknesses(), getColors(), getCategories()])
      .then(([materials, audiences, thicknesses, colors, categories]) => {
        if (cancelled) return;
        setCatalogs({
          materials: materials.map((m) => ({
            name: m.name_short || m.name,
            slug: m.slug,
          })),
          audiences: audiences.map((a) => ({ name: a.name, slug: a.slug })),
          thicknesses: thicknesses.map((t) => ({ name: t.name, slug: t.slug })),
          colors: colors.map((c) => ({ name: c.name, slug: c.slug, hex: c.hex })),
          categories: categories
            .filter((c) => c.slug !== 'outlet')
            .map((c) => ({ name: c.name, slug: c.slug })),
        });
      })
      .catch((err) => {
        console.error('Error cargando catálogos de filtros:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return catalogs;
};
