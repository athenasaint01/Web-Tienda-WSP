import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const brilloSliderImages = [
  "/assets/home/main-1.jpg",
  "/assets/home/main-2.jpg",
  "/assets/home/main-3.jpg",
  "/assets/home/main-4.jpg",
];

function AutoSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images?.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 3000);
    return () => clearInterval(id);
  }, [images]);

  return (
    <div className="relative overflow-hidden rounded-2xl h-full">
      <div className="relative aspect-[3/4] md:aspect-[4/5] w-full h-full">
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={`Slide ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
    </div>
  );
}

export default function Marca() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid items-stretch gap-4 md:grid-cols-5"
      >
        {/* Texto */}
        <div className="md:col-span-3 h-full min-h-[320px] md:min-h-[360px] rounded-2xl p-8 lg:p-12 bg-neutral-900 text-white flex items-center">
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

        {/* Slider */}
        <div className="md:col-span-2">
          <AutoSlider images={brilloSliderImages} />
        </div>
      </motion.div>
    </div>
  );
}
