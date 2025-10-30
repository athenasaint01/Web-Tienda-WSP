export default function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <h3 className="font-semibold">Luxury Living</h3>
          <p className="text-neutral-600 mt-2">
            Accesorios que elevan tu estilo: collares, pulseras y anillos.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Enlaces</h4>
          <ul className="mt-2 space-y-1">
            <li><a className="hover:underline" href="/productos">Productos</a></li>
            <li><a className="hover:underline" href="/nosotros">Nosotros</a></li>
          </ul>
        </div>
        <div id="contacto">
          <h4 className="font-semibold">Contacto</h4>
          <p className="text-neutral-600 mt-2">Atención por WhatsApp</p>
        </div>
      </div>
      <div className="text-center text-xs text-neutral-500 py-4">
        © {new Date().getFullYear()} Luxury Living. Todos los derechos reservados.
      </div>
    </footer>
  );
}
