import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useProducts } from "../hooks/useProducts";
import { useEffect, useRef, useState } from "react";
import type { CollectionWithCategory, ProductListItem } from "../types/api";
import * as api from "../services/api";
import BadgeChips from "../components/BadgeChips";


/* =========================
   HERO SLIDES — 3 mensajes rotativos
========================= */
const heroSlides = [
  {
    eyebrow: "NUEVA COLECCIÓN",
    title: "Joyas esenciales,\nelegancia cotidiana",
    sub: "Collares, pulseras y anillos con acabados de alta calidad e hipoalergénicos.",
  },
  {
    eyebrow: "OFERTAS ESPECIALES",
    title: "Hasta 30% de descuento\nen piezas seleccionadas",
    sub: "Aprovecha nuestras promociones por tiempo limitado. Brillo a precio honesto.",
  },
  {
    eyebrow: "ENVÍO A TODO EL PAÍS",
    title: "Tu joya favorita\nllega hasta tu puerta",
    sub: "Empaque cuidado, entrega segura. Escríbenos por WhatsApp y coordinamos.",
  },
];

function HeroSlides() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(s => (s + 1) % heroSlides.length), 4000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[current];

  return (
    <div className="w-full max-w-lg mx-auto text-center flex flex-col">
      {/* Altura fija para que los slides no muevan el layout */}
      <div className="relative" style={{ minHeight: '220px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            <p className="text-xs tracking-[0.25em] text-amber-600 font-medium mb-4">
              {slide.eyebrow}
            </p>
            <h1 className="font-display text-5xl xl:text-6xl font-light tracking-wide text-amber-800 leading-[1.25] whitespace-pre-line">
              {slide.title}
            </h1>
            <p className="mt-5 text-neutral-500 text-sm leading-relaxed">
              {slide.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots — siempre estáticos fuera del AnimatePresence */}
      <div className="flex justify-center gap-2 mt-8">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-amber-700' : 'w-2 bg-amber-200'}`}
          />
        ))}
      </div>
    </div>
  );
}

