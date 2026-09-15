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
    <div className="relative overflow-hidden h-full">
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
  useEffect(() => {
    document.title = "Marca — Alahas | Joyería con identidad";
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", "Descubre la identidad de Alahas: una marca de joyería fina peruana con diseño propio y materiales de calidad.");
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid items-stretch gap-4 md:grid-cols-5"
      >
        {/* Texto */}
        <div className="md:col-span-3 h-full min-h-[320px] md:min-h-[360px] p-8 lg:p-12 text-[#4a4438] flex items-center border border-[#4a4438]/15">
          <div>
            <p className="text-[#c4927a] tracking-widest text-xs font-medium">COLECCIÓN DESTACADA</p>

            <h2 className="mt-2 font-serif font-bold text-3xl md:text-5xl tracking-wide leading-tight text-[#4a4438]">
              No limites tu <span className="italic text-[#c4927a]">brillo</span>
            </h2>
            <span className="block w-14 h-0.5 bg-[#c4927a] mt-4" />

            <p className="mt-4 text-[#4a4438]/80 max-w-xl text-justify">
              Piezas versátiles, hipoalergénicas y listas para elevar tu look en segundos.
              Combina texturas, juega con capas y expresa tu estilo sin esfuerzo.
            </p>

            <ul className="mt-6 grid gap-3 text-[#4a4438]/80">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#c4927a]" />
                Acabados de alta duración para uso diario.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#c4927a]" />
                Libre de níquel: amable con tu piel.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#c4927a]" />
                Diseños que combinan con todo.
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/productos"
                className="px-6 py-3 bg-[#4a4438] text-white text-sm font-medium hover:opacity-90"
              >
                Ver productos
              </Link>
              <Link
                to="/nosotros"
                className="px-6 py-3 border border-[#4a4438]/30 text-[#4a4438] text-sm font-medium hover:bg-[#faf4ee]"
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
