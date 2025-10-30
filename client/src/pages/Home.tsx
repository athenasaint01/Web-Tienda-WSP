import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ImagesSlider } from "../components/ui/images-slider";
import { waLink } from "../lib/wa";
import ProductCard from "../components/ProductCard";
import { featuredProducts } from "../data/products";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FacebookIcon } from "lucide-react";

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
    <div className={`relative overflow-hidden rounded-3xl border ${className}`}>
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
    <div className="h-full min-h-[320px] md:min-h-[360px] rounded-3xl border border-white/10 p-8 lg:p-12 bg-neutral-900 text-white flex items-center">
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
      className="relative overflow-hidden rounded-3xl bg-white"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <div
        ref={trackRef}
        className="flex gap-4 will-change-transform"
        style={{ width: "max-content", padding: "12px 16px", transform: "translate3d(0,0,0)" }}
      >
        {[...images, ...images].map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="shrink-0 overflow-hidden rounded-2xl"
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
type CollectionItem = { name: string; slug: string; img: string };

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

  const groupVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.18, ease: "easeOut" } },
  } as const;

  const next = () => {
    setDirection(1);
    setStart(s => (s + 1) % items.length);
  };
  const prev = () => {
    setDirection(-1);
    setStart(s => (s - 1 + items.length) % items.length);
  };

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={`${start}-${perView}`}
          custom={direction}
          variants={groupVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {windowItems.map((c, i) => (
            <Link
              key={`${c.slug}-${i}`}
              to={`/productos?categoria=${c.slug}`}
              className="relative overflow-hidden rounded-3xl"
            >
              <img
                src={c.img}
                alt={c.name}
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
                {c.name}
              </span>
            </Link>
          ))}
        </motion.div>
      </AnimatePresence>

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

  return (
    <>
      {/* HERO */}
      <section className="relative">
        <ImagesSlider images={heroImages} className="h-[75vh] md:h-[82vh] rounded-none">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="max-w-2xl text-left">
                <p className="font-script text-white/90 text-3xl md:text-4xl leading-none">Alaha’s</p>
                <h1 className="mt-2 font-serif text-4xl md:text-6xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
                  Joyas esenciales, elegancia cotidiana
                </h1>
                <p className="mt-4 text-neutral-200">
                  Collares, pulseras y anillos con acabados de alta calidad e hipoalergénicos.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/productos"
                    className="rounded-full px-6 py-3 bg-white text-black text-sm font-medium hover:opacity-90"
                  >
                    Ver productos
                  </Link>
                  {phone && (
                    <a
                      href={waLink(phone, "Hola, ¿me ayudas a elegir un accesorio? ✨")}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-6 py-3 border border-white/70 text-white text-sm font-medium hover:bg-white/10"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </ImagesSlider>
      </section>

      {/* Beneficios */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 md:grid-cols-3">
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
      </section>

      {/* Colecciones */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Colecciones</h2>
          <Link to="/productos" className="text-sm underline underline-offset-4 hover:opacity-80">
            Ver todo
          </Link>
        </div>

        <div className="mt-6">
          <CollectionsCarouselFader
            items={[
              { name: "Collares", slug: "collares", img: "/assets/cat-collar.jpg" },
              { name: "Pulseras", slug: "pulseras", img: "/assets/cat-pulsera.jpg" },
              { name: "Ropa", slug: "ropa", img: "/assets/cat-ropa.jpg" },
              { name: "Anillos y aros", slug: "anillos", img: "/assets/cat-anillo.jpg" },
              { name: "Dijes", slug: "dijes", img: "/assets/cat-dije.jpg" },
              { name: "Aretes", slug: "aretes", img: "/assets/cat-arete.jpg" },
              { name: "Pashminas y bufandas", slug: "bufandas", img: "/assets/cat-bufanda.jpg" },
            ]}
          />
        </div>
      </section>

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
              className="h-full min-h-[520px]"
              imgClassName="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-serif text-2xl">Destacados</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Editorial */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl overflow-hidden border">
            <img src="/assets/demo/hero-1.jpg" alt="Editorial Alaha's" className="w-full h-full object-cover" />
          </div>
          <div className="rounded-3xl border p-8 flex items-center">
            <div>
              <h3 className="font-serif text-xl">Hecho para acompañarte</h3>
              <p className="text-neutral-600 mt-3">
                Accesorios atemporales que complementan tu estilo sin esfuerzo.
                Ligeros, cómodos y con acabados que perduran.
              </p>
              <div className="mt-6 flex gap-3">
                <Link to="/nosotros" className="rounded-full px-6 py-3 border text-sm font-medium hover:bg-neutral-50">
                  Conócenos
                </Link>
                <Link to="/productos" className="rounded-full px-6 py-3 bg-black text-white text-sm font-medium hover:opacity-90">
                  Explorar
                </Link>
              </div>
            </div>
          </div>
        </div>
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
