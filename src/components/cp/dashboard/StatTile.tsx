import type { LucideIcon } from "lucide-react";

/**
 * KPI stat tile — the dataviz skill's recommended form for "a handful of headline numbers"
 * (a single current value per entity), rather than forcing every count in this dashboard into
 * a chart it doesn't need. The bar of pie/donut charts below the KPI row is reserved for
 * metrics that have a genuine part-to-whole status breakdown.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-black text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
