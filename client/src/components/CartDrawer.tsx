import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWhatsAppPhone, useWhatsAppEnabled, useCurrency, formatPrice } from '../hooks/useSettings';
import { waLink, buildCartMessage } from '../lib/wa';

export default function CartDrawer() {
  const { items, isOpen, close, count, itemPrice, total, hasItemsWithoutPrice, setQty, remove, clear } =
    useCart();
  const phone = useWhatsAppPhone();
  const waEnabled = useWhatsAppEnabled();
  const currency = useCurrency();

  const handleWhatsApp = () => {
    if (!phone || items.length === 0) return;
    const msg = buildCartMessage(items, { currency });
    window.open(waLink(phone, msg), '_blank', 'noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            onClick={close}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-md bg-white shadow-2xl z-[91] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h2 className="font-display text-lg font-light tracking-wide flex items-center gap-2">
                <ShoppingBag size={18} />
                Tu selección
                {count > 0 && (
                  <span className="text-xs text-neutral-400">
                    ({count} {count === 1 ? 'artículo' : 'artículos'})
                  </span>
                )}
              </h2>
              <button
                onClick={close}
                className="p-2 -mr-2 hover:bg-black/5 rounded-lg transition-colors"
                aria-label="Cerrar carrito"
              >
                <X size={22} />
              </button>
            </div>

            {/* Contenido */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <ShoppingBag size={40} className="text-neutral-300" />
                <p className="text-sm text-neutral-500">Tu selección está vacía</p>
                <Link
                  to="/productos"
                  onClick={close}
                  className="mt-2 text-xs uppercase tracking-widest underline text-[#4a4438]"
                >
                  Ver productos
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto divide-y divide-black/5">
                  {items.map((it) => {
                    const unit = itemPrice(it);
                    const onSale =
                      it.sale_price != null && it.price != null && it.sale_price < it.price;
                    return (
                      <li key={it.productId} className="flex gap-3 p-4">
                        <Link
                          to={`/producto/${it.slug}`}
                          onClick={close}
                          className="w-16 h-16 shrink-0 overflow-hidden bg-neutral-50"
                        >
                          {it.image_url && (
                            <img
                              src={it.image_url}
                              alt={it.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/producto/${it.slug}`}
                            onClick={close}
                            className="block text-xs font-medium uppercase tracking-widest text-[#4a4438] truncate"
                          >
                            {it.name}
                          </Link>

                          <div className="mt-1 text-xs">
                            {unit == null ? (
                              <span className="text-neutral-400">Precio a consultar</span>
                            ) : onSale ? (
                              <span className="flex items-baseline gap-1.5">
                                <span className="font-medium text-[#c4927a]">
                                  {formatPrice(unit, currency)}
                                </span>
                                <span className="text-neutral-400 line-through">
                                  {formatPrice(it.price!, currency)}
                                </span>
                              </span>
                            ) : (
                              <span className="font-medium text-neutral-800">
                                {formatPrice(unit, currency)}
                              </span>
                            )}
                          </div>

                          {/* Cantidad + eliminar */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="inline-flex items-center border border-neutral-300 rounded-full">
                              <button
                                onClick={() => setQty(it.productId, it.qty - 1)}
                                className="p-1.5 hover:bg-black/5 rounded-l-full transition-colors"
                                aria-label="Quitar una unidad"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-7 text-center text-xs tabular-nums">{it.qty}</span>
                              <button
                                onClick={() => setQty(it.productId, it.qty + 1)}
                                className="p-1.5 hover:bg-black/5 rounded-r-full transition-colors"
                                aria-label="Agregar una unidad"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <button
                              onClick={() => remove(it.productId)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
                              aria-label="Eliminar del carrito"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="border-t border-black/10 p-5 space-y-3">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-neutral-500">
                      Total{hasItemsWithoutPrice ? ' parcial' : ' estimado'}
                    </span>
                    <span className="font-display text-xl font-light">
                      {total > 0 ? formatPrice(total, currency) : '—'}
                    </span>
                  </div>
                  {hasItemsWithoutPrice && (
                    <p className="text-[11px] text-neutral-400 -mt-1">
                      Algunos productos se cotizan por WhatsApp.
                    </p>
                  )}

                  {waEnabled && phone ? (
                    <button
                      onClick={handleWhatsApp}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-medium hover:brightness-105 transition"
                    >
                      <BsWhatsapp className="h-4 w-4" />
                      Pedir por WhatsApp
                    </button>
                  ) : (
                    <p className="text-xs text-center text-neutral-400">
                      WhatsApp no disponible en este momento.
                    </p>
                  )}

                  <button
                    onClick={clear}
                    className="w-full text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    Vaciar selección
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
