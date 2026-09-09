import { memo, useEffect, useRef, useState } from "react";

export type FilterKey = "categoria" | "material" | "tags" | "publico" | "grosor" | "color";

type Option = { name: string; slug: string; hex?: string | null };

type Props = {
  selected: {
    categoria: string[];
    material: string[];
    tags: string[];
    publico: string[];
    grosor: string[];
    color: string[];
    q: string;
  };
  onToggle: (key: FilterKey, value: string) => void;
  onSearch: (q: string) => void;
  onClearAll: () => void;
  categories: Option[];
  materials: Option[];
  tags: Option[];
  audiences: Option[];
  thicknesses: Option[];
  colors: Option[];
  compact?: boolean; // Para uso dentro del modal
};

function CheckboxGroup({
  title,
  options,
  selected,
  filterKey,
  onToggle,
  maxHeight,
}: {
  title: string;
  options: Option[];
  selected: string[];
  filterKey: FilterKey;
  onToggle: Props["onToggle"];
  maxHeight?: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className={`space-y-2 ${maxHeight ?? ""} ${maxHeight ? "overflow-auto pr-1" : ""}`}>
        {options.map((o) => (
          <label key={o.slug} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={selected.includes(o.slug)}
              onChange={() => onToggle(filterKey, o.slug)}
            />
            {o.hex !== undefined && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-black/20 shrink-0"
                style={
                  o.hex
                    ? { background: o.hex }
                    : { background: "conic-gradient(red, orange, yellow, green, blue, violet, red)" }
                }
              />
            )}
            <span className="capitalize">{o.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FiltersSidebarBase({
  selected,
  onToggle,
  onSearch,
  onClearAll,
  categories,
  materials,
  tags,
  audiences,
  thicknesses,
  colors,
  compact = false,
}: Props) {
  // input controlado + debounce
  const [q, setQ] = useState(selected.q);
  useEffect(() => setQ(selected.q), [selected.q]);

  // `onSearch` puede cambiar de identidad en cada render del padre; lo guardamos
  // en un ref para que el efecto de debounce NO se re-dispare por eso (si lo
  // hiciera, volvería a llamar onSearch("") y resetearía la página del catálogo).
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    // No disparar si el valor ya coincide con el de la URL (evita el no-op
    // que ocurre al montar o al navegar de página).
    if (q.trim() === selected.q.trim()) return;
    const id = window.setTimeout(() => onSearchRef.current(q.trim()), 250);
    return () => window.clearTimeout(id);
  }, [q, selected.q]);

  const content = (
    <>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Filtrar</h3>
          <button className="text-xs underline" onClick={onClearAll}>Limpiar</button>
        </div>
      )}
      {compact && (
        <div className="flex items-center justify-end mb-3">
          <button className="text-xs underline" onClick={onClearAll}>Limpiar todo</button>
        </div>
      )}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full rounded-full border px-3 py-2 text-sm mb-4"
        type="search"
      />

      <CheckboxGroup title="Categoría" options={categories} selected={selected.categoria} filterKey="categoria" onToggle={onToggle} />
      <CheckboxGroup title="Público" options={audiences} selected={selected.publico} filterKey="publico" onToggle={onToggle} />
      <CheckboxGroup title="Material" options={materials} selected={selected.material} filterKey="material" onToggle={onToggle} maxHeight="max-h-56" />
      <CheckboxGroup title="Color" options={colors} selected={selected.color} filterKey="color" onToggle={onToggle} maxHeight="max-h-56" />
      <CheckboxGroup title="Grosor" options={thicknesses} selected={selected.grosor} filterKey="grosor" onToggle={onToggle} />
      <CheckboxGroup title="Tags" options={tags} selected={selected.tags} filterKey="tags" onToggle={onToggle} maxHeight="max-h-56" />
    </>
  );

  if (compact) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <aside className="md:w-72 w-full md:sticky md:top-24">
      <div className="rounded-3xl border p-4 md:p-5">
        {content}
      </div>
    </aside>
  );
}

export default memo(FiltersSidebarBase);
