import { waLink } from "../lib/wa";
import { motion } from "framer-motion";
import { BsWhatsapp } from "react-icons/bs";

type Props = {
  phone: string;
  message: string;
  size?: "md" | "lg";
  className?: string;
};

export default function WhatsAppButton({
  phone,
  message,
  size = "lg",
  className = "",
}: Props) {
  const href = waLink(phone, message);
  const pad = size === "lg" ? "px-6 py-3" : "px-4 py-2.5";
  const text = size === "lg" ? "text-sm" : "text-xs";

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative inline-flex items-center gap-2 rounded-full ${pad} ${text} font-medium
        bg-emerald-500 text-white shadow-[0_0_35px_rgba(16,185,129,0.35)]
        ring-1 ring-emerald-400/40 hover:brightness-105 focus:outline-none focus:ring-2
        ${className}`}
      aria-label="Consultar por WhatsApp"
    >
      {/* halo sutil */}
      <span className="absolute inset-0 -z-10 rounded-full bg-emerald-500/30 blur-xl opacity-60" />
      {/* Icono WhatsApp (vector limpio, sin fondo cuadrado) */}
      <BsWhatsapp className="h-5 w-5 flex-shrink-0" aria-hidden />
      Consultar por WhatsApp
    </motion.a>
  );
}
