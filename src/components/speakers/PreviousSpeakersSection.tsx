import Link from "next/link";
import { SpeakerDirectoryCard, type DirectorySpeaker } from "@/components/speakers/SpeakerDirectoryCard";

interface Props {
  speakers: DirectorySpeaker[];
  speakerTypeTitle: string;
}

/**
 * Only renders when there's real previous-event speaker data (find_speakers.previous_event_id
 * chain). Was its own light bg-fuchsia-50 section — the one part of /view_speaker that didn't
 * match the rest of the page (or the site's global dark theme set in app/layout.tsx); now
 * bg-zinc-950 like CurrentSpeakersSection above it, so SpeakerDirectoryCard's dark styling
 * reads correctly here too.
 */
export function PreviousSpeakersSection({ speakers, speakerTypeTitle }: Props) {
  if (speakers.length === 0) return null;

  return (
    <section className="border-t border-white/5 bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Hall Of Fame</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-white sm:text-4xl">
          Previous Event Speakers
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {speakers.map((speaker) => (
            <SpeakerDirectoryCard key={speaker.id} speaker={speaker} />
          ))}
        </div>
        <Link
          href="/speaker_registration"
          className="btn-brand-gradient mt-10 inline-block rounded-full px-8 py-3 font-semibold text-white shadow-xl transition hover:scale-105"
        >
          Enroll as {speakerTypeTitle} Speaker
        </Link>
      </div>
    </section>
  );
}
