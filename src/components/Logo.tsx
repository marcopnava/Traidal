export default function Logo({ size = 28, variant = 'dark' }: { size?: number; variant?: 'dark' | 'light' }) {
  const color = variant === 'light' ? '#ffffff' : '#862165';
  return (
    <div className="flex items-center select-none" style={{ gap: size * 0.25 }}>
      <span
        className="font-extrabold tracking-tight lowercase"
        style={{ fontSize: size, color, letterSpacing: '-0.03em' }}
      >
        skrill
      </span>
    </div>
  );
}
