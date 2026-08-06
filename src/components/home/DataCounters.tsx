interface Props {
  visitors: string;
  exhibitors: string;
  speakers: string;
  workshops: string;
}

const ITEMS = (p: Props) => [
  { label: "Visitors", value: p.visitors || "25000+" },
  { label: "Exhibitors", value: p.exhibitors || "1000+" },
  { label: "Speakers", value: p.speakers || "100+" },
  { label: "Workshops & Masterclass", value: p.workshops || "50+" },
];

export function DataCounters(props: Props) {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-16 text-white border-y border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-950/40 via-fuchsia-950/20 to-indigo-950/40" />
      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
        {ITEMS(props).map((item) => (
          <div
            key={item.label}
            className="flex w-full max-w-full overflow-hidden flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-sm transition-transform duration-300 hover:scale-105"
          >
            <div className="w-full max-w-full whitespace-nowrap text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-200 to-rose-300 drop-shadow px-1">
              {item.value}
            </div>
            <p className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 text-center max-w-full break-words px-1">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

