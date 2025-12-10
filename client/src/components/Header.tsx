import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/productos", label: "Productos" },
  { to: "/nosotros", label: "Nosotros" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Animaciones staggered para items del menú
  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: {
      opacity: 0,
      x: 50,
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/75 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 relative z-[60]">
            <img
              src="/brand/logo-wordmark.png.png"
              alt="Alaha's"
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navItems.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) =>
                  `tracking-wide hover:opacity-70 transition-opacity ${
                    isActive ? "font-medium" : "opacity-90"
                  }`
                }
                end={i.to === "/"}
              >
                {i.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden relative z-[60] p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay - Outside header to avoid z-index conflicts */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
              onClick={closeMenu}
            />

            {/* Menu Panel */}
            <motion.nav
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl z-[55] md:hidden overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={closeMenu}
                className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-lg transition-colors z-10"
                aria-label="Cerrar menú"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col h-full pt-20 pb-6 px-6">
                {/* Menu Items with Stagger Animation */}
                <div className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <motion.div key={item.to} variants={itemVariants}>
                      <NavLink
                        to={item.to}
                        onClick={closeMenu}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                          `block px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                            isActive
                              ? "bg-black text-white"
                              : "hover:bg-black/5 text-black/80"
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </motion.div>
                  ))}
                </div>

                {/* Decorative Footer */}
                <motion.div
                  variants={itemVariants}
                  className="mt-auto pt-6 border-t border-black/10"
                >
                  <p className="text-xs text-black/40 text-center">
                    © 2025 Alaha's
                  </p>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}