import { Link, NavLink, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, User, ShoppingBag } from "lucide-react";
import SearchModal from "./SearchModal";
import { useCart } from "../context/CartContext";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const categories = useCategories();
  const { count: cartCount, open: openCart } = useCart();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  // NavLink marca "activo" comparando solo el pathname — como todas las
  // categorías apuntan a /productos, todas quedaban subrayadas a la vez.
  // Se calcula la categoría activa a mano, comparando también el query.
  const activeCategorySlug = pathname === "/productos" ? searchParams.get("categoria") : null;
  const isOutletActive = pathname === "/productos" && searchParams.get("outlet") === "true";
  // Outlet ya no es una categoría (competía con la categoría real del
  // producto) — es un flag independiente con su propio link fijo más
  // abajo, así que se excluye del listado dinámico si todavía existe
  // como fila en categories.
  const visibleCategories = categories.filter((cat) => cat.slug !== "outlet");

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
      <header className="backdrop-blur border-b border-white/10" style={{ backgroundColor: '#fcf3ed' }}>
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" onClick={scrollToTop} className="flex items-center shrink-0 relative z-[60]">
            <img src="/brand/logo-alahas.webp" alt="Alaha's" className="h-14 w-auto" />
          </Link>

          {/* Desktop Navigation — centrado */}
          <nav className="hidden md:flex items-center gap-6 text-sm mx-auto">
            {visibleCategories.map(cat => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <NavLink
                  key={cat.id}
                  to={`/productos?categoria=${cat.slug}`}
                  onClick={scrollToTop}
                  className={`relative tracking-widest transition-colors duration-200 pb-0.5 group uppercase text-[11px] ${isActive ? "font-medium text-[#4a4438]" : "text-[#4a4438]/70"}`}
                >
                  <span className={`group-hover:text-[#4a4438] transition-colors ${isActive ? "text-[#4a4438]" : ""}`}>{cat.name}</span>
                  <span className={`absolute -bottom-0.5 left-0 h-px bg-[#4a4438] transition-all duration-300 ${isActive ? "w-full" : "w-0 group-hover:w-full"}`} />
                </NavLink>
              );
            })}
            {/* Outlet: flag independiente, no una categoría — link fijo aparte */}
            <NavLink
              to="/productos?outlet=true"
              onClick={scrollToTop}
              className={`relative tracking-widest transition-colors duration-200 pb-0.5 group uppercase text-[11px] ${isOutletActive ? "font-medium text-[#4a4438]" : "text-[#4a4438]/70"}`}
            >
              <span className={`group-hover:text-[#4a4438] transition-colors ${isOutletActive ? "text-[#4a4438]" : ""}`}>Outlet</span>
              <span className={`absolute -bottom-0.5 left-0 h-px bg-[#4a4438] transition-all duration-300 ${isOutletActive ? "w-full" : "w-0 group-hover:w-full"}`} />
            </NavLink>
          </nav>

          {/* Iconos derecha */}
          <div className="flex items-center gap-1 relative z-[60]">
            <button aria-label="Buscar" className={iconCls} onClick={() => setSearchOpen(true)}>
              <Search size={19} />
            </button>
            <button aria-label="Mi cuenta" className={iconCls}>
              <User size={19} />
            </button>
            <button aria-label="Carrito" className={`${iconCls} relative`} onClick={openCart}>
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#c4927a] text-white text-[10px] font-medium leading-4 text-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
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
              className="fixed top-0 right-0 bottom-0 w-[280px] shadow-2xl z-[55] md:hidden overflow-y-auto"
              style={{ backgroundColor: '#fcf3ed' }}
            >
              <button onClick={closeMenu}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors z-10 text-[#4a4438]"
                aria-label="Cerrar menú"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col h-full pt-20 pb-6 px-6">
                <div className="flex flex-col gap-1">
                  {visibleCategories.map(cat => {
                    const isActive = activeCategorySlug === cat.slug;
                    return (
                      <motion.div key={cat.id} variants={itemVariants}>
                        <NavLink
                          to={`/productos?categoria=${cat.slug}`}
                          onClick={closeMenu}
                          className={`block px-4 py-3 text-sm font-medium uppercase tracking-widest transition-all border-l-2 ${isActive ? "border-[#4a4438] text-[#4a4438]" : "border-transparent text-[#4a4438]/70 hover:text-[#4a4438] hover:border-[#c4927a]"}`}
                        >
                          {cat.name}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                  <motion.div variants={itemVariants}>
                    <NavLink
                      to="/productos?outlet=true"
                      onClick={closeMenu}
                      className={`block px-4 py-3 text-sm font-medium uppercase tracking-widest transition-all border-l-2 ${isOutletActive ? "border-[#4a4438] text-[#4a4438]" : "border-transparent text-[#4a4438]/70 hover:text-[#4a4438] hover:border-[#c4927a]"}`}
                    >
                      Outlet
                    </NavLink>
                  </motion.div>
                </div>

                {/* Links secundarios al fondo */}
                <motion.div variants={itemVariants} className="mt-auto pt-6 border-t border-[#4a4438]/10 flex flex-col gap-1">
                  <Link to="/nosotros" onClick={closeMenu}
                    className="px-4 py-2 text-sm text-[#4a4438]/60 hover:text-[#4a4438] transition-colors"
                  >
                    Nosotros
                  </Link>
                  <Link to="/marca" onClick={closeMenu}
                    className="px-4 py-2 text-sm text-[#4a4438]/60 hover:text-[#4a4438] transition-colors"
                  >
                    Marca
                  </Link>
                  <p className="text-xs text-[#4a4438]/30 text-center mt-4">© {new Date().getFullYear()} Alaha's</p>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
