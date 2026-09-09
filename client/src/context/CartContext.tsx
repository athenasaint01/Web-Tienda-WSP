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
  qty: number;
};

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
  remove: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'alahas_cart';
const MAX_QTY = 99;

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // saneo mínimo
    return parsed
      .filter((x) => x && typeof x.productId === 'number' && typeof x.slug === 'string')
      .map((x) => ({ ...x, qty: Math.min(MAX_QTY, Math.max(1, Number(x.qty) || 1)) }));
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
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) }
            : i
        );
      }
      return [...prev, { ...item, qty: Math.min(MAX_QTY, Math.max(1, qty)) }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) =>
        i.productId === productId ? { ...i, qty: Math.min(MAX_QTY, qty) } : i
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
