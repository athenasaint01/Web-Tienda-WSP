import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Shield,
  Leaf,
  Gem,
  Shirt,
  Package,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* =============== */
/*  Acordeón FAQ   */
/* =============== */
function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[#4a4438]/15 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-[#faf4ee] focus-visible:outline-none"
      >
        <span className="font-medium text-[#4a4438]">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#4a4438]/60 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-4 pb-4 text-[#4a4438]/80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Nosotros() {
  useEffect(() => {
    document.title = "Nosotros — Alahas | Nuestra historia";
    document.querySelector('meta[name="description"]')
      ?.setAttribute("content", "Conoce la historia de Alahas, joyería fina peruana. Nuestro compromiso con la calidad, el diseño y el brillo que te mereces.");
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* HERO historia + imagen */}
      <section className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-[#c4927a] text-white p-8 md:p-12 flex items-center">
          <div>
            <p className="text-white/80 tracking-widest text-xs font-medium">NUESTRA HISTORIA</p>
            <h1 className="font-display text-4xl md:text-5xl font-light tracking-wide mt-2">
              Alaha’s nació para acercar el brillo a todos
            </h1>
            <p className="mt-4 text-white/90">
              Empezamos con una idea simple:{" "}
              <span className="font-medium text-white">accesorios de buena calidad</span> a
              precios realmente cómodos, pensados para el día a día. Queríamos que cada pieza
              conecte con quien la usa; que cuente una historia sin complicaciones, con
              materiales confiables y acabados que perduran.
            </p>
            <p className="mt-3 text-white/90">
              Hoy seguimos ese camino —y damos un paso más— integrando{" "}
              <span className="font-medium text-white">prendas y ropa</span> que complementan nuestros accesorios.
              Un mismo lenguaje: elegancia cotidiana, precios honestos y cercanía con nuestra comunidad.
            </p>

            {/* Microbadges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs bg-[#4a4438]/20 text-white ring-1 ring-white/30">
                Curaduría Alaha’s
              </span>
              <span className="px-3 py-1 text-xs bg-[#4a4438]/20 text-white ring-1 ring-white/30">
                Precio honesto
              </span>
              <span className="px-3 py-1 text-xs bg-[#4a4438]/20 text-white ring-1 ring-white/30">
                Hipoalergénicos
              </span>
              <span className="px-3 py-1 text-xs bg-[#4a4438]/20 text-white ring-1 ring-white/30">
                Envíos con cuidado
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden border border-[#4a4438]/15">
          <img
            src="/assets/home/main-1.jpg"
            alt="Alaha’s: elegancia cotidiana"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Giro hacia ropa */}
      <section className="mt-16 grid md:grid-cols-2 gap-6 items-center">
        <div className="overflow-hidden border border-[#4a4438]/15">
          <img
            src="/assets/home/main-4.jpg"
            alt="Prendas y accesorios Alaha’s"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="border border-[#4a4438]/15 p-8 md:p-10">
          <div className="flex items-center gap-2 text-[#92714a]">
            <Shirt className="h-5 w-5" />
            <span className="text-sm tracking-wide font-medium">COLECCIONES DE ROPA</span>
          </div>
          <h2 className="font-display text-2xl font-light tracking-wide mt-2 text-[#4a4438]">Del accesorio a la prenda: un mismo estilo</h2>
          <p className="mt-3 text-[#4a4438]/80">
            Sumamos prendas cómodas y con carácter para completar tu look: polos, buzos, básicos
            esenciales y piezas con detalles que marcan la diferencia. La misma promesa de siempre:
            <span className="font-medium text-[#4a4438]"> calidad, diseño y precio justo</span>.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-[#4a4438]/80 list-disc pl-4">
            <li>Fibras pensadas para uso diario y buen tacto.</li>
            <li>Ediciones pequeñas para mantener la curaduría del catálogo.</li>
            <li>Prendas que combinan perfecto con nuestras joyas.</li>
          </ul>
        </div>
      </section>

      {/* Curaduría & Marcas Aliadas */}
      <section className="mt-16 border border-[#4a4438]/15 p-8 md:p-10">
        <div className="flex items-center gap-2 text-[#92714a]">
          <Gem className="h-5 w-5" />
          <span className="text-sm tracking-wide font-medium">CURADURÍA & MARCAS ALIADAS</span>
        </div>

        <h2 className="font-display text-2xl font-light tracking-wide mt-2 text-[#4a4438]">
          Seleccionamos lo mejor para que te quede mejor
        </h2>

        <p className="mt-3 text-[#4a4438]/80 max-w-3xl">
          En Alaha’s <span className="font-medium text-[#4a4438]">no todo es fabricación propia</span>. También trabajamos
          con <span className="font-medium text-[#4a4438]">talleres y marcas aliadas</span> que cumplen nuestros criterios de{" "}
          <span className="font-medium text-[#4a4438]">calidad, confort e hipoalergenicidad</span>. Cada pieza pasa por nuestra{" "}
          <span className="font-medium text-[#4a4438]">curaduría y control de acabados</span> antes de llegar a ti.
          Así unimos lo mejor de ambos mundos: <span className="font-medium text-[#4a4438]">diseño accesible</span> y{" "}
          <span className="font-medium text-[#4a4438]">experiencia cuidada</span>.
        </p>

        {/* Valores / pilares */}
        <ul className="mt-5 grid gap-3 md:grid-cols-4">
          <li className="group border border-[#4a4438]/20 bg-[#c4927a] text-white p-4 transition-all duration-300 hover:bg-white hover:text-[#4a4438] hover:border-[#4a4438]/30 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#92714a]" />
              <span>Estándares de calidad</span>
            </div>
            <p className="mt-1 text-white/80 text-sm transition-colors duration-300 group-hover:text-[#4a4438]/70">
              Control de acabados y pruebas de uso real.
            </p>
          </li>

          <li className="group border border-[#4a4438]/20 bg-[#c4927a] text-white p-4 transition-all duration-300 hover:bg-white hover:text-[#4a4438] hover:border-[#4a4438]/30 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#92714a]" />
              <span>Curaduría responsable</span>
            </div>
            <p className="mt-1 text-white/80 text-sm transition-colors duration-300 group-hover:text-[#4a4438]/70">
              Seleccionamos piezas que combinan, duran y favorecen.
            </p>
          </li>

          <li className="group border border-[#4a4438]/20 bg-[#c4927a] text-white p-4 transition-all duration-300 hover:bg-white hover:text-[#4a4438] hover:border-[#4a4438]/30 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#92714a]" />
              <span>Precio honesto</span>
            </div>
            <p className="mt-1 text-white/80 text-sm transition-colors duration-300 group-hover:text-[#4a4438]/70">
              Calidad accesible y transparente. Sin sorpresas.
            </p>
          </li>

          <li className="group border border-[#4a4438]/20 bg-[#c4927a] text-white p-4 transition-all duration-300 hover:bg-white hover:text-[#4a4438] hover:border-[#4a4438]/30 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Leaf className="h-4 w-4 text-white/80 transition-colors duration-300 group-hover:text-[#92714a]" />
              <span>Amables con tu piel</span>
            </div>
            <p className="mt-1 text-white/80 text-sm transition-colors duration-300 group-hover:text-[#4a4438]/70">
              Piezas hipoalergénicas y cómodas para el día a día.
            </p>
          </li>
        </ul>


        <p className="mt-4 text-xs text-[#4a4438]/60">
          Nota de transparencia: Algunas piezas pertenecen a{" "}
          <span className="font-medium">marcas aliadas</span>. Alaha’s realiza la{" "}
          <span className="font-medium">curaduría</span> y el{" "}
          <span className="font-medium">control de calidad</span> para asegurar el estándar de la tienda,
          manteniendo precios cómodos y garantía de satisfacción.
        </p>
      </section>

      {/* FAQ con animación */}
      <section className="mt-14">
        <h3 className="font-display text-xl font-light tracking-wide mb-4 text-[#4a4438]">Preguntas frecuentes</h3>
        <div className="grid gap-3">
          <FaqItem q="¿Todos los productos son de fabricación propia?">
            No necesariamente. Combinamos fabricación propia con una{" "}
            <span className="font-medium">curaduría de marcas aliadas</span> que cumplen nuestros
            criterios de calidad, confort y precio honesto.
          </FaqItem>

          <FaqItem q="¿Cómo aseguran la calidad?">
            Cada pieza pasa por revisión de materiales y acabados, y priorizamos
            opciones <span className="font-medium">hipoalergénicas</span> y cómodas para uso diario.
          </FaqItem>

          <FaqItem q="¿Por qué los precios son accesibles?">
            Optimizamos el catálogo a ediciones pequeñas y una cadena de valor eficiente.
            Mantenemos <span className="font-medium">precios honestos</span> sin sacrificar la experiencia.
          </FaqItem>
        </div>
      </section>

      {/* Manifiesto / Cita + CTAs */}
      <section className="mt-14 text-center">
        <blockquote className="font-display font-light text-2xl md:text-3xl tracking-wide text-[#4a4438]">
          “Elegancia cotidiana, precios honestos y una relación cercana. Eso es Alaha’s.”
        </blockquote>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/productos"
            className="px-6 py-3 bg-[#c4927a] text-white text-sm font-medium hover:opacity-90"
          >
            Explorar catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
