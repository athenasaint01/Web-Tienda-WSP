import { memo, useEffect, useState } from "react";

type Props = {
  selected: { categoria: string[]; material: string[]; tags: string[]; q: string };
  onToggle: (key: "categoria" | "material" | "tags", value: string) => void;
  onSearch: (q: string) => void;
  onClearAll: () => void;
  categories: string[];
  materials: string[];
  tags: string[];
};

function FiltersSidebarBase({ selected, onToggle, onSearch, onClearAll, categories, materials, tags }: Props) {
  // input controlado + debounce
  const [q, setQ] = useState(selected.q);
  useEffect(() => setQ(selected.q), [selected.q]);
  useEffect(() => {
    const id = window.setTimeout(() => onSearch(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q, onSearch]);

  return (
    <aside className="md:w-72 w-full md:sticky md:top-24">
      <div className="rounded-3xl border p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Filtrar</h3>
          <button className="text-xs underline" onClick={onClearAll}>Limpiar</button>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-full border px-3 py-2 text-sm mb-4"
          type="search"
        />

        {/* Categoría */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Categoría</div>
          <div className="space-y-2">
            {categories.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={selected.categoria.includes(c)}
                  onChange={() => onToggle("categoria", c)}
                />
                <span className="capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Material */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Material</div>
          <div className="space-y-2">
            {materials.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={selected.material.includes(m)}
                  onChange={() => onToggle("material", m)}
                />
                <span className="capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="text-sm font-medium mb-2">Tags</div>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {tags.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={selected.tags.includes(t)}
                  onChange={() => onToggle("tags", t)}
                />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default memo(FiltersSidebarBase);
