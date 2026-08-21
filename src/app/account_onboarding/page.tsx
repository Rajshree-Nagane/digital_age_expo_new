import { numericParam } from "@/lib/searchParams";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { AccountOnboardingManager } from "@/components/dashboard/AccountOnboardingManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account Onboarding" };

export default async function AccountOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = numericParam(resolvedParams.event_id, domain?.event_id ?? 852);

  // Not used for gating on this public page — kept only so the onboarding wizard can be
  // extended later to prefill/save against the visitor's event context if they're signed in.
  await getEventMemberContext(eventId, Number(session.user.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 min-h-screen text-white section-transition">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Account On Boarding</h1>
          <p className="text-zinc-400 font-medium max-w-2xl">
            Complete your comprehensive profile onboarding wizard to set up your business identity, details, brand kit, and marketing cards.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <AccountOnboardingManager />
        </div>
      </div>
    </div>
  );
}
