import Link from "next/link";
import { assetUrl } from "@/lib/assets";

interface Props {
  videoUrl?: string | null;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function ExploreEvent({ videoUrl, primaryLabel, secondaryLabel }: Props) {
  const src = assetUrl(videoUrl) || "https://findusonweb.com/files/listing_pages/817601-05_INTRO_OK-1.mp4";

  return (
    <section className="relative overflow-hidden bg-surface-1 text-white">
      <div className="relative mx-auto max-w-7xl">
        {/* Video Player Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
          
          {/* Overlay mask for maximum typography & button legibility */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
          
          {/* Subtle gradient overlay at the bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface-1 to-transparent pointer-events-none" />

          {/* Centered Overlay Action Buttons */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 p-4 text-center">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-bold font-mono text-brand-pink uppercase tracking-widest block animate-text-glow">
                Exclusive Virtual Preview
              </span>
              <h3 className="text-xl font-black uppercase tracking-wider text-white sm:text-3xl drop-shadow-md">
                Step Inside the Digital Age Expo
              </h3>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/glimpse-of-the-show"
                className="btn-brand-gradient rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {primaryLabel || "Explore the Event"}
              </Link>
              <Link
                href="/login/digital-age-expo"
                className="rounded-full bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105 active:scale-95"
              >
                {secondaryLabel || "Enter in Digital Age Expo"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

