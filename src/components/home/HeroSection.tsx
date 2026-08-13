import Link from "next/link";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { Hero3DBackground } from "@/components/home/Hero3DBackground";
import { formatDateLocation } from "@/lib/format";
import { staticAssetUrl } from "@/lib/assets";

interface Props {
  title: string;
  label: string | null;
  dateStart: Date;
  dateEnd: Date | null;
  venue: string | null;
}

export function HeroSection({ title, label, dateStart, dateEnd, venue }: Props) {
  return (
    <section
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-28 text-center text-white sm:py-36"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgb(var(--color-surface-1-rgb) / 0.75), rgb(var(--color-surface-1-rgb) / 0.45) 50%, var(--color-surface-1)), url('${staticAssetUrl("https://digitalageexpo.com/files/listing_pages/818073-dae_index_top_banner.jpg")}')`,
      }}
    >
      {/* Decorative ambient gradient glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl" />

      {/* Animated 3D crystal/orb scene with cursor-driven parallax tilt */}
      <Hero3DBackground />

      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md sm:text-6xl">
          {title}
        </h1>
        {label && (
          <h2 className="mt-4 text-xl font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-pink-300 to-rose-200 sm:text-3xl">
            {label}
          </h2>
        )}
        <p className="mt-4 text-lg font-medium text-white/90 drop-shadow-sm">
          {formatDateLocation(dateStart, dateEnd, venue)}
        </p>

        <div className="mt-10">
          <CountdownTimer targetDate={dateStart.toISOString()} />
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/free-ticket"
            className="btn-brand-gradient rounded-full px-8 py-3.5 font-bold text-white shadow-xl hover:shadow-fuchsia-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Get Free Tickets Now!
          </Link>
          <Link
            href="/enter-the-show"
            className="btn-outline-animated rounded-full bg-white/10 px-8 py-3.5 font-bold text-white ring-1 ring-white/40 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            Enter The Show
          </Link>
          <Link
            href="/exhibitor-registration"
            className="btn-outline-animated rounded-full bg-white/10 px-8 py-3.5 font-bold text-white ring-1 ring-white/40 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
          >
            Book Your Stand
          </Link>
        </div>
      </div>
    </section>
  );
}
