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
  silver,
  size,
}: {
  line1: string;
  line2?: string;
  silver?: boolean;
  size: 'sm' | 'lg-card' | 'md';
}) {
  const dim = size === 'md' ? 72 : size === 'lg-card' ? 54 : 38;
  const cx = dim / 2;
  const r = dim / 2 - 1;
  const innerR = size === 'md' ? 25.2 : size === 'lg-card' ? 19.5 : 14.5;
  const ringStrokeR = size === 'md' ? 26.5 : size === 'lg-card' ? 21 : 15.5;
  const dotR = size === 'md' ? 1.1 : size === 'lg-card' ? 0.9 : 0.7;

  // Font sizes: bold sans-serif, generous
  const fs1 = size === 'md' ? 13 : size === 'lg-card' ? 9.5 : 7;
  const fs2 = size === 'md' ? 8  : size === 'lg-card' ? 6   : 4.5;

  // Vertical centering: one or two lines
  const lineH1 = fs1 * 1.15;
  const lineH2 = fs2 * 1.2;
  const totalH = line2 ? lineH1 + 2 + lineH2 : lineH1;
  const y1 = cx - totalH / 2 + lineH1 * 0.78;
  const y2 = y1 + lineH1 * 0.3 + lineH2;

  const ringGold   = silver ? 'url(#ringSilver)'  : 'url(#ringGold)';
  const strokeRing = silver ? 'url(#strokeSilver)': 'url(#strokeGold)';
  const col1       = silver ? '#E8E4E0' : '#F5D060';
  const col2       = silver ? '#C0BCB8' : '#E0B040';
  const dotColor   = silver ? '#D8D4CE' : '#F0C84A';

  const dotCount = size === 'md' ? 16 : 14;
  const dotRingR = (r + ringStrokeR) / 2;
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * dotRingR, y: cx + Math.sin(angle) * dotRingR };
  });

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
      <defs>
        <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFFBE0"/>
          <stop offset="22%"  stopColor="#F0C84A"/>
          <stop offset="50%"  stopColor="#C9973A"/>
          <stop offset="78%"  stopColor="#A07020"/>
          <stop offset="100%" stopColor="#FFFBE0"/>
        </linearGradient>
        <linearGradient id="strokeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#F8E090"/>
          <stop offset="50%" stopColor="#B88828"/>
          <stop offset="100%" stopColor="#F8E090"/>
        </linearGradient>
        <linearGradient id="ringSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFFFFF"/>
          <stop offset="25%"  stopColor="#D8D4CE"/>
          <stop offset="55%"  stopColor="#A8A49E"/>
          <stop offset="80%"  stopColor="#787470"/>
          <stop offset="100%" stopColor="#FFFFFF"/>
        </linearGradient>
        <linearGradient id="strokeSilver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#FFFFFF"/>
          <stop offset="50%" stopColor="#909090"/>
          <stop offset="100%" stopColor="#FFFFFF"/>
        </linearGradient>
      </defs>

      {/* ring */}
      <circle cx={cx} cy={cx} r={r} fill={ringGold} />
      <circle cx={cx} cy={cx} r={ringStrokeR} fill="none" stroke={strokeRing} strokeWidth="0.9" />
      {/* black center */}
      <circle cx={cx} cy={cx} r={innerR} fill="#000" />
      {/* dot ring */}
      <g fill={dotColor} opacity="0.4">
        {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={dotR} />)}
      </g>

      {/* text — bold sans-serif, no special font */}
      <text
        x={cx} y={y1}
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize={fs1}
        fontWeight="900"
        fill={col1}
        letterSpacing="0.5"
      >
        {line1}
      </text>
      {line2 && (
        <text
          x={cx} y={y2}
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize={fs2}
          fontWeight="700"
          fill={col2}
          letterSpacing="1"
        >
          {line2}
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
