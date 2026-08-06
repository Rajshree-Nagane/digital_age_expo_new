export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * A donut (ring) pie chart, built as plain SVG per the dataviz skill — no charting library is
 * installed in this project, and the skill's own guidance is to assemble charts from SVG/HTML
 * primitives rather than reach for one. Each slice is a stroked <circle> using the
 * stroke-dasharray "ring segment" technique, rotated to its cumulative starting angle.
 *
 * Design choices, per the skill:
 *  - A small angular gap + rounded linecap between slices stands in for the "2px surface gap"
 *    mark spec (there's no straight edge to gap on a circular arc the way there is on a bar).
 *  - The legend (label + value + %) is always shown — never color-alone identity — and doubles
 *    as this chart's accessible table-equivalent, since it already lists every value in text.
 *  - Colors come in pre-assigned via `slices[].color` (see statusColors.ts) rather than being
 *    picked in here, so the same status always renders the same hue across every card.
 *  - A native SVG <title> per slice gives a zero-JS hover tooltip.
 */
export function DonutChart({
  title,
  subtitle,
  total,
  slices,
}: {
  title: string;
  subtitle?: string;
  total: number;
  slices: DonutSlice[];
}) {
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = slices.length > 1 ? 3 : 0;

  let cumulativeDeg = 0;
  const arcs = total > 0
    ? slices.map((slice) => {
        const sliceDeg = (slice.value / total) * 360;
        const drawDeg = Math.max(0, sliceDeg - gapDeg);
        const dash = (drawDeg / 360) * circumference;
        const offset = (cumulativeDeg / 360) * circumference;
        cumulativeDeg += sliceDeg;
        return { slice, dash, offset };
      })
    : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">{title}</h3>
      <p className="mt-0.5 min-h-[1rem] text-[11px] text-zinc-500">{subtitle ?? " "}</p>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title} breakdown`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-chart-grid)"
              strokeWidth={strokeWidth}
            />
            {arcs.map(({ slice, dash, offset }) => (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${Math.max(circumference - dash, 0)}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${slice.label}: ${slice.value.toLocaleString()} (${Math.round((slice.value / total) * 100)}%)`}</title>
              </circle>
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{total.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Total</span>
          </div>
        </div>

        <ul className="flex-1 space-y-1.5 text-xs">
          {slices.length === 0 && <li className="text-zinc-500">No data yet.</li>}
          {slices.map((slice) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <li key={slice.label} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-zinc-300">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="shrink-0 font-bold text-white">
                  {slice.value.toLocaleString()} <span className="font-normal text-zinc-500">({pct}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
