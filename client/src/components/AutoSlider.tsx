import { useState, useEffect } from "react";

/** Carrusel automático de imágenes con fade, mismo criterio en toda la marca. */
export default function AutoSlider({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images?.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), 3000);
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
