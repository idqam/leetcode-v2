interface Props { solved: number; total: number; size?: number }

export function CircularProgress({ solved, total, size = 100 }: Props) {
  const pct = total === 0 ? 0 : (solved / total) * 100;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} strokeWidth="8" stroke="#D4CFC6" className="dark:stroke-[#2A3A4A] fill-none" />
        <circle
          cx={cx} cy={cx} r={r} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="#3D7EAA"
          className="fill-none transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-bold text-[#1C2B3A] dark:text-[#E8EDF2]">{Math.round(pct)}%</span>
    </div>
  );
}
