import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import { getSponsorshipTiers } from "@/lib/services/sponsors";
import { formatDateLocation } from "@/lib/format";
import { SponsorRegistrationForm } from "@/components/sponsors/SponsorRegistrationForm";

export const metadata = {
  title: "Sponsor Registration",
};

interface Props {
  searchParams: Promise<{ sponsorship_tier_id?: string }>;
}

export default async function SponsorRegistrationPage({ searchParams }: Props) {
  const { sponsorship_tier_id } = await searchParams;
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;
  const tiers = event ? await getSponsorshipTiers(event.id) : [];

  return (
    <>
      <div className="bg-indigo-950 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-black uppercase sm:text-4xl">Sponsor Registration</h1>
        {event && (
          <p className="mt-2 text-white/80">
            {event.title} &mdash; {formatDateLocation(event.date_start, event.date_end, event.venue)}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <SponsorRegistrationForm
          tiers={tiers.map((t: any) => ({ id: t.id, title: t.title, price: t.price }))}
          defaultTierId={sponsorship_tier_id}
        />
      </div>
    </>
  );
}