import { Link } from "react-router-dom";
import { FacebookIcon } from "lucide-react";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { useSettings } from "../hooks/useSettings";

export default function Footer() {
  const { settings } = useSettings();

  const socials = [
    { url: settings['facebook_url'], icon: <FacebookIcon className="h-4 w-4" />, label: 'Facebook', color: 'text-neutral-400 sm:text-neutral-400 hover:text-[#1877F2]', mobileColor: 'text-[#1877F2]' },
    { url: settings['instagram_url'], icon: <FaInstagram className="h-4 w-4" />, label: 'Instagram', color: 'text-neutral-400 sm:text-neutral-400 hover:text-[#E1306C]', mobileColor: 'text-[#E1306C]' },
    { url: settings['tiktok_url'], icon: <FaTiktok className="h-4 w-4" />, label: 'TikTok', color: 'text-neutral-400 sm:text-neutral-400 hover:text-neutral-800', mobileColor: 'text-neutral-700' },
  ].filter(s => s.url);

  return (
    <footer className="mt-16 py-10" style={{ backgroundColor: '#f7e8e1' }}>
      <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-6">

        {/* Links secundarios */}
        <div className="flex items-center gap-6 text-xs tracking-widest text-[#4a4438]/60 uppercase">
          <Link to="/nosotros" className="hover:text-[#4a4438] transition-colors">Nosotros</Link>
          <span className="w-px h-3 bg-[#4a4438]/20" />
          <Link to="/marca" className="hover:text-[#4a4438] transition-colors">Marca</Link>
        </div>

        {/* Redes sociales */}
        {socials.length > 0 && (
          <div className="flex justify-center gap-8">
            {socials.map(({ url, icon, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-[#4a4438]/50 hover:text-[#4a4438] transition-colors"
              >
                <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
              </a>
            ))}
          </div>
        )}

        {/* Copyright */}
        <p className="text-xs tracking-widest text-[#4a4438]/40 uppercase text-center">
          © {new Date().getFullYear()} Alaha's.<br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
