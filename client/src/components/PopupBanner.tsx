import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';

type PopupData = {
  id: number;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_url: string;
};

export default function PopupBanner() {
  const { pathname } = useLocation();
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const res = await fetch(`${API}/popup/active`);
        const data = await res.json();
        if (data.ok && data.data) {
          setPopup(data.data);
          // Mostrar con un pequeño delay para no interrumpir la carga
          setTimeout(() => setVisible(true), 1200);
        }
      } catch {
        // Silencioso — no interrumpe la navegación
      }
    };

    fetchPopup();
  }, []);

  const dismiss = () => {
    setVisible(false);
    window.dispatchEvent(new CustomEvent('popup:closed'));
  };

  const isExternal = popup?.button_url?.startsWith('http');

  if (pathname !== '/') return null;

  return (
    <AnimatePresence>
      {visible && popup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="bg-white w-full max-w-sm sm:max-w-md pointer-events-auto relative overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col">
              {/* Cerrar */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center bg-white/90 hover:bg-white shadow-sm transition"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>

              {/* Banner clickeable completo */}
              {popup.button_url ? (
                isExternal ? (
                  <a href={popup.button_url} target="_blank" rel="noreferrer" onClick={dismiss} className="block cursor-pointer overflow-hidden">
                    <img src={popup.image_url} alt={popup.title} className="w-full h-auto block object-contain" />
                  </a>
                ) : (
                  <Link to={popup.button_url} onClick={dismiss} className="block cursor-pointer overflow-hidden">
                    <img src={popup.image_url} alt={popup.title} className="w-full h-auto block object-contain" />
                  </Link>
                )
              ) : (
                <img src={popup.image_url} alt={popup.title} className="w-full h-auto block object-contain" />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
