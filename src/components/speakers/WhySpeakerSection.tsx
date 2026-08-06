import Link from "next/link";

interface Props {
  sectionTitle: string;
  sectionDescription: string;
  additionalInfo: string;
}

export function WhySpeakerSection({ sectionTitle, sectionDescription, additionalInfo }: Props) {
  return (
    <section className="bg-indigo-950 px-6 py-16 text-center text-white">
      <h2 className="text-2xl font-black capitalize sm:text-3xl">{sectionTitle}</h2>
      <h3 className="mt-2 text-lg uppercase text-white/80">{sectionDescription}</h3>
      <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-white/80">{additionalInfo}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/speaker_registration"
          className="rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500"
        >
          Request Speaker Slot
        </Link>
        <Link
          href="/view_speaker"
          className="rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500"
        >
          View Speaker
        </Link>
        <Link
          href="/speaker_registration"
          className="rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white transition hover:bg-fuchsia-500"
        >
          Request Keynote Speaker
        </Link>
      </div>
    </section>
  );
}
