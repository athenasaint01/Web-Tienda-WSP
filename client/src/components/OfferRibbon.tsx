/**
 * Cinta diagonal "OFERTA" para la esquina superior izquierda de la foto
 * de un producto. Color terracota del tema (#d4a58a).
 *
 * El contenedor padre debe tener `position: relative` y `overflow: hidden`.
 */
export default function OfferRibbon({
  label = 'OFERTA',
  size = 'md',
}: {
  label?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 88 : 116; // lado del cuadrado que ocupa la cinta
  const band = size === 'sm' ? 18 : 24; // alto de la banda
  const fontSize = size === 'sm' ? 9 : 11;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-20 overflow-hidden"
      style={{ width: dim, height: dim }}
    >
      <div
        className="absolute flex items-center justify-center font-display font-medium uppercase text-white shadow-sm"
        style={{
          width: dim * 1.42,
          height: band,
          top: size === 'sm' ? 14 : 20,
          left: -dim * 0.42,
          transform: 'rotate(-45deg)',
          transformOrigin: 'center',
          background: 'linear-gradient(135deg, #d4a58a 0%, #c4927a 100%)',
          fontSize,
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </div>
    </div>
  );
}
