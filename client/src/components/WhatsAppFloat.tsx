import { BsWhatsapp } from "react-icons/bs";
import { motion } from "framer-motion";
import { waLink } from "../lib/wa";

export default function WhatsAppFloat() {
  const phone = import.meta.env.VITE_WHATSAPP_PHONE as string | undefined;
  if (!phone) return null;

  const msg = "Hola, quiero más info sobre sus accesorios ✨";

  return (
    <div
      className="fixed z-50
                 right-[max(1rem,calc(env(safe-area-inset-right,0)+1rem))]
                 bottom-[max(1rem,calc(env(safe-area-inset-bottom,0)+1rem))]"
    >
      <motion.a
        href={waLink(phone, msg)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chatear por WhatsApp"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="
          grid place-items-center h-12 w-12 md:h-14 md:w-14 rounded-full
          bg-emerald-500 text-white
          ring-1 ring-emerald-400/50 hover:brightness-105
          focus:outline-none focus:ring-2
        "
      >
        <BsWhatsapp className="h-5 w-5 md:h-6 md:w-6" aria-hidden />
      </motion.a>
    </div>
  );
}
