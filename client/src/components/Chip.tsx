type Props = { children: React.ReactNode; onRemove?: () => void };
export default function Chip({ children, onRemove }: Props) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
      {children}
      {onRemove && (
        <button onClick={onRemove} aria-label="Quitar" className="opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </span>
  );
}
