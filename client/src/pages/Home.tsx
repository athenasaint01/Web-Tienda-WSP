import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ImagesSlider } from "../components/ui/images-slider";
import { waLink } from "../lib/wa";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useProducts";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FacebookIcon } from "lucide-react";
import type { CollectionWithCategory } from "../types/api";
import * as api from "../services/api";

/* =========================
   HERO
========================= */
const heroImages = [
  "https://images.unsplash.com/photo-1485433592409-9018e83a1f0d?q=80&w=1814&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.0.3",
  "https://images.unsplash.com/photo-1482189349482-3defd547e0e9?q=80&w=2848&auto=format&fit=crop&ixlib=rb-4.0.3",
];

/* =========================
   SLIDER AUTO (sin botones)
========================= */
type AutoSliderProps = {
  images: string[];
  intervalMs?: number;
  className?: string;
  imgClassName?: string;
  aspectClass?: string;
};

function AutoSlider({
  images,
  intervalMs = 3000,
  className = "",
  imgClassName = "",
  aspectClass = "aspect-[4/5]",
}: AutoSliderProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images?.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images, intervalMs]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div className={`relative ${aspectClass} w-full`}>
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={`Slide ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              i === idx ? "opacity-100" : "opacity-0"
            } ${imgClassName}`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================
   IMÁGENES DEMO
========================= */
const brilloSliderImages = [
  "/assets/home/main-1.jpg",
  "/assets/home/main-2.jpg",
  "/assets/home/main-3.jpg",
  "/assets/home/main-4.jpg",
];

const carouselImages = [
  "/assets/clients/cliente-1.jpg",
  "/assets/clients/cliente-2.jpg",
  "/assets/clients/cliente-3.jpg",
  "/assets/clients/cliente-4.jpg",
  "/assets/clients/cliente-5.jpg",
  "/assets/clients/cliente-6.jpg",
  "/assets/clients/cliente-7.jpg",
  "/assets/clients/cliente-8.jpg",
  "/assets/clients/cliente-9.jpg",
  "/assets/clients/cliente-10.jpg",
  "/assets/clients/cliente-11.jpg",
  "/assets/clients/cliente-12.jpg"
];

/* =========================
   BLOQUE DE MENSAJE
========================= */
function BrilloTextBlock() {
  return (
    <div className="h-full min-h-[320px] md:min-h-[360px] rounded-2xl p-8 lg:p-12 bg-neutral-900 text-white flex items-center">
      <div>
        <div className="inline-flex items-center gap-2 text-amber-300">
          <span className="text-lg">✦</span>
          <span className="text-sm tracking-wide font-medium">COLECCIÓN DESTACADA</span>
          <span className="text-lg">✦</span>
        </div>

        <h2 className="mt-2 font-serif text-3xl md:text-5xl leading-tight">
          No limites tu{" "}
          <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-emerald-200">
            brillo
          </span>
        </h2>

        <p className="mt-4 text-neutral-300 max-w-xl">
          Piezas versátiles, hipoalergénicas y listas para elevar tu look en segundos.
          Combina texturas, juega con capas y expresa tu estilo sin esfuerzo.
        </p>

        <ul className="mt-6 grid gap-3 text-neutral-200">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            Acabados de alta duración para uso diario.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            Libre de níquel: amable con tu piel.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            Diseños que combinan con todo.
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/productos"
            className="rounded-full px-6 py-3 bg-white text-black text-sm font-medium hover:bg-neutral-200"
          >
            Ver productos
          </Link>
          <Link
            to="/nosotros"
            className="rounded-full px-6 py-3 border border-white/30 text-white text-sm font-medium hover:bg-white/10"
          >
            Conócenos
          </Link>
        </div>
      </div>
    </div>
  );
}


/* =========================
   Carrusel infinito de clientas
========================= */
function InfiniteGalleryCarousel({
  images,
  height = 220,
  speedSec = 30,
}: {
  images: string[];
  height?: number;
  speedSec?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const cardW = Math.round((height * 3) / 4);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let pos = 0;
    let prev = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      const half = track.scrollWidth / 2;
      const speedPx = half / speedSec;

      if (!pausedRef.current) {
        pos -= speedPx * dt;
        if (pos <= -half) pos += half;
        track.style.transform = `translate3d(${pos}px,0,0)`;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [images.length, speedSec]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />

      <div
        ref={trackRef}
        className="flex gap-4 will-change-transform"
        style={{ width: "max-content", padding: "12px 16px", transform: "translate3d(0,0,0)" }}
      >
        {[...images, ...images].map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="shrink-0 overflow-hidden rounded-xl"
            style={{ height, width: cardW }}
            aria-hidden={i >= images.length}
          >
            <img
              src={src}
              alt={`Foto ${i + 1}`}
              className="h-full w-full object-cover block select-none"
              draggable={false}
              loading={i < 6 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   Carrusel de Colecciones (fade simple)
========================= */
type CollectionItem = { title: string; categorySlug: string; img: string };

function usePerView() {
  const [perView, setPerView] = useState(3);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return perView;
}

function CollectionsCarouselFader({ items }: { items: CollectionItem[] }) {
  const perView = usePerView();
  const [start, setStart] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const windowItems = Array.from({ length: perView }, (_, k) => items[(start + k) % items.length]);

  const containerVariants = {
    enter: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    center: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 60 : -60,
      scale: 0.9,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -60 : 60,
      scale: 0.9,
    }),
  };

  const next = () => {
    setDirection(1);
    setStart(s => (s + 1) % items.length);
  };
  const prev = () => {
    setDirection(-1);
    setStart(s => (s - 1 + items.length) % items.length);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${start}-${perView}`}
            custom={direction}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            {windowItems.map((c, i) => (
              <motion.div
                key={`${c.categorySlug}-${i}`}
                custom={direction}
                variants={itemVariants}
                transition={{
                  x: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const },
                  opacity: { duration: 0.4, ease: "easeInOut" },
                  scale: { duration: 0.4, ease: "easeOut" },
                }}
              >
                <Link
                  to={`/productos?categoria=${c.categorySlug}`}
                  className="block relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={c.img}
                    alt={c.title}
                    className="aspect-[3/2] w-full object-cover block"
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  {/* Velo desde ARRIBA para dar contraste al badge */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
                  {/* Badge arriba-izquierda */}
                  <span
                    className="absolute top-3 left-3 inline-flex items-center
                              rounded-full bg-white/95 text-black
                              text-xs font-medium px-3 py-1
                              shadow-sm ring-1 ring-black/10"
                  >
                    {c.title}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > perView && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 text-black shadow-sm ring-1 ring-black/10 hover:bg-white transition p-2 focus-visible:outline-none focus-visible:ring-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/95 text-black shadow-sm ring-1 ring-black/10 hover:bg-white transition p-2 focus-visible:outline-none focus-visible:ring-0"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

/* =========================
   HOME
========================= */
export default function Home() {
  const phone = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;

  // Obtener productos destacados desde la API
  const { products: featuredProducts, loading, error } = useProducts({ featured: true, limit: 6 });

  // Obtener colecciones activas
  const [collections, setCollections] = useState<CollectionWithCategory[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await api.getActiveCollections();
        setCollections(data);
      } catch (error) {
        console.error('Error al cargar colecciones:', error);
      } finally {
        setCollectionsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <>
      {/* HERO + BENEFICIOS (100vh en desktop) */}
      <section className="relative overflow-hidden md:h-[calc(100vh-64px)]">
        <ImagesSlider images={heroImages} className="h-[75vh] md:h-[calc(100vh-184px)]">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="max-w-2xl text-left">
                <p className="font-script text-white/90 text-3xl md:text-4xl leading-none">Alaha's</p>
                <h1 className="mt-2 font-serif text-4xl md:text-6xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
                  Joyas esenciales, elegancia cotidiana
                </h1>
                <p className="mt-4 text-neutral-200">
                  Collares, pulseras y anillos con acabados de alta calidad e hipoalergénicos.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/productos"
                    className="rounded-full px-6 py-3 bg-white text-black text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Ver productos
                  </Link>
                  {phone && (
                    <a
                      href={waLink(phone, "Hola, ¿me ayudas a elegir un accesorio? ✨")}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-6 py-3 border border-white/70 text-white text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </ImagesSlider>

        {/* Beneficios */}
        <div className="bg-black text-white md:h-[120px] flex items-center">
          <div className="mx-auto max-w-7xl px-4 py-8 md:py-0 grid gap-6 md:grid-cols-3 w-full">
            {[
              { t: "Hipoalergénicos", d: "Materiales amigables con tu piel." },
              { t: "Durables", d: "Acabados pensados para uso diario." },
              { t: "Versátiles", d: "Diseños para cualquier estilo." },
            ].map((b, i) => (
              <div key={i} className="md:border-l border-white/15 pl-0 md:pl-6 first:md:border-l-0">
                <h3 className="font-serif text-lg">{b.t}</h3>
                <p className="text-neutral-300 mt-1">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Colecciones */}
      {!collectionsLoading && collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Colecciones</h2>
            <Link to="/productos" className="text-sm underline underline-offset-4 hover:opacity-80">
              Ver todo
            </Link>
          </div>

          <div className="mt-6">
            <CollectionsCarouselFader
              items={collections.map(collection => ({
                title: collection.title,
                categorySlug: collection.category_slug,
                img: collection.image_url
              }))}
            />
          </div>
        </section>
      )}

      {/* "No limites tu brillo" (banner más ancho) */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid items-stretch gap-4 md:grid-cols-5">
          <div className="md:col-span-3">
            <BrilloTextBlock />
          </div>
          <div className="md:col-span-2">
            <AutoSlider
              images={brilloSliderImages}
              intervalMs={3000}
              className="h-full"
              imgClassName="object-cover"
              aspectClass="aspect-[3/4] md:aspect-[4/5]"
            />
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-serif text-2xl">Destacados</h2>

        {/* Loading state */}
        {loading && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-[3/4] mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600">Error al cargar productos destacados</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        )}

        {/* Products */}
        {!loading && !error && featuredProducts.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && featuredProducts.length === 0 && (
          <div className="mt-6 p-10 text-center text-gray-500">
            No hay productos destacados disponibles
          </div>
        )}
      </section>

      {/* Carrusel infinito de clientas */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="text-center mb-6">
          <p className="text-sm tracking-widest text-emerald-700">NUESTRAS CLIENTAS</p>
          <h3 className="font-serif text-3xl md:text-4xl mt-1">Felices con su brillo ✨</h3>
          <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
            Un vistazo a entregas, looks del día y reviews reales.
          </p>
        </div>
        <InfiniteGalleryCarousel images={carouselImages} height={240} speedSec={32} />
      </section>

      {/* Franja: Facebook */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-10 text-center">
          <p className="text-lg md:text-xl mb-4">
            También puedes encontrarnos en <span className="font-semibold">Facebook</span>
          </p>
          <a
            href="https://www.facebook.com/alahasoficial"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            <FacebookIcon className="h-5 w-5" />
            Ir a Facebook
          </a>
        </div>
      </section>
    </>
  );
}
