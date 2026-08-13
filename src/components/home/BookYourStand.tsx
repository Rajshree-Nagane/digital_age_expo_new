import Link from "next/link";
import { assetUrl, staticAssetUrl } from "@/lib/assets";

interface Props {
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  image?: string | null;
}

export function BookYourStand({ sectionTitle, sectionDescription, image }: Props) {
  const title =
    sectionTitle ||
    "Book Your Virtual Exhibition Stand – Get In Touch For More Details!";

  const imgMain =
    assetUrl(image) ||
    staticAssetUrl("/images/exhibitor.jpg");

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl leading-tight">
              {title}
            </h2>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-brand-pink">
              Promote your business to a local, national & international audience.
            </p>

            <div className="mt-8 space-y-6 text-sm text-zinc-400 leading-relaxed font-medium">
              <p>
                Virtual stands work pretty much the same as live in-person events — without the hassle of having to stand around all day!
              </p>

              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-3">
                <p className="font-black uppercase tracking-widest text-zinc-200 text-xs">5 Ways to Maximize On-Stand Promotions:</p>
                <ul className="space-y-2 text-[11px] sm:text-xs text-zinc-400 font-bold uppercase tracking-widest">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink" /> Branding your stand with your company logo</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink" /> Showcase your website & social channels</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink" /> Promote short videos & presentations</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink" /> Present company brochures & leaflets</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-pink" /> Engage in real-time with instant video call & chat</li>
                </ul>
              </div>

              {sectionDescription && (
                <p className="whitespace-pre-line pt-2">{sectionDescription}</p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/exhibitor-registration"
                className="btn-brand-gradient rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition hover:scale-105"
              >
                Book Your Stand
              </Link>
              <Link
                href="/exhibitors"
                className="btn-outline-animated rounded-full bg-white/5 border border-white/10 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-300 shadow-xl transition hover:bg-white/10 hover:text-white"
              >
                Our Exhibitors
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-white/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgMain}
                alt={title}
                className="w-full h-auto rounded-2xl object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            <div className="overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-white/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={staticAssetUrl("/images/exhibitor_2.jpg")}
                alt="Virtual Exhibition Stand Showcase"
                className="w-full h-auto rounded-2xl object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

