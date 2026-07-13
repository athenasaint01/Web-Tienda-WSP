import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, ShoppingBag } from "lucide-react";

type Category = { id: number; name: string; slug: string };

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API_BASE}/categories`)
      .then(r => r.json())
      .then(d => { if (d.ok) setCategories(d.data); })
      .catch(() => {});
  }, []);
  return categories;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const categories = useCategories();

  const closeMenu = () => setIsMenuOpen(false);

  const menuVariants = {
    closed: { opacity: 0, x: "100%", transition: { duration: 0.3, ease: "easeInOut" as const } },
    open:   { opacity: 1, x: 0,      transition: { duration: 0.4, ease: "easeOut" as const, staggerChildren: 0.07, delayChildren: 0.05 } },
  };
  const itemVariants = {
    closed: { opacity: 0, x: 30 },
    open:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  const iconCls = "p-2 text-[#4a4438]/70 hover:text-[#4a4438] transition-colors rounded-lg hover:bg-black/5";

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10" style={{ backgroundColor: '#f7e8e1' }}>
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" onClick={scrollToTop} className="flex items-center shrink-0 relative z-[60]">
            <img src="/brand/logo-main.webp" alt="Alaha's" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation — centrado */}
          <nav className="hidden md:flex items-center gap-6 text-sm mx-auto">
            {categories.map(cat => (
              <NavLink
                key={cat.id}
                to={`/productos?categoria=${cat.slug}`}
                onClick={scrollToTop}
                className={({ isActive }) =>
                  `relative tracking-widest transition-colors duration-200 pb-0.5 group uppercase text-xs ${isActive ? "font-medium text-[#4a4438]" : "text-[#4a4438]/70"}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`group-hover:text-[#4a4438] transition-colors ${isActive ? "text-[#4a4438]" : ""}`}>{cat.name}</span>
                    <span className={`absolute -bottom-0.5 left-0 h-px bg-[#4a4438] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Iconos derecha */}
          <div className="flex items-center gap-1 relative z-[60]">
            <button aria-label="Buscar" className={iconCls}>
              <Search size={19} />
            </button>
            <button aria-label="Mi cuenta" className={iconCls}>
              <User size={19} />
            </button>
            <button aria-label="Carrito" className={iconCls}>
              <ShoppingBag size={19} />
            </button>

            {/* Hamburger solo mobile */}
            <button
              onClick={() => setIsMenuOpen(o => !o)}
              className={`md:hidden ${iconCls}`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] md:hidden"
              onClick={closeMenu}
            />
            <motion.nav
              variants={menuVariants} initial="closed" animate="open" exit="closed"
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl z-[55] md:hidden overflow-y-auto"
            >
              <button onClick={closeMenu}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors z-10"
                aria-label="Cerrar menú"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col h-full pt-20 pb-6 px-6">
                <div className="flex flex-col gap-1">
                  {categories.map(cat => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <NavLink
                        to={`/productos?categoria=${cat.slug}`}
                        onClick={closeMenu}
                        className={({ isActive }) =>
                          `block px-4 py-3 rounded-lg text-sm font-medium uppercase tracking-widest transition-all ${isActive ? "bg-amber-50 text-amber-700 border-l-2 border-amber-400" : "hover:bg-amber-50/60 hover:text-amber-700 text-black/80"}`
                        }
                      >
                        {cat.name}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>

                {/* Links secundarios al fondo */}
                <motion.div variants={itemVariants} className="mt-auto pt-6 border-t border-black/10 flex flex-col gap-1">
                  <Link to="/nosotros" onClick={closeMenu}
                    className="px-4 py-2 text-sm text-neutral-500 hover:text-amber-700 transition-colors"
                  >
                    Nosotros
                  </Link>
                  <Link to="/marca" onClick={closeMenu}
                    className="px-4 py-2 text-sm text-neutral-500 hover:text-amber-700 transition-colors"
                  >
                    Marca
                  </Link>
                  <p className="text-xs text-black/30 text-center mt-4">© {new Date().getFullYear()} Alaha's</p>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
