import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { assetUrl } from "@/lib/assets";
import { getSponsorshipTierById } from "@/lib/services/sponsors";
import { SponsorshipBenefitsList } from "@/components/sponsors/SponsorshipBenefitsList";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getSponsorshipTierById(Number(id));
  return { title: result ? result.tier.title : "Sponsorship" };
}

export default async function SponsorshipTierPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const result = await getSponsorshipTierById(numericId);
  if (!result) notFound();

  const { tier, benefits } = result;
  const image = assetUrl(tier.image);
  const isAvailable = tier.available - tier.used >= 0 && !tier.sold_out;

  return (
    <>
      <div
        className="bg-indigo-950 bg-cover bg-center px-6 py-16 text-center text-white"
        style={image ? { backgroundImage: `url('${image}')` } : undefined}
      >
        <h1 className="text-3xl font-black sm:text-4xl">{tier.title}</h1>
        <p className="mt-2 text-2xl font-bold text-fuchsia-300">£{tier.price.toLocaleString()}</p>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16">
        {tier.description && (
          <p className="whitespace-pre-line text-lg text-indigo-950/90">{tier.description}</p>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <SponsorshipBenefitsList title="Before The Event" benefits={benefits.before} />
          <SponsorshipBenefitsList title="At The Event" benefits={benefits.during} />
          <SponsorshipBenefitsList title="After The Event" benefits={benefits.after} />
          <SponsorshipBenefitsList title="Standard Benefits" benefits={benefits.standard} />
        </div>

        <div className="mt-12 text-center">
          {isAvailable ? (
            <Link
              href={`/sponsor_registration?sponsorship_tier_id=${tier.id}`}
              className="inline-block rounded-full bg-fuchsia-600 px-8 py-3 font-semibold text-white transition hover:bg-fuchsia-500"
            >
              Sponsor Now
            </Link>
          ) : (
            <span className="inline-block rounded-full bg-indigo-950/20 px-8 py-3 font-semibold text-indigo-950">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </>
  );
}