function HeroSlidesMobile() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent(s => (s + 1) % heroSlides.length), 4000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[current];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full" style={{ minHeight: '120px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-center items-center"
          >
            <p className="text-[10px] tracking-[0.25em] text-amber-300 font-medium mb-2">
              {slide.eyebrow}
            </p>
            <h1 className="font-display text-2xl font-light tracking-wide text-white leading-[1.3] whitespace-pre-line">
              {slide.title}
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-amber-300' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}

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
  const [perView, setPerView] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024 ? 5 : 3);
  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1024 ? 5 : 3);
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
            <h3 className="font-display text-2xl md:text-3xl font-light tracking-widest mb-4 drop-shadow" style={{ color: '#fff8f0' }}>{c.title}</h3>
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
  const img1 = p.image_url ?? "/assets/demo/placeholder.jpg";
  const img2 = p.image_url_2;
  const hasSecondImage = Boolean(img2);
  return (
    <Link to={`/producto/${p.slug}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <div className="group overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          <img
            src={img1}
            alt={p.name}
            className={hasSecondImage
              ? "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out group-hover:opacity-0"
              : "absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            }
            loading="lazy"
            decoding="async"
          />
          {img2 && (
            <img
              src={img2}
              alt=""
              aria-hidden="true"
              fetchPriority="low"
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
            />
          )}
          {p.badge_labels && p.badge_labels.length > 0 && (
            <div className="absolute bottom-2 left-2 z-10 scale-75 sm:scale-100 origin-bottom-left">
              <BadgeChips badges={p.badge_labels} size="lg-card" />
            </div>
          )}
        </div>
        <div className="pt-3 pb-1">
          <h3 className="font-display text-sm font-light tracking-wide leading-snug line-clamp-2">{p.name}</h3>
          <p className="text-xs text-neutral-400 capitalize mt-0.5">{p.category}</p>
        </div>
      </div>
    </Link>
  );
}

/* =========================
   CARRUSEL DESTACADOS
========================= */
const translateX = (pos: number, perView: number, gap: number, mobile = false) =>
  mobile
    ? `translateX(calc(-${pos} * ((100vw - ${gap * 4}px) / 3 + ${gap}px)))`
    : `translateX(calc(-${pos} * (100% / ${perView} + ${gap / perView}px)))`;

function FeaturedCarousel({ products, perView }: { products: ProductListItem[], perView: number }) {
  const GAP = 16;
  const total = products.length;
  const looped = [...products, ...products, ...products];
  const isDesktop = perView === 5;

  const trackRef = useRef<HTMLDivElement>(null);
  // índice real en el array triplicado — empieza en el bloque central
  const posRef = useRef(total);
  const animating = useRef(false);

  // Mueve el track sin transición (reposicionamiento silencioso)
  const jumpTo = (pos: number) => {
    const track = trackRef.current;
    if (!track) return;
    posRef.current = pos;
    track.style.transition = 'none';
    track.style.transform = translateX(pos, perView, GAP, !isDesktop);
    track.getBoundingClientRect(); // forzar reflow
  };

  // Mueve con transición animada
  const slideTo = (pos: number) => {
    const track = trackRef.current;
    if (!track) return;
    posRef.current = pos;
    track.style.transition = 'transform 500ms ease-in-out';
    track.style.transform = translateX(pos, perView, GAP, !isDesktop);
  };

  const advance = (dir: 1 | -1) => {
    if (animating.current) return;
    animating.current = true;
    slideTo(posRef.current + dir);
  };

  const onTransitionEnd = () => {
    animating.current = false;
    // Si salimos del bloque central, reposicionar sin animación
    let pos = posRef.current;
    if (pos >= total * 2) pos -= total;
    if (pos < total) pos += total;
    if (pos !== posRef.current) jumpTo(pos);
  };

  // Auto-avance solo en desktop — en mobile el usuario navega manualmente
  useEffect(() => {
    if (!isDesktop) return;
    // sin auto-avance en desktop tampoco — solo botones
  }, []);

  // Touch
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const onTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd = () => { if (Math.abs(touchDeltaX.current) > 40) advance(touchDeltaX.current < 0 ? 1 : -1); };

  // En mobile: 2 cards visibles + peek de la 3ra, sin padding lateral
  const mobileItemW = `calc((100vw - 16px * 4) / 3)`; // 3 cards + 4 gaps de 16px
  const desktopItemW = `calc(100% / ${perView} - ${GAP * (perView - 1) / perView}px)`;

  return (
    <div
      className={`relative mt-6 overflow-hidden ${!isDesktop ? '-mx-4' : ''}`}
      onTouchStart={!isDesktop ? onTouchStart : undefined}
      onTouchMove={!isDesktop ? onTouchMove : undefined}
      onTouchEnd={!isDesktop ? onTouchEnd : undefined}
    >
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{
          gap: GAP,
          paddingLeft: !isDesktop ? 16 : 0,
          transform: translateX(total, perView, GAP, !isDesktop),
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {looped.map((p, i) => (
          <div key={`${p.id}-${i}`} className="shrink-0" style={{ width: isDesktop ? desktopItemW : mobileItemW }}>
            <FeaturedCard p={p} />
          </div>
        ))}
      </div>

      {/* Flechas desktop: sólidas */}
      {isDesktop && (
        <>
          <button type="button" onClick={() => advance(-1)} aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 hover:bg-neutral-100 transition p-2 z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" onClick={() => advance(1)} aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow ring-1 ring-black/10 hover:bg-neutral-100 transition p-2 z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}
      {/* Flechas mobile: semitransparentes */}
      {!isDesktop && (
        <>
          <button type="button" onClick={() => advance(-1)} aria-label="Anterior"
            className="absolute left-1 top-1/3 -translate-y-1/2 rounded-full bg-white/40 backdrop-blur-sm hover:bg-white/60 transition p-1.5 z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" onClick={() => advance(1)} aria-label="Siguiente"
            className="absolute right-1 top-1/3 -translate-y-1/2 rounded-full bg-white/40 backdrop-blur-sm hover:bg-white/60 transition p-1.5 z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}
    </div>
  );
}

/* =========================
   FEATURED SECTION — lógica desktop/mobile
========================= */
function FeaturedSection({ products }: { products: ProductListItem[] }) {
  const perView = usePerView(); // 5 en desktop, 3 en mobile

  const needsCarousel = products.length > perView;

  if (needsCarousel) return <FeaturedCarousel products={products} perView={perView} />;

  return (
    <div className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-5">
      {products.slice(0, perView).map((p) => (
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
      <section className="h-[40dvh] lg:h-[calc(100dvh-96px)] flex flex-col lg:flex-row">
        {/* Lado izquierdo: texto rotante (solo desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#f5efe6] flex-col justify-center items-center px-16 xl:px-24 text-center">
          <HeroSlides />
        </div>

        {/* Lado derecho: imagen (full en mobile, mitad en desktop) */}
        <div className="relative w-full h-full lg:w-1/2">
          <img
            src="/assets/home/main-1.jpg"
            alt="Alahas — joyas esenciales"
            className="w-full h-full object-cover object-center"
          />
          {/* Overlay + texto rotativo solo en mobile */}
          <div className="absolute inset-0 bg-black/55 lg:hidden" />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 lg:hidden">
            <HeroSlidesMobile />
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section id="destacados" className="mx-auto max-w-7xl px-4 py-14 scroll-mt-12">
        <div className="flex justify-end mb-4">
          <Link to="/productos" className="text-xs tracking-widest border border-neutral-300 px-4 py-1.5 text-neutral-500 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200">
            TODOS
          </Link>
        </div>

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
          <FeaturedSection products={featuredProducts} />
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
            <h2 className="font-display text-2xl font-light tracking-wide">Colecciones</h2>
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
          <h3 className="font-display text-3xl md:text-4xl font-light tracking-wide mt-1">Felices con su brillo ✨</h3>
          <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
            Un vistazo a entregas, looks del día y reviews reales.
          </p>
        </div>
        <InfiniteGalleryCarousel images={carouselImages} height={240} speedSec={32} />
      </section>

    </>
  );
}
