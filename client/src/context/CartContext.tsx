import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  category?: string;
  price?: number | null;       // precio normal
  sale_price?: number | null;  // precio con descuento (derivado del backend)
  image_url?: string;
  /**
   * Stock disponible al momento de agregar (snapshot). Se usa como tope
   * de cantidad. El backend re-valida el stock real al confirmar el pedido.
   * undefined = producto sin control de stock -> sin tope (solo MAX_QTY).
   */
  stock?: number;
  /**
   * Presente solo si el producto tiene variantes (color/talla/largo con
   * precio/stock propios). Dos líneas con el mismo productId pero distinto
   * variantId son items DISTINTOS del carrito (ej. el mismo anillo en dos
   * tallas) — cada una con su propia cantidad y su propio tope de stock.
   * Carritos guardados antes de esta versión no tienen este campo: se
   * tratan como "sin variante", que es el comportamiento correcto para
   * productos simples.
   */
  variantId?: number;
  variantSku?: string | null;
  variantLabel?: string | null; // ej: "Dorado · Talla 7"
  qty: number;
};

/** Cantidad máxima permitida para un item, respetando su stock. */
export function maxQtyFor(item: Pick<CartItem, 'stock'>): number {
  if (item.stock == null || item.stock <= 0) return MAX_QTY_HARD;
  return Math.min(MAX_QTY_HARD, item.stock);
}

/**
 * Dos items son la "misma línea" del carrito si son el mismo producto Y
 * la misma variante (o ambos sin variante). Reemplaza la comparación
 * antigua de solo `productId`, que asumía 1 línea por producto.
 */
function sameLine(a: Pick<CartItem, 'productId' | 'variantId'>, b: Pick<CartItem, 'productId' | 'variantId'>): boolean {
  return a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);
}

type CartContextType = {
  items: CartItem[];
  count: number;               // suma de cantidades
  /** Precio efectivo de un item (sale_price si hay oferta, si no price). */
  itemPrice: (item: CartItem) => number | null;
  /** Suma de los que tienen precio. */
  total: number;
  /** ¿Algún item sin precio? -> el total es parcial. */
  hasItemsWithoutPrice: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (productId: number, variantId?: number) => void;
  setQty: (productId: number, qty: number, variantId?: number) => void;
  /** Cantidad máxima que admite un item según su stock (snapshot). */
  maxQty: (item: Pick<CartItem, 'stock'>) => number;
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'alahas_cart';
const MAX_QTY_HARD = 99;

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // saneo: la cantidad no puede pasar el stock (snapshot) ni MAX_QTY_HARD
    return parsed
      .filter((x) => x && typeof x.productId === 'number' && typeof x.slug === 'string')
      .map((x) => ({
        ...x,
        qty: Math.min(maxQtyFor(x), Math.max(1, Number(x.qty) || 1)),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStorage());
  const [isOpen, setIsOpen] = useState(false);

  // Persistir
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage lleno / bloqueado: el carrito sigue en memoria */
    }
  }, [items]);

  // Sincronizar entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        // Refresca el stock con el snapshot más reciente y respeta el tope.
        const stock = item.stock ?? existing.stock;
        const cap = maxQtyFor({ stock });
        return prev.map((i) =>
          sameLine(i, item) ? { ...i, stock, qty: Math.min(cap, i.qty + qty) } : i
        );
      }
      const cap = maxQtyFor(item);
      return [...prev, { ...item, qty: Math.min(cap, Math.max(1, qty)) }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: number, variantId?: number) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variantId })));
  }, []);

  const setQty = useCallback((productId: number, qty: number, variantId?: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => !sameLine(i, { productId, variantId }));
      return prev.map((i) =>
        sameLine(i, { productId, variantId }) ? { ...i, qty: Math.min(maxQtyFor(i), qty) } : i
      );
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemPrice = useCallback((item: CartItem): number | null => {
    if (item.sale_price != null && item.price != null && item.sale_price < item.price) {
      return item.sale_price;
    }
    return item.price ?? null;
  }, []);

  const value = useMemo<CartContextType>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    let total = 0;
    let hasItemsWithoutPrice = false;
    for (const i of items) {
      const p = itemPrice(i);
      if (p == null) hasItemsWithoutPrice = true;
      else total += p * i.qty;
    }
    return {
      items,
      count,
      itemPrice,
      total: Math.round(total * 100) / 100,
      hasItemsWithoutPrice,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((o) => !o),
      add,
      remove,
      setQty,
      maxQty: maxQtyFor,
      clear,
    };
  }, [items, isOpen, itemPrice, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
