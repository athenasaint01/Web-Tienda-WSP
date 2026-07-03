import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useProducts } from "../hooks/useProducts";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CollectionWithCategory, ProductListItem } from "../types/api";
import * as api from "../services/api";


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
      // Capear dt a 100ms para evitar saltos cuando el tab vuelve del fondo
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      const half = track.scrollWidth / 2;
      const speedPx = half / speedSec;

      if (!pausedRef.current) {
        pos -= speedPx * dt;
        if (pos <= -half) pos += half;
        track.style.transform = `translate3d(${Math.round(pos * 100) / 100}px,0,0)`;
      }

      raf = requestAnimationFrame(loop);
    };

    const onVisible = () => { prev = performance.now(); };
    document.addEventListener('visibilitychange', onVisible);

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
   Grid de Colecciones
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
      {items.map((c, i) => (
        <Link
          key={c.categorySlug}
          to={`/productos?categoria=${c.categorySlug}`}
          className="group relative overflow-hidden block"
        >
          <img
            src={c.img}
            alt={c.title}
            className="w-full aspect-[4/3] md:aspect-[16/9] object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Brillo que barre de izquierda a derecha solo en hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
            <h3 className="font-serif text-2xl md:text-3xl mb-4 drop-shadow" style={{ color: '#fff8f0' }}>{c.title}</h3>
            <span className="inline-block bg-amber-800 text-white text-xs tracking-widest px-6 py-2.5 group-hover:bg-amber-700 transition-colors duration-300">
              SHOP NOW
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* =========================
   CARD DESTACADO (sin bordes, texto limpio)
========================= */
function FeaturedCard({ p }: { p: ProductListItem }) {
  const img = p.image_url || "/assets/demo/placeholder.jpg";
  return (
    <Link to={`/producto/${p.slug}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <div className="group overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          <img
            src={img}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="pt-3 pb-1">
          <h3 className="font-serif text-sm leading-snug line-clamp-2">{p.name}</h3>
          <p className="text-xs text-neutral-400 capitalize mt-0.5">{p.category}</p>
        </div>
      </div>
    </Link>
  );
}

/* =========================
   CARRUSEL DESTACADOS
========================= */
function FeaturedCarousel({ products }: { products: ProductListItem[] }) {
  const perView = usePerView();
  const visibleCount = perView >= 3 ? 5 : 2;
  const [index, setIndex] = useState(0);
  const total = products.length;

  const next = () => setIndex(s => (s + 1) % total);
  const prev = () => setIndex(s => (s - 1 + total) % total);

  const GAP = 16;

  return (
    <div className="relative mt-6 overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-in-out will-change-transform"
        style={{
          gap: GAP,
          transform: `translateX(calc(-${index} * (100% / ${visibleCount} + ${GAP / visibleCount}px)))`,
        }}
      >
        {[...products, ...products.slice(0, visibleCount)].map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="shrink-0"
            style={{ width: `calc(100% / ${visibleCount} - ${GAP * (visibleCount - 1) / visibleCount}px)` }}
          >
            <FeaturedCard p={p} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 hover:bg-neutral-100 transition p-2 z-10"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Siguiente"
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 hover:bg-neutral-100 transition p-2 z-10"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

/* =========================
   FEATURED SECTION — lógica desktop/mobile
========================= */
function FeaturedSection({ products }: { products: ProductListItem[] }) {
  const perView = usePerView(); // >= 3 = desktop, < 3 = mobile
  const isDesktop = perView >= 3;

  // Desktop: grid 5, carrusel si > 5
  // Mobile:  grid 2, carrusel si >= 3
  const useCarousel = isDesktop ? products.length > 5 : products.length >= 3;

  if (useCarousel) return <FeaturedCarousel products={products} />;

  return (
    <div className={`mt-6 grid gap-4 grid-cols-2 md:grid-cols-5`}>
      {products.slice(0, isDesktop ? 5 : 2).map((p) => (
        <FeaturedCard key={p.id} p={p} />
      ))}
    </div>
  );
}

/* =========================
   HOME
========================= */
export default function Home() {
  // Obtener productos destacados desde la API
  const { products: featuredProducts, loading, error } = useProducts({ featured: true, limit: 20 });

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
      {/* HERO — split layout */}
      <section className="h-[70dvh] lg:h-[100dvh] flex flex-col lg:flex-row">
        {/* Lado izquierdo: texto (solo desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#f5efe6] flex-col justify-center items-center px-16 xl:px-24 text-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-serif text-5xl xl:text-6xl font-semibold text-neutral-900 leading-tight">
              Joyas esenciales,<br />elegancia cotidiana
            </h1>
            <p className="mt-5 text-neutral-500 text-base leading-relaxed max-w-sm mx-auto">
              Collares, pulseras y anillos con acabados de alta calidad e hipoalergénicos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to="/productos"
                className="px-7 py-3 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition"
              >
                Ver colección
              </Link>
              <button
                onClick={() => document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3 border border-neutral-400 text-neutral-700 text-sm font-medium hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition"
              >
                Destacados
              </button>
            </div>
          </motion.div>
        </div>

        {/* Lado derecho: imagen (full en mobile, mitad en desktop) */}
        <div className="relative w-full h-full lg:w-1/2">
          <img
            src="/assets/home/main-1.jpg"
            alt="Alahas — joyas esenciales"
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay + texto solo en mobile */}
          <div className="absolute inset-0 bg-black/60 lg:hidden" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 lg:hidden"
          >
            <h1 className="font-serif text-4xl font-semibold text-white leading-tight">
              Joyas esenciales,<br />elegancia cotidiana
            </h1>
            <p className="mt-3 text-white/70 text-lg leading-relaxed">
              Collares, pulseras y anillos hipoalergénicos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link
                to="/productos"
                className="px-6 py-2.5 bg-white text-black text-sm font-medium hover:opacity-90 transition"
              >
                Ver colección
              </Link>
              <button
                onClick={() => document.getElementById('destacados')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-2.5 border border-white/50 text-white text-sm font-medium hover:bg-white/10 transition"
              >
                Destacados
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destacados */}
      <section id="destacados" className="mx-auto max-w-7xl px-4 py-14 scroll-mt-12">
        <h2 className="font-serif text-2xl">Destacados</h2>

        {loading && (
          <div className="mt-6 grid gap-6 grid-cols-2 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-square mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-red-600">Error al cargar productos destacados</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && featuredProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-0">
              <span />
              <Link to="/productos" className="text-xs tracking-widest border border-neutral-300 px-4 py-1.5 text-neutral-500 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200">
                TODOS
              </Link>
            </div>
            <FeaturedSection products={featuredProducts} />
          </>
        )}

        {!loading && !error && featuredProducts.length === 0 && (
          <div className="mt-6 p-10 text-center text-gray-500">
            No hay productos destacados disponibles
          </div>
        )}
      </section>

      {/* Colecciones */}
      {!collectionsLoading && collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Colecciones</h2>
            <Link to="/productos" className="text-xs tracking-widest border border-neutral-300 px-4 py-1.5 text-neutral-500 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200">
              TODOS
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

      {/* Carrusel infinito de clientas */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="text-center mb-6">
          <p className="text-sm tracking-widest text-amber-600">NUESTRAS CLIENTAS</p>
          <h3 className="font-serif text-3xl md:text-4xl mt-1">Felices con su brillo ✨</h3>
          <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
            Un vistazo a entregas, looks del día y reviews reales.
          </p>
        </div>
        <InfiniteGalleryCarousel images={carouselImages} height={240} speedSec={32} />
      </section>

    </>
  );
}
