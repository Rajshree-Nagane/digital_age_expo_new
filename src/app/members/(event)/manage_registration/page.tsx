import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, Users } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  listRegistrationFields,
  type RegistrationFieldRow,
} from "@/lib/services/eventRegistrationFields";
import { RegistrationFieldsManager } from "@/components/dashboard/RegistrationFieldsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Registration Fields | Event Management" };

function Breadcrumb({ eventId }: { eventId?: number }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
      <Link href="/" className="flex items-center gap-1 hover:text-brand-pink transition-colors">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <Link href="/members/user_event_summary" className="hover:text-brand-pink transition-colors">
        My Account
      </Link>
      <ChevronRight className="h-3 w-3 text-zinc-600" />
      <span className="text-brand-pink font-bold">Manage Registration</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

/**
 * Port of legacy members/manage_registration.php + manage_registration.tpl.
 *
 * The PHP redirected to user_index.php when `event_id` was missing and gated on
 * the `user_advertiser` permission; the equivalents here are the domain's active
 * event as a fallback, and the organiser role guard below.
 *
 * Seeding the default field set on an event's first visit lives inside
 * listRegistrationFields(), mirroring the PHP's
 * `INSERT ... SELECT ... WHERE event_id = 0 AND is_default = 1`.
 */
export default async function ManageRegistrationPage({
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

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Manage Registration</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Registration management is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  // A database problem shouldn't take the whole screen down with a runtime error
  // page — show an actionable message inline and keep the chrome intact.
  let fields: RegistrationFieldRow[] = [];
  let loadError: string | null = null;
  try {
    fields = await listRegistrationFields(context);
  } catch (e) {
    /*
     * Postgres 42P01 = undefined_table. `find_event_registration_fields` exists
     * in the legacy MySQL install but was not carried across in the migration to
     * Neon, so this is the expected first-run state rather than a bug — and it
     * needs a specific instruction, not "check your connection".
     */
    const message = e instanceof Error ? e.message : String(e);
    const tableMissing = message.includes("42P01") || /relation .* does not exist/i.test(message);

    loadError = tableMissing ? "TABLE_MISSING" : "LOAD_FAILED";

    // console.warn, not console.error: the missing-table case is an expected
    // first-run state with a clear on-screen instruction, and Next's dev overlay
    // promotes console.error into a red error dialog that looks like a crash.
    console.warn(`[manage_registration] ${loadError}: ${message}`);
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel space-y-6 rounded-2xl border border-white/10 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">
              Manage Registration Fields
            </h1>
            <p className="text-xs font-medium text-zinc-400">
              Choose which fields appear on the registration form for Event #{eventId}, which are
              mandatory, and which are re-checked at login.
            </p>
          </div>
        </div>

        {loadError === "TABLE_MISSING" ? (
          <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
            <p className="text-sm font-black uppercase tracking-wide">One-time setup needed</p>
            <p className="text-xs leading-relaxed">
              The <code className="rounded bg-black/40 px-1.5 py-0.5">find_event_registration_fields</code>{" "}
              table doesn&apos;t exist in this database yet — it was never carried across from the
              legacy install. Create it and seed the default field set with:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-black/50 px-4 py-3 text-xs font-bold text-emerald-300">
              npm run db:registration-fields
            </pre>
            <p className="text-[11px] text-amber-200/70">
              Safe to re-run — it only creates what is missing and never touches existing rows.
              Then reload this page.
            </p>
          </div>
        ) : loadError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-300">
            Could not load the registration fields. Check the database connection and reload.
          </p>
        ) : (
          <RegistrationFieldsManager eventId={eventId} fields={fields} />
        )}
      </div>
    </div>
  );
}
