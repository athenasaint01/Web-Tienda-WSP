import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ImagesSliderProps = {
  images: string[];
  intervalMs?: number;
  className?: string;
  children?: React.ReactNode; // overlay (títulos/CTAs)
};

export function ImagesSlider({
  images,
  intervalMs = 4000,
  className = "",
  children,
}: ImagesSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl ${className}`}>
      {/* fondo/overlay para legibilidad del texto */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      <AnimatePresence mode="wait">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </AnimatePresence>

      {/* Contenido encima del slider (títulos/CTAs) */}
      <div className="relative z-20 h-full w-full flex items-center justify-center px-4">
        {children}
      </div>

      {/* Dots de navegación */}
      <div className="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir al slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 w-6 rounded-full ${
              i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
