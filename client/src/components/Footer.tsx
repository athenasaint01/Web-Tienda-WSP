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
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <img src="/brand/logo-wordmark.png.png" alt="Alahas" className="h-10 w-auto mb-3" />
          <p className="text-neutral-500">Accesorios que elevan tu estilo</p>
        </div>

        {socials.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Redes sociales</h4>
            <ul className="space-y-2 text-neutral-500">
              {socials.map(({ url, icon, label, hover }) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 transition ${hover}`}
                  >
                    {icon} {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      <div className="border-t text-center text-xs text-neutral-400 py-4">
        © {new Date().getFullYear()} Alahas. Todos los derechos reservados.
      </div>
    </footer>
  );
}
