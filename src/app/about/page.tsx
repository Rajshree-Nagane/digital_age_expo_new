import { getDomain } from "@/lib/services/domain";
import { getEventById, getEventDateRange } from "@/lib/services/events";
import { EMPTY_OPPORTUNITY_CONTENT, getOpportunityContent } from "@/lib/services/home";
import { AboutEvent } from "@/components/home/AboutEvent";
import { SponsorHostGrid } from "@/components/home/SponsorHostGrid";
import { createOutageCollector } from "@/lib/db-errors";
import { DatabaseOutageNotice } from "@/components/common/DatabaseOutageNotice";

export const metadata = {
  title: "About The Event",
};

export default async function AboutPage() {
  const domain = await getDomain();

  // See src/lib/db-errors.ts: guarded so an infrastructure-level database failure degrades instead
  // of 500-ing the route. Keep the collector object intact — `current` is a getter.
  const collector = createOutageCollector();
  const guard = collector.guard;

  const event = domain.event_id ? await guard(() => getEventById(domain.event_id), null) : null;
  const eventDates = domain.event_id ? await guard(() => getEventDateRange(domain.event_id), null) : null;
  const { aboutEvent, sponsorHostData } = domain.linked_profile_listing_id
    ? await guard(
        () => getOpportunityContent(domain.linked_profile_listing_id!),
        EMPTY_OPPORTUNITY_CONTENT
      )
    : EMPTY_OPPORTUNITY_CONTENT;

  // The event could not be read *because* the database refused the query — don't claim no event is
  // configured, which sends the reader looking for a settings problem that doesn't exist.
  if (!event && collector.current) {
    return <DatabaseOutageNotice outage={collector.current} />;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-2xl font-bold text-indigo-950">About</h1>
        <p className="mt-4 text-indigo-950/70">No upcoming event is currently configured for this site.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-indigo-950 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-black uppercase sm:text-4xl">{event.title}</h1>
        {event.label && <p className="mt-2 text-white/80">{event.label}</p>}
      </div>

      {aboutEvent ? (
        <AboutEvent
          sectionTitle={aboutEvent.section_title}
          sectionDescription={aboutEvent.section_description}
          additionalInfo={aboutEvent.additional_info}
          backgroundImage={aboutEvent.opportunity_images}
          dateStart={eventDates?.date_start ?? null}
          dateEnd={eventDates?.date_end ?? null}
        />
      ) : (
        <p className="px-6 py-16 text-center text-indigo-950/70">
          About page content hasn&apos;t been published yet for this event.
        </p>
      )}

      <SponsorHostGrid items={sponsorHostData} />
    </>
  );
}
