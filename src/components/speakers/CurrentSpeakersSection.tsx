import Link from "next/link";
import { SpeakerDirectoryCard, type DirectorySpeaker } from "@/components/speakers/SpeakerDirectoryCard";
import { Pagination } from "@/components/ui/Pagination";

interface Props {
  speakers: DirectorySpeaker[];
  eventDate: Date;
  currentPage?: number;
  totalPages?: number;
}

export function CurrentSpeakersSection({ speakers, eventDate, currentPage = 1, totalPages = 1 }: Props) {
  const monthYear = eventDate.toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <section className="bg-zinc-950 px-6 py-20 text-white border-t border-white/5">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Featured Guests</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white sm:text-5xl tracking-tight">
          All Speakers &mdash; <span className="text-zinc-500">{monthYear}</span>
        </h2>

        {speakers.length > 0 ? (
          <>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {speakers.map((speaker) => (
                <SpeakerDirectoryCard key={speaker.id} speaker={speaker} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => (p === 1 ? "/view_speaker" : `/view_speaker?page=${p}`)}
              theme="dark"
            />
          </>
        ) : (
          <div className="mt-12">
            <Link
              href="/speaker_registration"
              className="btn-brand-gradient inline-block rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl transition hover:scale-105"
            >
              Apply to Speak
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
