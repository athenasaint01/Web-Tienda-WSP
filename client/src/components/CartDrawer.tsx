import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWhatsAppPhone, useCurrency, formatPrice } from '../hooks/useSettings';
import { waLink, buildCartMessage } from '../lib/wa';
import { createOrder } from '../services/api';

export default function CartDrawer() {
  const { items, isOpen, close, count, itemPrice, total, hasItemsWithoutPrice, setQty, remove, clear } =
    useCart();
  // El carrito usa siempre el número configurado, INDEPENDIENTE del toggle
  // "Mostrar botones de WhatsApp" (ese toggle solo afecta el botón flotante
  // y el botón "Consultar" de cada producto).
  const phone = useWhatsAppPhone();
  const currency = useCurrency();

  // Paso del checkout: 'cart' (lista) | 'form' (nombre/teléfono)
  const [step, setStep] = useState<'cart' | 'form'>('cart');
  const [name, setName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetCheckout = () => {
    setStep('cart');
    setName('');
    setCustomerPhone('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    close();
    setTimeout(resetCheckout, 300);
  };

  const handleSubmitOrder = async () => {
    if (name.trim().length < 2) {
      setError('Escribe tu nombre para continuar.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Registrar el pedido (best-effort: si falla, igual mandamos a WhatsApp)
      try {
        await createOrder({
          customer_name: name.trim(),
          customer_phone: customerPhone.trim() || null,
          currency_symbol: currency,
          items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
        });
      } catch (e) {
        console.warn('No se pudo registrar el pedido, se continúa a WhatsApp:', e);
      }

      // 2. Abrir WhatsApp
      const msg = buildCartMessage(items, { currency, customerName: name.trim() });
      window.open(waLink(phone, msg), '_blank', 'noreferrer');

      // 3. Vaciar carrito y cerrar
      clear();
      handleClose();
    } finally {
      setSubmitting(false);
    }
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
            onClick={handleClose}
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
                {step === 'form' ? (
                  <>
                    <button
                      onClick={() => setStep('cart')}
                      className="p-1 -ml-1 hover:bg-black/5 rounded transition-colors"
                      aria-label="Volver a la selección"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    Tus datos
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    Tu selección
                    {count > 0 && (
                      <span className="text-xs text-neutral-400">
                        ({count} {count === 1 ? 'artículo' : 'artículos'})
                      </span>
                    )}
                  </>
                )}
              </h2>
              <button
                onClick={handleClose}
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
                  onClick={handleClose}
                  className="mt-2 text-xs uppercase tracking-widest underline text-[#4a4438]"
                >
                  Ver productos
                </Link>
              </div>
            ) : step === 'form' ? (
              /* ── Paso: datos del cliente ── */
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <p className="text-sm text-neutral-600">
                    Déjanos tu nombre y te atendemos por WhatsApp con tu selección.
                  </p>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-1.5">
                      Tu nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      maxLength={120}
                      placeholder="Ej: María Pérez"
                      className="w-full border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#4a4438]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-1.5">
                      Teléfono <span className="text-neutral-400 normal-case tracking-normal">(opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/[^\d\s+()-]/g, ''))}
                      maxLength={30}
                      placeholder="999 999 999"
                      className="w-full border border-neutral-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#4a4438]"
                    />
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}

                  {/* mini resumen */}
                  <div className="border-t border-black/10 pt-3 text-xs text-neutral-500 space-y-1">
                    {items.map((it) => (
                      <div key={it.productId} className="flex justify-between gap-2">
                        <span className="truncate">
                          {it.name} <span className="text-neutral-400">×{it.qty}</span>
                        </span>
                        <span className="shrink-0">
                          {itemPrice(it) != null
                            ? formatPrice(itemPrice(it)! * it.qty, currency)
                            : 'a consultar'}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 font-medium text-neutral-800">
                      <span>Total{hasItemsWithoutPrice ? ' parcial' : ''}</span>
                      <span>{total > 0 ? formatPrice(total, currency) : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/10 p-5">
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-medium hover:brightness-105 transition disabled:opacity-60"
                  >
                    <BsWhatsapp className="h-4 w-4" />
                    {submitting ? 'Abriendo WhatsApp…' : 'Enviar pedido por WhatsApp'}
                  </button>
                </div>
              </>
            ) : (
              /* ── Paso: lista del carrito ── */
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
                          onClick={handleClose}
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
                            onClick={handleClose}
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

                  {phone ? (
                    <button
                      onClick={() => setStep('form')}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 text-white py-3 text-sm font-medium hover:brightness-105 transition"
                    >
                      <BsWhatsapp className="h-4 w-4" />
                      Pedir por WhatsApp
                    </button>
                  ) : (
                    <p className="text-xs text-center text-neutral-400">
                      Aún no hay un número de WhatsApp configurado.
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
