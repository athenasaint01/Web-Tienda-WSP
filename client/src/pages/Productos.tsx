import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import FiltersSidebar from "../components/FiltersSidebar";
import Chip from "../components/Chip";
import { useProducts } from "../hooks/useProducts";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

type SortKey = "relevancia" | "nombre-asc" | "nombre-desc";

export default function Productos() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Paginación responsiva: 6 en mobile, 12 en desktop
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    const updateLimit = () => {
      // Usar el breakpoint md de Tailwind (768px)
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const newLimit = isMobile ? 6 : 12;

      // Si el límite cambió, resetear a página 1
      if (newLimit !== limit) {
        setLimit(newLimit);
        const currentPage = parseInt(params.get("page") ?? "1");
        if (currentPage > 1) {
          const next = new URLSearchParams(params);
          next.set("page", "1");
          setParams(next, { replace: true });
        }
      }
    };

    updateLimit();
    window.addEventListener('resize', updateLimit);
    return () => window.removeEventListener('resize', updateLimit);
  }, [limit, params, setParams]);

  // Estado derivado de la URL
  const selected = {
    categoria: params.getAll("categoria"),
    material: params.getAll("material"),
    tags: params.getAll("tag"),
    q: params.get("q") ?? "",
    sort: (params.get("sort") as SortKey) ?? "relevancia",
    page: parseInt(params.get("page") ?? "1"),
  };

  // Obtener productos desde la API con filtros
  const { products, pagination, loading, error } = useProducts({
    categoria: selected.categoria.length > 0 ? selected.categoria : undefined,
    material: selected.material.length > 0 ? selected.material : undefined,
    tag: selected.tags.length > 0 ? selected.tags : undefined,
    q: selected.q || undefined,
    sort: selected.sort,
    page: selected.page,
    limit: limit,
  });

  // Extraer opciones de filtros desde los productos disponibles
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; slug: string }>();
    products.forEach(p => {
      if (!categoryMap.has(p.category_slug)) {
        categoryMap.set(p.category_slug, { name: p.category, slug: p.category_slug });
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const materials = useMemo(() => {
    const materialsMap = new Map<string, { name: string; slug: string }>();
    products.forEach(p => {
      p.materials.forEach(m => {
        if (!materialsMap.has(m.slug)) {
          materialsMap.set(m.slug, m);
        }
      });
    });
    return Array.from(materialsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const tags = useMemo(() => {
    const tagsMap = new Map<string, { name: string; slug: string }>();
    products.forEach(p => {
      p.tags.forEach(t => {
        if (!tagsMap.has(t.slug)) {
          tagsMap.set(t.slug, t);
        }
      });
    });
    return Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Estado para detectar carga inicial vs cambio de filtros
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Marcar como NO inicial después del primer render
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper para crear variantes de animación según el contexto
  const getItemVariants = (isInitial: boolean) => {
    if (isInitial) {
      // Carga inicial: Slide up suave + fade
      return {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 }
      };
    } else {
      // Filtros: Fade simple
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      };
    }
  };

  const getTransition = (isInitial: boolean, index: number) => {
    const baseDelay = isInitial ? index * 0.05 : index * 0.04;
    const duration = isInitial ? 0.5 : 0.3;
    const easing = isInitial
      ? ([0.25, 0.1, 0.25, 1] as const)
      : ([0.4, 0, 0.2, 1] as const);

    return {
      duration,
      delay: baseDelay,
      ease: easing
    };
  };

  // Helpers URL
  const updateParams = (next: URLSearchParams) => setParams(next, { replace: true });

  const toggle = (key: "categoria" | "material" | "tags", value: string) => {
    setIsInitialLoad(false);
    const map = { categoria: "categoria", material: "material", tags: "tag" } as const;
    const urlKey = map[key];
    const current = new Set(params.getAll(urlKey));
    current.has(value) ? current.delete(value) : current.add(value);

    const next = new URLSearchParams(params);
    next.delete(urlKey);
    [...current].forEach((v) => next.append(urlKey, v));
    next.set("page", "1");
    updateParams(next);
  };

  const setQuery = (q: string) => {
    setIsInitialLoad(false);
    const next = new URLSearchParams(params);
    q ? next.set("q", q) : next.delete("q");
    next.set("page", "1");
    updateParams(next);
  };

  const clearAll = () => navigate("/productos", { replace: true });

  const setSort = (sort: SortKey) => {
    setIsInitialLoad(false);
    const next = new URLSearchParams(params);
    next.set("sort", sort);
    updateParams(next);
  };

  // Funciones de paginación
  const goToPage = (page: number) => {
    setIsInitialLoad(false);
    const next = new URLSearchParams(params);
    next.set("page", page.toString());
    updateParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextPage = () => {
    if (pagination && selected.page < pagination.totalPages) {
      goToPage(selected.page + 1);
    }
  };

  const prevPage = () => {
    if (selected.page > 1) {
      goToPage(selected.page - 1);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Título */}
      <h1 className="font-serif text-2xl mb-4">Productos</h1>

      {/* Barra de herramientas: Filtros y Ordenar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Botón Filtros (visible en móvil, oculto en desktop) */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="md:hidden flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
        >
          <SlidersHorizontal size={18} />
          Filtrar
        </button>

        {/* Espacio vacío en desktop */}
        <div className="hidden md:block" />

        {/* Ordenar */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium hidden sm:inline">Ordenar:</label>
          <select
            className="rounded-full border border-black/20 px-3 py-2 text-sm bg-white hover:bg-black/5 transition-colors"
            value={selected.sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="relevancia">Relevancia</option>
            <option value="nombre-asc">A–Z</option>
            <option value="nombre-desc">Z–A</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Desktop - Siempre visible en desktop */}
        <div className="hidden md:block">
          <FiltersSidebar
            selected={{ categoria: selected.categoria, material: selected.material, tags: selected.tags, q: selected.q }}
            onToggle={toggle}
            onSearch={setQuery}
            onClearAll={clearAll}
            categories={categories}
            materials={materials}
            tags={tags}
          />
        </div>

        {/* Modal de Filtros para Móvil */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] md:hidden"
                onClick={() => setIsFilterOpen(false)}
              />

              {/* Panel de Filtros */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-[61] md:hidden overflow-y-auto"
              >
                {/* Header del modal */}
                <div className="sticky top-0 bg-white border-b border-black/10 p-4 flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Filtros</h2>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    aria-label="Cerrar filtros"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className="p-4">
                  <FiltersSidebar
                    selected={{ categoria: selected.categoria, material: selected.material, tags: selected.tags, q: selected.q }}
                    onToggle={toggle}
                    onSearch={setQuery}
                    onClearAll={clearAll}
                    categories={categories}
                    materials={materials}
                    tags={tags}
                    compact={true}
                  />
                </div>

                {/* Footer del modal con botón aplicar */}
                <div className="sticky bottom-0 bg-white border-t border-black/10 p-4">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full rounded-full bg-black text-white py-3 font-medium hover:bg-black/90 transition-colors"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Contenido */}
        <div className="flex-1">
          {/* Indicador de carga */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
              Cargando productos…
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center mb-6">
              <p className="text-red-600">Error al cargar productos</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          )}

          {/* Chips activos */}
          {!loading && (selected.categoria.length || selected.material.length || selected.tags.length || selected.q) ? (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {selected.q && <Chip onRemove={() => setQuery("")}>Buscar: "{selected.q}"</Chip>}
              {selected.categoria.map((slug) => {
                const category = categories.find(c => c.slug === slug);
                return (
                  <Chip key={`c-${slug}`} onRemove={() => toggle("categoria", slug)}>
                    Categoría: {category?.name || slug}
                  </Chip>
                );
              })}
              {selected.material.map((slug) => {
                const material = materials.find(m => m.slug === slug);
                return (
                  <Chip key={`m-${slug}`} onRemove={() => toggle("material", slug)}>
                    Material: {material?.name || slug}
                  </Chip>
                );
              })}
              {selected.tags.map((slug) => {
                const tag = tags.find(t => t.slug === slug);
                return (
                  <Chip key={`t-${slug}`} onRemove={() => toggle("tags", slug)}>
                    Tag: {tag?.name || slug}
                  </Chip>
                );
              })}
              <button onClick={clearAll} className="text-xs underline ml-2">Limpiar todo</button>
            </div>
          ) : null}

          {/* Grid con animación de layout fluida */}
          {!loading && products.length > 0 ? (
            <motion.div
              layout
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
              transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
            >
              <AnimatePresence mode="popLayout" initial={true}>
                {products.map((p, index) => {
                  const variants = getItemVariants(isInitialLoad);
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      variants={variants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={getTransition(isInitialLoad, index)}
                    >
                      <ProductCard p={p} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : null}

          {/* Empty state */}
          {!loading && !error && products.length === 0 && (
            <div className="rounded-3xl border p-10 text-center text-sm text-neutral-600">
              No hay productos que coincidan con tus filtros.
            </div>
          )}

          {/* Controles de paginación */}
          {!loading && pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {/* Botón anterior */}
              <button
                onClick={prevPage}
                disabled={selected.page === 1}
                className="inline-flex items-center gap-1 rounded-full border border-black/20 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 disabled:hover:bg-transparent"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Números de página */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                  // Mostrar solo páginas cercanas en mobile (página actual ± 1)
                  const isCurrent = page === selected.page;
                  const isNearby = Math.abs(page - selected.page) <= 1;
                  const isFirst = page === 1;
                  const isLast = page === pagination.totalPages;
                  const shouldShow = isCurrent || isNearby || isFirst || isLast;

                  if (!shouldShow) {
                    // Mostrar "..." entre grupos
                    if (page === selected.page - 2 || page === selected.page + 2) {
                      return (
                        <span key={page} className="px-2 text-neutral-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={[
                        "h-9 w-9 rounded-full text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-black text-white"
                          : "border border-black/20 hover:bg-black/5",
                      ].join(" ")}
                      aria-label={`Ir a página ${page}`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Botón siguiente */}
              <button
                onClick={nextPage}
                disabled={selected.page === pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-full border border-black/20 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 disabled:hover:bg-transparent"
                aria-label="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Info de paginación */}
          {!loading && pagination && products.length > 0 && (
            <p className="mt-4 text-center text-xs text-neutral-500">
              Mostrando {products.length} de {pagination.total} productos
              {pagination.totalPages > 1 && ` • Página ${selected.page} de ${pagination.totalPages}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
