import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import {
  getCurrentSpeakersPaged,
  getPreviousSpeakers,
  getSpeakerPageContent,
} from "@/lib/services/speakers";
import { CurrentSpeakersSection } from "@/components/speakers/CurrentSpeakersSection";
import { BecomeSpeakerSection } from "@/components/speakers/BecomeSpeakerSection";
import { PreviousSpeakersSection } from "@/components/speakers/PreviousSpeakersSection";
import { WhySpeakerSection } from "@/components/speakers/WhySpeakerSection";

export const metadata = {
  title: "Speakers",
  description: "Inspired with our Motivational Speakers | Keynote Speaker",
};

const PAGE_SIZE = 20;

export default async function ViewSpeakerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;

  const [currentResult, previousSpeakers, content] = await Promise.all([
    event ? getCurrentSpeakersPaged(event.id, page, PAGE_SIZE) : { speakers: [], total: 0, page: 1, pageSize: PAGE_SIZE },
    event?.previous_event_id ? getPreviousSpeakers(event.previous_event_id, event.id) : [],
    domain.linked_profile_listing_id ? getSpeakerPageContent(domain.linked_profile_listing_id) : { whySpeaker: null },
  ]);
  const currentSpeakers = currentResult.speakers;
  const totalPages = Math.max(1, Math.ceil(currentResult.total / PAGE_SIZE));

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-white">
        <h1 className="text-2xl font-bold">Speakers</h1>
        <p className="mt-4 text-zinc-400">No upcoming event is currently configured for this site.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-indigo-950 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-black uppercase sm:text-4xl">{event.title}</h1>
        <p className="mt-2 text-white/80">
          {event.date_start.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          {event.venue ? `, ${event.venue}` : ""}
        </p>
      </div>

      <CurrentSpeakersSection
        speakers={currentSpeakers as any}
        eventDate={event.date_start}
        currentPage={page}
        totalPages={totalPages}
      />

      <BecomeSpeakerSection />

      <PreviousSpeakersSection speakers={previousSpeakers as any} speakerTypeTitle="Event" />

      {content.whySpeaker && (
        <WhySpeakerSection
          sectionTitle={content.whySpeaker.section_title}
          sectionDescription={content.whySpeaker.section_description}
          additionalInfo={content.whySpeaker.additional_info}
        />
      )}
    </>
  );
}