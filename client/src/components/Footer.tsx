import { FacebookIcon } from "lucide-react";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { useSettings } from "../hooks/useSettings";

export default function Footer() {
  const { settings } = useSettings();

  const socials = [
    { url: settings['facebook_url'], icon: <FacebookIcon className="h-4 w-4" />, label: 'Facebook', hover: 'hover:text-[#1877F2]' },
    { url: settings['instagram_url'], icon: <FaInstagram className="h-4 w-4" />, label: 'Instagram', hover: 'hover:text-[#E1306C]' },
    { url: settings['tiktok_url'], icon: <FaTiktok className="h-4 w-4" />, label: 'TikTok', hover: 'hover:text-black' },
  ].filter(s => s.url);

  return (
    <footer className="mt-16 bg-stone-100 py-10 flex flex-col items-center gap-6">
      {socials.length > 0 && (
        <div className="flex justify-center gap-8">
          {socials.map(({ url, icon, label, hover }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={`text-neutral-400 transition ${hover}`}
            >
              <span className="[&>svg]:h-6 [&>svg]:w-6">{icon}</span>
            </a>
          ))}
        </div>
      )}
      <p className="text-xs tracking-widest text-neutral-400 uppercase">
        © {new Date().getFullYear()} Alahas. Todos los derechos reservados.
      </p>
    </footer>
  );
}
