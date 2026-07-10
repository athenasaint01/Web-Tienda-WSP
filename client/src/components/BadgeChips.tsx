const BADGE_MAP: Record<string, { line1: string; line2?: string; silver?: boolean; desc: string }> = {
  '316l':           { line1: '316L',  desc: 'Acero inoxidable quirúrgico. Alta resistencia a la corrosión, ideal para uso diario y pieles sensibles.' },
  '304l':           { line1: '304L',  desc: 'Acero inoxidable de grado alimentario. Duradero y resistente, excelente relación calidad-precio.' },
  '18k_plated':     { line1: '18K',   line2: 'PLATED', desc: 'Baño de oro de 18 kilates. Acabado premium con brillo duradero.' },
  'hypoallergenic': { line1: 'HIPO',  line2: 'ALERG.', desc: 'Libre de níquel y alérgenos. Apto para pieles sensibles y uso prolongado.' },
  'waterproof':     { line1: 'WATER', line2: 'PROOF',  desc: 'Resistente al agua y la humedad. Mantiene su acabado con uso diario.' },
  '925_silver':     { line1: '925',   silver: true,     desc: 'Plata de ley 925. 92.5% plata pura, el estándar internacional de joyería fina.' },
};

export { BADGE_MAP };

type Props = {
  badges?: string[];
  size?: 'sm' | 'lg-card' | 'md';
  showTooltip?: boolean;
};

function SealSVG({
  line1,
  line2,
  size,
}: {
  line1: string;
  line2?: string;
  silver?: boolean;
  size: 'sm' | 'lg-card' | 'md';
}) {
  const dim = size === 'md' ? 58 : size === 'lg-card' ? 42 : 30;
  const cx = dim / 2;
  const r = dim / 2 - 0.5;

  const fs1 = size === 'md' ? 12 : size === 'lg-card' ? 10 : 7;
  const fs2 = size === 'md' ? 7.0 : size === 'lg-card' ? 5.5 : 4.2;

  // centrado dinámico para 2 niveles: line1 + divisor + line2
  const gap = size === 'md' ? 3 : 2.5;           // espacio entre bloques
  const totalH2 = fs1 + gap + 0.6 + gap + fs2;   // altura total del grupo
  const y1      = cx - totalH2 / 2 + fs1 * 0.85; // baseline line1
  const dividerY = y1 + fs1 * 0.2 + gap;
  const y2      = dividerY + gap + fs2 * 0.85;    // baseline line2 (1 palabra)
  const y2b     = y2 + fs2 * 1.25;               // baseline line2 (2ª palabra)

  // centrado para 1 nivel
  const yCentered = cx + fs1 * 0.35;

  const hasBottom = Boolean(line2);

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      {/* fondo negro */}
      <circle cx={cx} cy={cx} r={r} fill="rgba(0,0,0,0.72)" />

      {hasBottom ? (
        <>
          {/* número */}
          <text x={cx} y={y1} textAnchor="middle"
            fontFamily="Archivo Narrow, Arial Narrow, Arial, sans-serif"
            fontSize={fs1} fontWeight="400" fill="#ffffff" letterSpacing="0">
            {line1}
          </text>
          {/* divisor */}
          <line x1={cx - r * 0.55} y1={dividerY} x2={cx + r * 0.55} y2={dividerY}
            stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
          {/* texto inferior — una o dos palabras */}
          <text x={cx} y={y2} textAnchor="middle"
            fontFamily="Archivo Narrow, Arial Narrow, Arial, sans-serif"
            fontSize={fs2} fontWeight="400" fill="rgba(255,255,255,0.9)"
            letterSpacing="0">
            {line2!.split(' ')[0]}
          </text>
          {line2!.split(' ')[1] && (
            <text x={cx} y={y2b} textAnchor="middle"
              fontFamily="Archivo Narrow, Arial Narrow, Arial, sans-serif"
              fontSize={fs2} fontWeight="400" fill="rgba(255,255,255,0.9)"
              letterSpacing="0">
              {line2!.split(' ')[1]}
            </text>
          )}
        </>
      ) : (
        /* solo una línea centrada */
        <text x={cx} y={yCentered} textAnchor="middle"
          fontFamily="Archivo Narrow, Arial Narrow, Arial, sans-serif"
          fontSize={fs1} fontWeight="400" fill="#ffffff">
          {line1}
        </text>
      )}
    </svg>
  );
}

export default function BadgeChips({ badges, size = 'sm', showTooltip = false }: Props) {
  if (!badges || badges.length === 0) return null;

  const known = badges.filter(b => BADGE_MAP[b]);
  if (known.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {known.map(b => {
        const entry = BADGE_MAP[b];
        const seal = (
          <SealSVG
            key={b}
            line1={entry.line1}
            line2={entry.line2}
            silver={entry.silver}
            size={size}
          />
        );

        if (!showTooltip) return seal;

        return (
          <div key={b} className="relative group">
            {seal}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52
                            bg-neutral-900 text-white text-xs px-3 py-2 leading-snug
                            opacity-0 group-hover:opacity-100 pointer-events-none
                            transition-opacity duration-200 z-50">
              <p className="font-semibold mb-0.5">{entry.line1}{entry.line2 ? ` ${entry.line2}` : ''}</p>
              <p className="text-neutral-300">{entry.desc}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2
                              border-4 border-transparent border-t-neutral-900" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
