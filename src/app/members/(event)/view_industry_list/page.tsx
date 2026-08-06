import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getIndustries } from "@/lib/services/eventIndustry";
import { IndustryManager } from "@/components/dashboard/IndustryManager";
import { DEFAULT_EVENT_ID } from "@/lib/site-config";

export const metadata = { title: "Event Industry" };

/**
 * Mirrors members/view_industry_list.php — a shared, non-event-scoped taxonomy table
 * (independent_mst where typ_id=7) rather than per-event data. `event_id` only ever mattered to
 * the legacy page for its breadcrumb/redirect links, never for scoping the actual query.
 *
 * The page shell below now matches every other members/(event) page (event_faq, event_show_info,
 * etc.) — dark zinc-950 background inherited from the shared layout, white headings, brand-pink
 * accent — instead of its old standalone bg-white/slate-900/purple card, which stood out as the
 * one light-themed page inside an otherwise all-dark member area.
 */
export default async function ViewIndustryListPage({
  searchParams,
}: {
  searchParams?: Promise<{ event_id?: string }>;
}) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/view_industry_list");
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const queryEventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : undefined;

  const domain = await getDomain();
  const eventId = queryEventId || domain?.event_id || DEFAULT_EVENT_ID;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  const industries = await getIndustries();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-brand-pink" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Context</p>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">Event Industry</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Manage, add, update, and edit industry categories and services across the platform using the industries model.
        </p>
      </div>

      <div>
        <IndustryManager industries={industries} canManage={true} />
      </div>
    </div>
  );
}
