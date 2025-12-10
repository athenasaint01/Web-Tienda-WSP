import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProduct";
import { useProducts } from "../hooks/useProducts";
import WhatsAppButton from "../components/WhatsAppButton";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ProductListItem } from "../types/api";

/** Card con micro-tilt para la sección "Relacionados" */
function RelatedCard({ p }: { p: ProductListItem }) {
  const img = p.image_url ?? "/assets/demo/placeholder.jpg";

  const [enableTilt, setEnableTilt] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnableTilt(window.matchMedia("(pointer: fine)").matches);
    }
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rx = useSpring(tiltX, { stiffness: 150, damping: 18 });
  const ry = useSpring(tiltY, { stiffness: 150, damping: 18 });
  const MAX_TILT = 4;

  function handleMouseMove(e: React.MouseEvent) {
    if (!enableTilt) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    tiltX.set(-(py - 0.5) * (MAX_TILT * 2));
    tiltY.set((px - 0.5) * (MAX_TILT * 2));
  }
  function handleMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ rotateX: enableTilt ? rx : 0, rotateY: enableTilt ? ry : 0, transformPerspective: 900 }}
      className="group rounded-3xl overflow-hidden border bg-white will-change-transform"
    >
      <Link to={`/producto/${p.slug}`} className="block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="relative">
          <img
            src={img}
            alt={p.name}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
        <div className="p-4">
          <div className="font-serif">{p.name}</div>
          <div className="text-xs text-neutral-500 capitalize">{p.category}</div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function ProductoDetalle() {
  const { slug } = useParams();
  const { product, loading, error } = useProduct(slug || "");
  const [i, setI] = useState(0);
  const phone = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;

  // zoom on hover
  const [origin, setOrigin] = useState<string>("50% 50%");
  const [hovering, setHovering] = useState(false);

  // Obtener productos relacionados (hook debe estar antes de cualquier early return)
  // Usamos optional chaining para evitar errores cuando product es null
  const { products: relatedRaw } = useProducts({
    categoria: product?.category?.slug || '',
    limit: 4,
  });

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

  const msg =
    product.wa_template ??
    `Hola, me interesa el ${product.name} (${product.slug}).`;

  // Filtrar el producto actual de los relacionados
  const related = relatedRaw.filter((p) => p.id !== product.id).slice(0, 3);

  function handleMainMove(e: React.MouseEvent<HTMLImageElement, MouseEvent>) {
    const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Galería */}
        <div className="grid grid-cols-[92px_1fr] gap-4 items-start">
          {/* Thumbs — sin overflow, sin línea, imagen centrada */}
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
                    "relative shrink-0 w-[92px] rounded-[12px] transition",
                    // fondos suaves; sin bordes ni ring
                    "bg-neutral-100/80 hover:bg-neutral-100",
                    selected ? "bg-neutral-200/90" : "",
                  ].join(" ")}
                >
                  <div className="grid place-items-center w-full h-full p-2">
                    <img
                      src={src}
                      alt={`${product.name} ${idx + 1}`}
                      className="max-w-[90%] max-h-[90%] object-contain"
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Imagen principal */}
          <div className="rounded-3xl overflow-hidden border border-black/10 relative bg-white">
            {/* Badge de AGOTADO */}
            {product.stock <= 0 && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-30">
                AGOTADO
              </div>
            )}

            {/* Flechas */}
            {count > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-white/85 hover:bg-white text-black border shadow z-20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={next}
                  aria-label="Siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-10 w-10 rounded-full bg-white/85 hover:bg-white text-black border shadow z-20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
                onMouseLeave={() => {
                  setHovering(false);
                  setOrigin("50% 50%");
                }}
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
            <h1 className="font-serif text-3xl mt-1">{product.name}</h1>
          </div>

          {product.description && (
            <p className="text-neutral-700 whitespace-pre-line">{product.description}</p>
          )}

          {/* Indicador de stock */}
          <div className="text-sm">
            {product.stock <= 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Producto agotado
              </div>
            ) : product.stock <= product.low_stock_threshold ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                ¡Solo quedan {product.stock} unidades!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Disponible en stock
              </div>
            )}
          </div>

          {product.materials?.length ? (
            <div className="text-sm">
              <span className="font-medium">Materiales: </span>
              <span className="capitalize">
                {product.materials.map((m: any) => typeof m === 'string' ? m : m.name).join(", ")}
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

          <div className="flex flex-wrap gap-3 pt-2">
            {phone ? (
              <WhatsAppButton phone={phone} message={msg} className="mt-1" />
            ) : (
              <div className="rounded-2xl border px-4 py-2 text-xs text-neutral-600">
                Configura <code>VITE_WHATSAPP_PHONE</code> en <code>client/.env</code> para mostrar el botón.
              </div>
            )}

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
        </div>
      </div>

      {/* Relacionados */}
      {related.length ? (
        <section className="mt-12">
          <h2 className="font-serif text-xl mb-4">También te puede gustar</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {related.map((r) => (
              <RelatedCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
