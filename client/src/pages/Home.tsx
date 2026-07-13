import { Link } from "react-router-dom";

import { useProducts } from "../hooks/useProducts";
import { useEffect, useRef, useState } from "react";
import type { CollectionWithCategory, ProductListItem } from "../types/api";
import * as api from "../services/api";
import BadgeChips from "../components/BadgeChips";




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

      pos -= speedPx * dt;
      if (pos <= -half) pos += half;
      track.style.transform = `translate3d(${Math.round(pos * 100) / 100}px,0,0)`;

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
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#faf4ee] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#faf4ee] to-transparent z-10" />

      <div
        ref={trackRef}
        className="flex gap-4 will-change-transform"
        style={{ width: "max-content", padding: "12px 16px", transform: "translate3d(0,0,0)" }}
      >
        {[...images, ...images].map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="shrink-0 overflow-hidden rounded-lg"
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
  const [perView, setPerView] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024 ? 5 : 2);
  useEffect(() => {
    const update = () => setPerView(window.innerWidth >= 1024 ? 5 : 2);
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
            className="w-full aspect-[4/3] md:aspect-[16/9] object-cover" style={{ objectPosition: '50% 73%' }}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Brillo que barre de izquierda a derecha solo en hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
            <span className="inline-block bg-[#d4a58a]/80 backdrop-blur-sm text-white text-xs tracking-widest px-6 py-2.5 group-hover:bg-[#c4927a]/90 transition-colors duration-300 font-display font-light">
              {c.title}
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
            <div className="absolute bottom-2 right-2 z-10 scale-[0.80] sm:scale-100 origin-bottom-right">
              <BadgeChips badges={p.badge_labels} size="lg-card" />
            </div>
          )}
        </div>
        <div className="pt-3 pb-1 px-2">
          <h3 className="font-display text-xs font-light tracking-widest leading-snug line-clamp-2 uppercase">{p.name}</h3>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">{p.category}</p>
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
    ? `translateX(calc(-${pos} * ((100vw - ${gap * 3}px) / 2 + ${gap}px)))`
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
  const mobileItemW = `calc((100vw - 16px * 3) / 2)`; // 2 cards + 3 gaps de 16px
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

      {/* Flechas desktop */}
      {isDesktop && (
        <>
          <button type="button" onClick={() => advance(-1)} aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-amber-50/70 backdrop-blur-sm ring-1 ring-amber-200/50 hover:bg-amber-100/80 transition p-2 z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#92714a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" onClick={() => advance(1)} aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-amber-50/70 backdrop-blur-sm ring-1 ring-amber-200/50 hover:bg-amber-100/80 transition p-2 z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#92714a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </>
      )}
      {/* Flechas mobile */}
      {!isDesktop && (
        <>
          <button type="button" onClick={() => advance(-1)} aria-label="Anterior"
            className="absolute left-1 top-1/3 -translate-y-1/2 rounded-full bg-amber-50/60 backdrop-blur-sm ring-1 ring-amber-200/40 hover:bg-amber-100/75 transition p-1.5 z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#92714a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" onClick={() => advance(1)} aria-label="Siguiente"
            className="absolute right-1 top-1/3 -translate-y-1/2 rounded-full bg-amber-50/60 backdrop-blur-sm ring-1 ring-amber-200/40 hover:bg-amber-100/75 transition p-1.5 z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#92714a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
      {/* HERO — banner completo */}
      <section className="relative h-[40dvh] lg:h-[calc(100dvh-96px)] overflow-hidden">
        <picture>
          <source media="(min-width: 1024px)" srcSet="/images/hero-banner.webp" />
          <source media="(max-width: 1023px)" srcSet="/images/hero-banner-mobile.webp" />
          <img
            src="/images/hero-banner.webp"
            alt="Alahas — joyas esenciales"
            className="absolute inset-0 w-full h-full object-cover object-bottom"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </section>

      {/* Destacados */}
      <section id="destacados" className="mx-auto max-w-7xl px-4 py-6 lg:py-14 scroll-mt-12">
        <div className="flex justify-end mb-2 lg:mb-4">
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
        <section className="mx-auto max-w-7xl px-4 py-6 lg:py-14">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-light tracking-wide">Colecciones</h2>
            <Link to="/productos" className="text-xs tracking-widest border border-neutral-300 px-4 py-1.5 text-neutral-500 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50 transition-all duration-200">
              TODOS
            </Link>
          </div>

          <div className="mt-3 lg:mt-6">
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
      <section className="mx-auto max-w-7xl px-4 pt-1 pb-1 lg:pt-0 lg:pb-4">
        <div className="text-center mb-4 lg:mb-6">
          <p className="text-sm tracking-widest text-amber-600">NUESTRAS CLIENTAS</p>
          <h3 className="font-display text-lg md:text-2xl font-light tracking-wide mt-1 uppercase">Felices con su brillo</h3>
        </div>
        <InfiniteGalleryCarousel images={carouselImages} height={240} speedSec={32} />
      </section>

    </>
  );
}
