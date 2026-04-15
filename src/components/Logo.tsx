export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div
        className="rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-white grid place-items-center font-extrabold"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        T
      </div>
      <span className="font-extrabold tracking-tight text-brand-900" style={{ fontSize: size * 0.7 }}>
        Traidal
      </span>
    </div>
  );
}
