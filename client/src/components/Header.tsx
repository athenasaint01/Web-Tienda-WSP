import { Link, NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur border-b border-black/5">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/brand/logo-wordmark.png.png"
            alt="Alaha's"
            className="h-8 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {[
            { to: "/", label: "Home" },
            { to: "/productos", label: "Productos" },
            { to: "/nosotros", label: "Nosotros" },
          ].map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                `tracking-wide hover:opacity-70 ${isActive ? "font-medium" : "opacity-90"}`
              }
              end={i.to === "/"}
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}