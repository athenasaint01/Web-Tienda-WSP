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
  intervalMs = 5000,
  className = "",
  children,
}: ImagesSliderProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => {
        setDirection(1);
        setIndex((i) => (i + 1) % images.length);
      },
      intervalMs
    );
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  const handleDotClick = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const fadeVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* fondo/overlay para legibilidad del texto */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={images[index]}
          src={images[index]}
          alt={`Slide ${index + 1}`}
          className="absolute inset-0 h-full w-full object-cover"
          custom={direction}
          variants={fadeVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.9, ease: [0.4, 0.0, 0.2, 1] as const },
          }}
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
            onClick={() => handleDotClick(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? "bg-white w-8"
                : "bg-white/40 hover:bg-white/70 w-6"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
