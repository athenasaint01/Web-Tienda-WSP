import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function ProductCard({ p }: { p: Product }) {
  const img = p.images?.[0] ?? "/assets/demo/placeholder.jpg";

  // --- Tilt 3D (solo en dispositivos con puntero fino) ---
  const [enableTilt, setEnableTilt] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setEnableTilt(window.matchMedia("(pointer: fine)").matches);
    }
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0); // rotateX
  const tiltY = useMotionValue(0); // rotateY
  const rx = useSpring(tiltX, { stiffness: 150, damping: 18 });
  const ry = useSpring(tiltY, { stiffness: 150, damping: 18 });
  const MAX_TILT = 6; // grados

  function handleMouseMove(e: React.MouseEvent) {
    if (!enableTilt) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;  // 0..1
    const py = (e.clientY - rect.top) / rect.height;  // 0..1
    const rX = -(py - 0.5) * (MAX_TILT * 2);          // arriba/abajo
    const rY =  (px - 0.5) * (MAX_TILT * 2);          // izq/der
    tiltX.set(rX);
    tiltY.set(rY);
  }

  function handleMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <motion.article
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        rotateX: enableTilt ? rx : 0,
        rotateY: enableTilt ? ry : 0,
        transformPerspective: 900,
      }}
      className="group rounded-3xl overflow-hidden border bg-white will-change-transform"
    >
      <Link to={`/producto/${p.slug}`} className="block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="relative">
          <img
            src={img}
            alt={p.name}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* velo para realzar tipografía al hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg leading-tight">{p.name}</h3>
          <p className="text-xs text-neutral-500 capitalize">{p.category}</p>
        </div>
      </Link>
    </motion.article>
  );
}
