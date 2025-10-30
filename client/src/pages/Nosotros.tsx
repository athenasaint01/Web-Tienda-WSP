import { useState } from "react";
import { Link } from "react-router-dom";
import { waLink } from "../lib/wa";
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
    <div className="rounded-2xl border overflow-hidden bg-white">
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
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-neutral-50 focus-visible:outline-none"
      >
        <span className="font-medium text-neutral-900">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-300 ${
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
            <div className="px-4 pb-4 text-neutral-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Nosotros() {
  const phone = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* HERO historia + imagen */}
      <section className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-3xl bg-black text-white p-8 md:p-12 flex items-center">
          <div>
            <p className="text-emerald-400 tracking-widest text-xs">NUESTRA HISTORIA</p>
            <h1 className="font-serif text-4xl md:text-5xl mt-2">
              Alaha’s nació para acercar el brillo a todos
            </h1>
            <p className="mt-4 text-neutral-300">
              Empezamos con una idea simple:{" "}
              <span className="font-medium">accesorios de buena calidad</span> a
              precios realmente cómodos, pensados para el día a día. Queríamos que cada pieza
              conecte con quien la usa; que cuente una historia sin complicaciones, con
              materiales confiables y acabados que perduran.
            </p>
            <p className="mt-3 text-neutral-300">
              Hoy seguimos ese camino —y damos un paso más— integrando{" "}
              <span className="font-medium">prendas y ropa</span> que complementan nuestros accesorios.
              Un mismo lenguaje: elegancia cotidiana, precios honestos y cercanía con nuestra comunidad.
            </p>

            {/* Microbadges */}
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-xs bg-white/10 text-white ring-1 ring-white/20">
                Curaduría Alaha’s
              </span>
              <span className="rounded-full px-3 py-1 text-xs bg-white/10 text-white ring-1 ring-white/20">
                Precio honesto
              </span>
              <span className="rounded-full px-3 py-1 text-xs bg-white/10 text-white ring-1 ring-white/20">
                Hipoalergénicos
              </span>
              <span className="rounded-full px-3 py-1 text-xs bg-white/10 text-white ring-1 ring-white/20">
                Envíos con cuidado
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border">
          <img
            src="/assets/about/story-1.jpg"
            alt="Alaha’s: elegancia cotidiana"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Giro hacia ropa */}
      <section className="mt-16 grid md:grid-cols-2 gap-6 items-center">
        <div className="rounded-3xl overflow-hidden border">
          <img
            src="/assets/about/story-2.jpg"
            alt="Prendas y accesorios Alaha’s"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="rounded-3xl border p-8 md:p-10">
          <div className="flex items-center gap-2 text-emerald-700">
            <Shirt className="h-5 w-5" />
            <span className="text-sm tracking-wide font-medium">COLECCIONES DE ROPA</span>
          </div>
          <h2 className="font-serif text-2xl mt-2">Del accesorio a la prenda: un mismo estilo</h2>
          <p className="mt-3 text-neutral-700">
            Sumamos prendas cómodas y con carácter para completar tu look: polos, buzos, básicos
            esenciales y piezas con detalles que marcan la diferencia. La misma promesa de siempre:
            <span className="font-medium"> calidad, diseño y precio justo</span>.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-neutral-700 list-disc pl-4">
            <li>Fibras pensadas para uso diario y buen tacto.</li>
            <li>Ediciones pequeñas para mantener la curaduría del catálogo.</li>
            <li>Prendas que combinan perfecto con nuestras joyas.</li>
          </ul>
        </div>
      </section>

      {/* Curaduría & Marcas Aliadas */}
      <section className="mt-16 rounded-3xl border p-8 md:p-10">
        <div className="flex items-center gap-2 text-emerald-700">
          <Gem className="h-5 w-5" />
          <span className="text-sm tracking-wide font-medium">CURADURÍA & MARCAS ALIADAS</span>
        </div>

        <h2 className="font-serif text-2xl mt-2">
          Seleccionamos lo mejor para que te quede mejor
        </h2>

        <p className="mt-3 text-neutral-700 max-w-3xl">
          En Alaha’s <span className="font-medium">no todo es fabricación propia</span>. También trabajamos
          con <span className="font-medium">talleres y marcas aliadas</span> que cumplen nuestros criterios de{" "}
          <span className="font-medium">calidad, confort e hipoalergenicidad</span>. Cada pieza pasa por nuestra{" "}
          <span className="font-medium">curaduría y control de acabados</span> antes de llegar a ti.
          Así unimos lo mejor de ambos mundos: <span className="font-medium">diseño accesible</span> y{" "}
          <span className="font-medium">experiencia cuidada</span>.
        </p>

        {/* Valores / pilares */}
        <ul className="mt-5 grid gap-3 md:grid-cols-4">
          <li className="group rounded-2xl border border-neutral-700/40 bg-neutral-900 text-white p-4 transition-all duration-300 hover:bg-white hover:text-neutral-900 hover:border-neutral-900 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-neutral-300 transition-colors duration-300 group-hover:text-neutral-800" />
              <span>Estándares de calidad</span>
            </div>
            <p className="mt-1 text-neutral-300 text-sm transition-colors duration-300 group-hover:text-neutral-600">
              Control de acabados y pruebas de uso real.
            </p>
          </li>

          <li className="group rounded-2xl border border-neutral-700/40 bg-neutral-900 text-white p-4 transition-all duration-300 hover:bg-white hover:text-neutral-900 hover:border-neutral-900 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-neutral-300 transition-colors duration-300 group-hover:text-neutral-800" />
              <span>Curaduría responsable</span>
            </div>
            <p className="mt-1 text-neutral-300 text-sm transition-colors duration-300 group-hover:text-neutral-600">
              Seleccionamos piezas que combinan, duran y favorecen.
            </p>
          </li>

          <li className="group rounded-2xl border border-neutral-700/40 bg-neutral-900 text-white p-4 transition-all duration-300 hover:bg-white hover:text-neutral-900 hover:border-neutral-900 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-neutral-300 transition-colors duration-300 group-hover:text-neutral-800" />
              <span>Precio honesto</span>
            </div>
            <p className="mt-1 text-neutral-300 text-sm transition-colors duration-300 group-hover:text-neutral-600">
              Calidad accesible y transparente. Sin sorpresas.
            </p>
          </li>

          <li className="group rounded-2xl border border-neutral-700/40 bg-neutral-900 text-white p-4 transition-all duration-300 hover:bg-white hover:text-neutral-900 hover:border-neutral-900 hover:shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <Leaf className="h-4 w-4 text-neutral-300 transition-colors duration-300 group-hover:text-neutral-800" />
              <span>Amables con tu piel</span>
            </div>
            <p className="mt-1 text-neutral-300 text-sm transition-colors duration-300 group-hover:text-neutral-600">
              Piezas hipoalergénicas y cómodas para el día a día.
            </p>
          </li>
        </ul>


        <p className="mt-4 text-xs text-neutral-500">
          Nota de transparencia: Algunas piezas pertenecen a{" "}
          <span className="font-medium">marcas aliadas</span>. Alaha’s realiza la{" "}
          <span className="font-medium">curaduría</span> y el{" "}
          <span className="font-medium">control de calidad</span> para asegurar el estándar de la tienda,
          manteniendo precios cómodos y garantía de satisfacción.
        </p>
      </section>

      {/* FAQ con animación */}
      <section className="mt-14">
        <h3 className="font-serif text-xl mb-4">Preguntas frecuentes</h3>
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
        <blockquote className="font-serif text-2xl md:text-3xl">
          “Elegancia cotidiana, precios honestos y una relación cercana. Eso es Alaha’s.”
        </blockquote>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/productos"
            className="rounded-full px-6 py-3 bg-black text-white text-sm font-medium hover:opacity-90"
          >
            Explorar catálogo
          </Link>
          {phone && (
            <a
              href={waLink(
                phone,
                "Hola, quiero saber más sobre la historia de Alaha’s y sus colecciones ✨"
              )}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-6 py-3 border text-sm font-medium hover:bg-neutral-50"
            >
              Hablar por WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
