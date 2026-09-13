import { useState, useEffect, useRef } from 'react';
import { X, Search, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '../../../services/api';
import type { ProductListItem, ProductDetail, ProductVariant } from '../../../types/api';
import { useCurrency, formatPrice, getOffer } from '../../../hooks/useSettings';

type DraftItem = {
  key: string; // productId + variantId, para distinguir líneas en la UI
  productId: number;
  productName: string;
  variantId?: number;
  variantLabel?: string;
  catalogPrice: number | null; // precio de catálogo/variante (referencia)
  stock: number;
  qty: number;
  manualPrice: string; // input controlado como string; '' = usar catalogPrice
};

type Props = {
  onClose: (created: boolean) => void;
};

/**
 * Registro de pedido manual (sin pasar por el carrito web). El admin
 * busca el producto, elige la variante si aplica (mismas opciones ya
 * disponibles en la ficha), y puede opcionalmente fijar un precio
 * especial por línea -- útil para gente cercana o acuerdos puntuales.
 * El stock se descuenta igual que cualquier pedido al confirmarlo.
 */
export default function ManualOrderModal({ onClose }: Props) {
  const currency = useCurrency();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Buscador de producto
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const debRef = useRef<number | undefined>(undefined);

  // Producto elegido en el buscador, pendiente de configurar
  // variante/cantidad antes de agregarlo a la lista.
  const [picking, setPicking] = useState<ProductDetail | null>(null);
  const [pickingLoading, setPickingLoading] = useState(false);
  const [selColorId, setSelColorId] = useState<number | null>(null);
  const [selSizeId, setSelSizeId] = useState<number | null>(null);
  const [selLengthId, setSelLengthId] = useState<number | null>(null);
  const [pickQty, setPickQty] = useState(1);

  useEffect(() => {
    window.clearTimeout(debRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.getProducts({ q: query.trim(), limit: 8 });
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(debRef.current);
  }, [query]);

  const startPicking = async (p: ProductListItem) => {
    setPickingLoading(true);
    setSelColorId(null);
    setSelSizeId(null);
    setSelLengthId(null);
    setPickQty(1);
    try {
      const res = await api.getProductById(p.id);
      if (res.ok && res.data) {
        setPicking(res.data);
        setQuery('');
        setResults([]);
      } else {
        toast.error('No se pudo cargar el producto');
      }
    } catch {
      toast.error('No se pudo cargar el producto');
    } finally {
      setPickingLoading(false);
    }
  };

  // Variante resuelta según la selección actual, igual criterio que la
  // ficha pública: solo se compara en los ejes que el producto usa.
  const resolvedVariant: ProductVariant | undefined = picking?.has_variants
    ? picking.variants?.find((v) => {
        if (picking.variant_uses_color && v.color_id !== selColorId) return false;
        if (picking.variant_uses_size && v.size_id !== selSizeId) return false;
        if (picking.variant_uses_length && v.length_id !== selLengthId) return false;
        return true;
      })
    : undefined;

  const variantSelectionIncomplete =
    !!picking?.has_variants &&
    ((picking.variant_uses_color && selColorId == null) ||
      (picking.variant_uses_size && selSizeId == null) ||
      (picking.variant_uses_length && selLengthId == null));

  const addPickedToDraft = () => {
    if (!picking) return;
    if (variantSelectionIncomplete) {
      toast.error('Elige las opciones del producto antes de agregarlo');
      return;
    }
    const stock = picking.has_variants ? resolvedVariant?.stock ?? 0 : picking.stock;
    const offer = picking.has_variants
      ? getOffer(resolvedVariant?.price, resolvedVariant?.sale_price)
      : getOffer(picking.price, picking.sale_price);
    const catalogPrice = offer
      ? offer.salePrice
      : picking.has_variants
        ? resolvedVariant?.price ?? null
        : picking.price ?? null;

    const variantLabel = resolvedVariant
      ? [
          picking.variant_uses_color ? resolvedVariant.color?.name : null,
          picking.variant_uses_size ? resolvedVariant.size?.label : null,
          picking.variant_uses_length ? resolvedVariant.length?.label : null,
        ]
          .filter(Boolean)
          .join(' · ')
      : undefined;

    const key = `${picking.id}-${resolvedVariant?.id ?? 'x'}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: Math.min(99, i.qty + pickQty) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: picking.id,
          productName: picking.name,
          variantId: resolvedVariant?.id,
          variantLabel,
          catalogPrice,
          stock,
          qty: Math.min(99, pickQty),
          manualPrice: '',
        },
      ];
    });
    setPicking(null);
  };

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const lineTotal = (it: DraftItem): number | null => {
    const price = it.manualPrice.trim() !== '' ? Number(it.manualPrice) : it.catalogPrice;
    return price != null && !isNaN(price) ? Math.round(price * it.qty * 100) / 100 : null;
  };

  const total = items.reduce((s, it) => s + (lineTotal(it) ?? 0), 0);
  const hasUnpriced = items.some((it) => lineTotal(it) == null);

  const handleSubmit = async () => {
    if (customerName.trim().length < 2) {
      toast.error('Escribe el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    setSubmitting(true);
    try {
      await api.createManualOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        currency_symbol: currency,
        items: items.map((it) => ({
          product_id: it.productId,
          qty: it.qty,
          variant_id: it.variantId,
          unit_price: it.manualPrice.trim() !== '' ? Number(it.manualPrice) : undefined,
        })),
      });
      toast.success('Pedido manual registrado');
      onClose(true);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo registrar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-neutral-900">Registrar pedido manual</h2>
          <button onClick={() => onClose(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Datos del cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Nombre del cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: María Pérez"
                maxLength={120}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Teléfono <span className="text-neutral-400">(opcional)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/[^\d\s+()-]/g, ''))}
                placeholder="999 999 999"
                maxLength={30}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Buscador de producto */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Agregar producto</label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full border border-neutral-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
              />
              {searching && (
                <Loader2 className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
              )}
            </div>
            {results.length > 0 && (
              <div className="mt-1 border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-56 overflow-y-auto">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startPicking(p)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-9 h-9 shrink-0 bg-neutral-50 rounded overflow-hidden">
                      {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{p.name}</p>
                      <p className="text-xs text-neutral-400">
                        {p.has_variants ? 'Con variantes' : p.price != null ? formatPrice(p.price, currency) : 'Sin precio'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuración del producto elegido (variante + cantidad) */}
          {pickingLoading && (
            <div className="border border-neutral-200 rounded-lg p-4 text-sm text-neutral-500 text-center">
              Cargando producto…
            </div>
          )}
          {picking && !pickingLoading && (
            <div className="border border-neutral-300 rounded-lg p-4 space-y-3 bg-neutral-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900">{picking.name}</p>
                <button onClick={() => setPicking(null)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {picking.has_variants && picking.variant_uses_color && picking.colors?.length ? (
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Color</p>
                  <div className="flex flex-wrap gap-1.5">
                    {picking.colors.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setSelColorId(selColorId === c.id ? null : c.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selColorId === c.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-300 bg-white text-neutral-700'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {picking.has_variants && picking.variant_uses_size && picking.sizes?.length ? (
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Talla</p>
                  <div className="flex flex-wrap gap-1.5">
                    {picking.sizes.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelSizeId(selSizeId === s.id ? null : s.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selSizeId === s.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-300 bg-white text-neutral-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {picking.has_variants && picking.variant_uses_length && picking.lengths?.length ? (
                <div>
                  <p className="text-xs font-medium text-neutral-600 mb-1">Largo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {picking.lengths.map((l: any) => (
                      <button
                        key={l.id}
                        onClick={() => setSelLengthId(selLengthId === l.id ? null : l.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selLengthId === l.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-300 bg-white text-neutral-700'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {picking.has_variants && variantSelectionIncomplete && (
                <p className="text-xs text-amber-700">Elige las opciones disponibles.</p>
              )}
              {picking.has_variants && !variantSelectionIncomplete && !resolvedVariant && (
                <p className="text-xs text-red-600">Esa combinación no está disponible.</p>
              )}
              {resolvedVariant && (
                <p className="text-xs text-neutral-500">
                  Stock disponible: {resolvedVariant.stock} · Precio de catálogo:{' '}
                  {resolvedVariant.price != null ? formatPrice(resolvedVariant.price, currency) : '—'}
                </p>
              )}
              {!picking.has_variants && (
                <p className="text-xs text-neutral-500">
                  Stock disponible: {picking.stock} · Precio de catálogo:{' '}
                  {picking.price != null ? formatPrice(picking.price, currency) : '—'}
                </p>
              )}

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-neutral-600">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={pickQty}
                  onChange={(e) => setPickQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                  className="w-20 border border-neutral-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-neutral-900"
                />
                <button
                  onClick={addPickedToDraft}
                  disabled={picking.has_variants && (variantSelectionIncomplete || !resolvedVariant)}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar al pedido
                </button>
              </div>
            </div>
          )}

          {/* Lista de items agregados */}
          {items.length > 0 && (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-neutral-600">Producto</th>
                    <th className="text-center px-2 py-2 font-medium text-neutral-600 w-16">Cant.</th>
                    <th className="text-right px-2 py-2 font-medium text-neutral-600 w-32">Precio especial</th>
                    <th className="text-right px-3 py-2 font-medium text-neutral-600 w-24">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((it) => (
                    <tr key={it.key}>
                      <td className="px-3 py-2">
                        <p className="text-neutral-800">{it.productName}</p>
                        {it.variantLabel && <p className="text-xs text-neutral-400">{it.variantLabel}</p>}
                        <p className="text-xs text-neutral-400">
                          Catálogo: {it.catalogPrice != null ? formatPrice(it.catalogPrice, currency) : 'a consultar'}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          max={Math.min(99, it.stock > 0 ? it.stock : 99)}
                          value={it.qty}
                          onChange={(e) =>
                            updateItem(it.key, { qty: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })
                          }
                          className="w-14 border border-neutral-300 rounded px-1.5 py-1 text-center focus:outline-none focus:border-neutral-900"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.manualPrice}
                          onChange={(e) => updateItem(it.key, { manualPrice: e.target.value })}
                          placeholder={it.catalogPrice != null ? String(it.catalogPrice) : '—'}
                          className="w-28 border border-neutral-300 rounded px-2 py-1 text-right focus:outline-none focus:border-neutral-900"
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-neutral-800">
                        {lineTotal(it) != null ? formatPrice(lineTotal(it)!, currency) : 'a consultar'}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button onClick={() => removeItem(it.key)} className="text-neutral-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-2.5 bg-neutral-50 border-t border-neutral-200">
                <span className="text-xs text-neutral-500">
                  {hasUnpriced ? 'Total parcial (hay productos a consultar)' : 'Total'}
                </span>
                <span className="font-semibold text-neutral-900">{formatPrice(total, currency)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-neutral-200 sticky bottom-0 bg-white">
          <button
            onClick={() => onClose(false)}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Registrando…' : 'Registrar pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}
