import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import FiltersSidebar from "../components/FiltersSidebar";
import Chip from "../components/Chip";
import { products } from "../data/products";
import { AnimatePresence, motion } from "framer-motion";

type SortKey = "relevancia" | "nombre-asc" | "nombre-desc";

const unique = (arr: string[]) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));

/** Evita parpadeo: muestra pending tras un delay y lo mantiene un mínimo tiempo al ocultar */
function useDelayedPending(pending: boolean, delay = 180, minVisible = 350) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    if (pending) {
      // si aún no se ve, programamos mostrar tras 'delay'
      if (!visible) showTimer = window.setTimeout(() => setVisible(true), delay);
    } else {
      // cancelar mostrar si aún no se disparó
      if (showTimer) window.clearTimeout(showTimer);
      // si está visible, lo mantenemos un mínimo tiempo para evitar flicker
      if (visible) hideTimer = window.setTimeout(() => setVisible(false), minVisible);
    }

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [pending, visible, delay, minVisible]);

  return visible;
}

export default function Productos() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const showPending = useDelayedPending(isPending, 180, 350);

  // Estado derivado de la URL
  const selected = {
    categoria: params.getAll("categoria"),
    material: params.getAll("material"),
    tags: params.getAll("tag"),
    q: params.get("q") ?? "",
    sort: (params.get("sort") as SortKey) ?? "relevancia",
  };

  // Listas disponibles
  const categories = unique(products.map((p) => p.category));
  const materials = unique(products.flatMap((p) => p.materials ?? []));
  const tags = unique(products.flatMap((p) => p.tags ?? []));

  // Helpers URL (no bloqueantes)
  const updateParams = (next: URLSearchParams) =>
    startTransition(() => setParams(next, { replace: true }));

  const toggle = (key: "categoria" | "material" | "tags", value: string) => {
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
    const next = new URLSearchParams(params);
    q ? next.set("q", q) : next.delete("q");
    next.set("page", "1");
    updateParams(next);
  };

  const clearAll = () => navigate("/productos", { replace: true });

  const setSort = (sort: SortKey) => {
    const next = new URLSearchParams(params);
    next.set("sort", sort);
    updateParams(next);
  };

  // Suavizar búsqueda
  const deferredQ = useDeferredValue(selected.q);

  // Filtrado + ordenamiento
  const sorted = useMemo(() => {
    const filtered = products.filter((p) => {
      if (selected.categoria.length && !selected.categoria.includes(p.category)) return false;
      if (selected.material.length && !selected.material.some((m) => p.materials?.includes(m))) return false;
      if (selected.tags.length && !selected.tags.some((t) => p.tags?.includes(t))) return false;

      if (deferredQ) {
        const q = deferredQ.toLowerCase();
        const text = [p.name, p.description, p.tags?.join(" ")].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    switch (selected.sort) {
      case "nombre-asc":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "nombre-desc":
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered; // relevancia
    }
  }, [
    deferredQ,
    selected.sort,
    selected.categoria.join("|"),
    selected.material.join("|"),
    selected.tags.join("|"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <FiltersSidebar
          selected={{ categoria: selected.categoria, material: selected.material, tags: selected.tags, q: selected.q }}
          onToggle={toggle}
          onSearch={setQuery}
          onClearAll={clearAll}
          categories={categories}
          materials={materials}
          tags={tags}
        />

        {/* Contenido */}
        <div className="flex-1">
          {/* Header resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h1 className="font-serif text-2xl">Productos</h1>

            <div className="flex items-center gap-3">
              {showPending && (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
                  Actualizando…
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="text-sm">Ordenar:</label>
                <select
                  className="rounded-full border px-3 py-1.5 text-sm"
                  value={selected.sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="relevancia">Relevancia</option>
                  <option value="nombre-asc">Nombre A–Z</option>
                  <option value="nombre-desc">Nombre Z–A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chips activos */}
          {(selected.categoria.length || selected.material.length || selected.tags.length || selected.q) ? (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {selected.q && <Chip onRemove={() => setQuery("")}>Buscar: “{selected.q}”</Chip>}
              {selected.categoria.map((v) => (
                <Chip key={`c-${v}`} onRemove={() => toggle("categoria", v)}>Categoría: {v}</Chip>
              ))}
              {selected.material.map((v) => (
                <Chip key={`m-${v}`} onRemove={() => toggle("material", v)}>Material: {v}</Chip>
              ))}
              {selected.tags.map((v) => (
                <Chip key={`t-${v}`} onRemove={() => toggle("tags", v)}>Tag: {v}</Chip>
              ))}
              <button onClick={clearAll} className="text-xs underline ml-2">Limpiar todo</button>
            </div>
          ) : null}

          {/* Grid con animación de layout fluida */}
          {sorted.length ? (
            <motion.div
              layout
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
              transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {sorted.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <ProductCard p={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-3xl border p-10 text-center text-sm text-neutral-600">
              No hay productos que coincidan con tus filtros.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
