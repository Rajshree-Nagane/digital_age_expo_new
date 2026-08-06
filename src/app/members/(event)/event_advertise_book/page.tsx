import { redirect } from "next/navigation";
import { getDomain } from "@/lib/services/domain";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";
import EventAdvertiseBookClient from "@/components/dashboard/EventAdvertiseBookClient";

export const metadata = {
  title: "Manage Magazine | FindUsOnWeb",
};

export default async function EventAdvertiseBookPage() {
  const domain = await getDomain();
  const eventId = domain?.event_id ?? DEFAULT_EVENT_ID;

  return <EventAdvertiseBookClient eventId={eventId} />;
}
