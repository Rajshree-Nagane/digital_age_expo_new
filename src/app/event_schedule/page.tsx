import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import { getEventSchedule } from "@/lib/services/schedule";
import { EventScheduleClient } from "@/components/schedule/EventScheduleClient";

export const metadata = {
  title: "Event Schedule - Digital Age Expo",
  description: "Explore the full event schedule, masterclasses, keynotes, webinars, and workshops across all 3 days at Digital Age Expo 2026.",
};

export default async function EventSchedulePage() {
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;
  const days = event ? await getEventSchedule(event.id) : [];

  const defaultEvent = event || {
    id: 1474,
    title: "Digital Age Expo 2026",
    venue: "Exhibition Hall & Virtual Auditoriums",
    date_start: new Date("2026-08-26"),
    date_end: new Date("2026-08-28"),
  };

  return <EventScheduleClient event={defaultEvent} initialDays={days} />;
}

