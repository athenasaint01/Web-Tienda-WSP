import { useEffect, useDeferredValue, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useProducts } from "../hooks/useProducts";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SearchModal({ open, onClose }: Props) {
  const [term, setTerm] = useState("");
  const deferred = useDeferredValue(term);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { products, loading } = useProducts(
    deferred.trim().length >= 2 ? { q: deferred.trim(), limit: 6 } : {}
  );

  const hasQuery = deferred.trim().length >= 2;
  const hasResults = products.length > 0;

  useEffect(() => {
    if (!open) { setTerm(""); return; }
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goToResults = () => {
    if (!term.trim()) return;
    navigate(`/productos?q=${encodeURIComponent(term.trim())}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] px-4"
          >
            <div className="bg-white shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8">
                <Search size={18} className="text-[#4a4438]/50 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goToResults()}
                  placeholder="Buscar joyas..."
                  className="flex-1 text-sm text-[#4a4438] placeholder:text-[#4a4438]/40 outline-none bg-transparent tracking-wide"
                />
                {term && (
                  <button onClick={() => setTerm("")} className="text-[#4a4438]/40 hover:text-[#4a4438] transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Resultados */}
              {hasQuery && (
                <div>
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-12 h-12 bg-neutral-100 shrink-0" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-neutral-100 rounded w-3/4" />
                            <div className="h-2 bg-neutral-100 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : hasResults ? (
                    <ul>
                      {products.map(p => (
                        <li key={p.slug}>
                          <Link
                            to={`/producto/${p.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#faf4ee] transition-colors group"
                          >
                            <div className="w-12 h-12 shrink-0 overflow-hidden bg-neutral-50">
                              {p.image_url && (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium tracking-widest uppercase text-[#4a4438] truncate">{p.name}</p>
                              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">{p.category}</p>
                            </div>
                            <ArrowRight size={14} className="text-neutral-300 group-hover:text-[#4a4438] transition-colors shrink-0" />
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={goToResults}
                          className="w-full flex items-center justify-between px-4 py-3 text-xs tracking-widest uppercase text-[#4a4438]/60 hover:text-[#4a4438] hover:bg-[#faf4ee] transition-colors border-t border-black/5"
                        >
                          <span>Ver todos los resultados para "{deferred.trim()}"</span>
                          <ArrowRight size={13} />
                        </button>
                      </li>
                    </ul>
                  ) : (
                    <p className="px-4 py-6 text-xs text-center text-neutral-400 tracking-widest uppercase">
                      Sin resultados para "{deferred.trim()}"
                    </p>
                  )}
                </div>
              )}

              {!hasQuery && (
                <p className="px-4 py-5 text-xs text-center text-neutral-400 tracking-widest uppercase">
                  Escribe para buscar productos
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
