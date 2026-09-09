import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProduct";
import { useProducts } from "../hooks/useProducts";
import WhatsAppButton from "../components/WhatsAppButton";
import BadgeChips from "../components/BadgeChips";
import ProductCard from "../components/ProductCard";
import { useWhatsAppEnabled, useCurrency, formatPrice, getOffer } from "../hooks/useSettings";
import { useCart } from "../context/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Check } from "lucide-react";

export default function ProductoDetalle() {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug || "");
  const [i, setI] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const phone = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;
  const waEnabled = useWhatsAppEnabled();
  const currency = useCurrency();
  const cart = useCart();

  // zoom on hover (desktop) / tap-hold (mobile)
  const [origin, setOrigin] = useState<string>("50% 50%");
  const [hovering, setHovering] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(false);
  const [mobileOrigin, setMobileOrigin] = useState("50% 50%");

  // Obtener productos relacionados (hook debe estar antes de cualquier early return)
  // Usamos optional chaining para evitar errores cuando product es null
  const { products: relatedRaw } = useProducts({
    categoria: product?.category?.slug || '',
    limit: 4,
  });

  // SEO: título y description dinámicos por producto
  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} — Alahas`;
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", product.description
        ? product.description.slice(0, 155)
        : `${product.name} — joyería fina Alahas. Acero inoxidable y plata 925.`);
  }, [product]);

  // keyboard nav - también debe estar antes de early returns
  useEffect(() => {
    if (!product?.images) return;

    const imageUrls = product.images.map((img: any) =>
      typeof img === 'string' ? img : img.image_url
    );

    function onKey(e: KeyboardEvent) {
      if (!imageUrls.length) return;
      const count = imageUrls.length;
      if (e.key === "ArrowRight") setI((curr) => (curr + 1) % count);
      if (e.key === "ArrowLeft") setI((curr) => (curr - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product?.images, i]);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
          <p className="text-neutral-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-sm text-neutral-600 mb-4">
          {error || "Producto no encontrado."}
        </p>
        <Link
          to="/productos"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3
                    bg-black text-white text-sm font-medium
                    transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/30"
        >
          <ArrowLeft size={16} />
          Volver a productos
        </Link>
      </div>
    );
  }

  // A partir de aquí, product está garantizado como no-null
  // Extraer URLs de las imágenes (pueden ser objetos o strings)
  const imageUrls = product.images.map((img: any) =>
    typeof img === 'string' ? img : img.image_url
  );

  const count = imageUrls.length;
  const next = () => setI((curr) => (curr + 1) % count);
  const prev = () => setI((curr) => (curr - 1 + count) % count);

  const offer = getOffer(product.price, product.sale_price);
  // Precio que se muestra "grande" y el que va al mensaje de WhatsApp.
  const displayPrice = offer ? offer.salePrice : product.price;
  const priceLabel = displayPrice != null ? formatPrice(displayPrice, currency) : "";

  const msg =
    product.wa_template ??
    `Hola, me interesa el ${product.name}${priceLabel ? ` (${priceLabel})` : ""} (${product.slug}).`;

  const primaryImage =
    (product.images.find((im: any) => im.is_primary) ?? product.images[0])?.image_url;

  const addToCart = () => {
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: typeof product.category === 'string' ? product.category : product.category?.name,
        price: product.price ?? null,
        sale_price: product.sale_price ?? null,
        image_url: primaryImage,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  // Filtrar el producto actual de los relacionados
  const related = relatedRaw.filter((p) => p.id !== product.id).slice(0, 3);

  function handleMainMove(e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
    const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div>
      {/* ── MOBILE: imagen full-width arriba ── */}
      <div className="md:hidden relative w-full bg-white overflow-hidden" style={{ aspectRatio: '1/1' }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imageUrls[i] ?? imageUrls[0]}
            src={imageUrls[i] ?? imageUrls[0]}
            alt={product.name}
            className="w-full h-full object-cover select-none touch-none"
            style={{ transformOrigin: mobileOrigin }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: mobileZoom ? 2 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              if (mobileZoom) {
                setMobileZoom(false);
              } else {
                setMobileOrigin(`${x}% ${y}%`);
                setMobileZoom(true);
              }
            }}
          />
        </AnimatePresence>

        {/* Badge AGOTADO */}
        {product.stock <= 0 && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-full shadow z-30">
            AGOTADO
          </div>
        )}

        {/* Flechas mobile */}
        {count > 1 && (
          <>
            <button onClick={prev} aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow z-20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={next} aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm shadow z-20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}

        {/* Dots indicadores */}
        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {imageUrls.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* ── DESKTOP: galería con thumbs ── */}
        <div className="hidden md:grid grid-cols-[92px_1fr] gap-4 items-start">
          <div className="flex md:flex-col gap-3 w-[92px]">
            {imageUrls.map((src, idx) => {
              const selected = i === idx;
              return (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  key={src}
                  onClick={() => setI(idx)}
                  aria-label={`Ver imagen ${idx + 1}`}
                  className={[
                    "relative shrink-0 w-[92px] transition",
                    "bg-neutral-100/80 hover:bg-neutral-100",
                    selected ? "bg-neutral-200/90" : "",
                  ].join(" ")}
                >
                  <div className="grid place-items-center w-full h-full p-2">
                    <img src={src} alt={`${product.name} ${idx + 1}`} className="max-w-[90%] max-h-[90%] object-contain" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="overflow-hidden border border-black/10 relative bg-white">
            {product.stock <= 0 && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-30">AGOTADO</div>
            )}
            {count > 1 && (
              <>
                <button onClick={prev} aria-label="Anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-white/85 hover:bg-white text-black border shadow z-20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={next} aria-label="Siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-white/85 hover:bg-white text-black border shadow z-20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={imageUrls[i] ?? imageUrls[0]}
                src={imageUrls[i] ?? imageUrls[0]}
                alt={product.name}
                className="w-full aspect-square object-cover select-none"
                style={{ transformOrigin: origin as any }}
                onMouseMove={handleMainMove}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => { setHovering(false); setOrigin("50% 50%"); }}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: hovering ? 1.35 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {typeof product.category === 'string' ? product.category : product.category.name}
            </p>
            <h1 className="font-display text-3xl font-light tracking-wide mt-1">{product.name}</h1>
            {product.badge_labels && product.badge_labels.length > 0 && (
              <div className="mt-2">
                <BadgeChips badges={product.badge_labels} size="md" showTooltip />
              </div>
            )}
          </div>

          {offer ? (
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-light text-[#c4927a]">
                {formatPrice(offer.salePrice, currency)}
              </span>
              <span className="text-lg text-neutral-400 line-through">
                {formatPrice(offer.price, currency)}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#d4a58a]/15 px-3 py-1 text-xs font-medium text-[#a06f57]">
                Ahorras {formatPrice(offer.savings, currency)} ({offer.percent}%)
              </span>
            </div>
          ) : priceLabel ? (
            <p className="font-display text-2xl font-light text-neutral-900">{priceLabel}</p>
          ) : null}

          {product.description && (
            <p className="text-neutral-700 whitespace-pre-line">{product.description}</p>
          )}

          {/* Indicador de stock */}
          <div className="text-sm">
            {product.stock <= 0 ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-red-200 text-red-600 tracking-wide text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                Agotado
              </div>
            ) : product.stock <= product.low_stock_threshold ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-amber-300 text-amber-700 tracking-wide text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Últimas {product.stock} unidades
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-amber-800/25 text-amber-800 tracking-wide text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                Disponible
              </div>
            )}
          </div>

          {/* Ficha de atributos */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {product.materials?.length ? (
              <div className="sm:col-span-2">
                <dt className="font-medium mb-1">Materiales</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {product.materials.map((m: any) => {
                    if (typeof m === 'string') {
                      return (
                        <span key={m} className="rounded-full border px-2.5 py-0.5 text-xs">{m}</span>
                      );
                    }
                    // Sello en inglés visible; español completo en el tooltip
                    return (
                      <span
                        key={m.id}
                        title={m.name}
                        className="rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs cursor-help"
                      >
                        {m.name_en || m.name_short || m.name}
                      </span>
                    );
                  })}
                </dd>
              </div>
            ) : null}

            {product.audience && (
              <div>
                <dt className="font-medium inline">Público: </dt>
                <dd className="inline">{product.audience.name}</dd>
              </div>
            )}

            {product.thickness && (
              <div>
                <dt className="font-medium inline">Grosor: </dt>
                <dd className="inline">{product.thickness.name}</dd>
              </div>
            )}

            {product.sizes?.length ? (
              <div className="sm:col-span-2">
                <dt className="font-medium inline">Tallas: </dt>
                <dd className="inline">{product.sizes.map((s: any) => s.label).join(' · ')}</dd>
              </div>
            ) : null}

            {product.lengths?.length ? (
              <div className="sm:col-span-2">
                <dt className="font-medium inline">Largos: </dt>
                <dd className="inline">{product.lengths.map((l: any) => l.label).join(' · ')}</dd>
              </div>
            ) : null}
          </dl>

          {/* Colores disponibles */}
          {product.colors?.length ? (
            <div className="text-sm">
              <span className="font-medium">Colores: </span>
              <span className="inline-flex flex-wrap items-center gap-2 align-middle">
                {product.colors.map((c: any) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border border-black/20"
                      style={
                        c.hex
                          ? { background: c.hex }
                          : { background: 'conic-gradient(red, orange, yellow, green, blue, violet, red)' }
                      }
                    />
                    {c.name}
                  </span>
                ))}
              </span>
            </div>
          ) : null}

          {product.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((t: any) => (
                <span
                  key={typeof t === 'string' ? t : t.id}
                  className="rounded-full border px-3 py-1 text-xs"
                >
                  {typeof t === 'string' ? t : t.name}
                </span>
              ))}
            </div>
          ) : null}

          {/* Agregar al carrito */}
          {product.stock > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center border border-neutral-300 rounded-full">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:bg-black/5 rounded-l-full transition-colors"
                  aria-label="Quitar una unidad"
                >
                  <Minus size={14} />
                </button>
                <span className="w-9 text-center text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  className="p-2.5 hover:bg-black/5 rounded-r-full transition-colors"
                  aria-label="Agregar una unidad"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={addToCart}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide
                          bg-[#4a4438] text-white hover:bg-[#3a352c]
                          transition-colors duration-200 focus:outline-none"
              >
                {justAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
                {justAdded ? 'Agregado' : 'Agregar al carrito'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {waEnabled && phone && (
              <WhatsAppButton phone={phone} message={msg} className="mt-1" />
            )}

            <Link
              to="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide
                        border border-amber-800/40 text-amber-800
                        hover:bg-amber-50 hover:border-amber-700
                        transition-colors duration-200 focus:outline-none"
            >
              <ArrowLeft size={15} />
              Volver a productos
            </Link>
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-light tracking-wide mb-4">También te puede gustar</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  );
}
