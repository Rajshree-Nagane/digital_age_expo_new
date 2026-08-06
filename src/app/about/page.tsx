import { getDomain } from "@/lib/services/domain";
import { getEventById, getEventDateRange } from "@/lib/services/events";
import { getOpportunityContent } from "@/lib/services/home";
import { AboutEvent } from "@/components/home/AboutEvent";
import { SponsorHostGrid } from "@/components/home/SponsorHostGrid";

export const metadata = {
  title: "About The Event",
};

export default async function AboutPage() {
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;
  const eventDates = domain.event_id ? await getEventDateRange(domain.event_id) : null;
  const { aboutEvent, sponsorHostData } = domain.linked_profile_listing_id
    ? await getOpportunityContent(domain.linked_profile_listing_id)
    : { aboutEvent: null, sponsorHostData: [] };

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
