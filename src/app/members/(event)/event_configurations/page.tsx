import { numericParam } from "@/lib/searchParams";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, LayoutTemplate, ListChecks } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  getEventConfiguration,
  getEventRegisterBackgrounds,
  listActiveRegistrationFields,
  type PreviewField,
} from "@/lib/services/eventConfigurations";
import { assetUrl } from "@/lib/assets";
import { DEFAULT_FORM_POSITION } from "@/lib/validations/eventConfiguration";
import { RegisterDesignCanvas } from "@/components/dashboard/RegisterDesignCanvas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register / Login Design | Event Management" };

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
      <span className="text-brand-pink font-bold">Register / Login Design</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

/**
 * Port of legacy members/event_configurations.php + event_configurations.tpl —
 * the screen the "Register / Login Design" button on Manage Registration links to.
 *
 * The legacy page rendered the background at full viewport height with the form
 * absolutely positioned over it. Here it's an aspect-video canvas inside the
 * members chrome, so the organiser keeps the nav and breadcrumb while dragging;
 * the stored value is a percentage either way, so the two are interchangeable.
 */
export default async function EventConfigurationsPage({
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
        <h1 className="text-3xl font-black uppercase text-white">Register / Login Design</h1>
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-white/10">
          <p className="text-zinc-400 font-medium italic">
            Registration design is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  // Each source is optional and independently fallible — a missing
  // find_event_configurations table must not stop the background and field
  // preview from rendering, so they're resolved separately.
  let configuration: {
    registerFormX: number;
    registerFormY: number;
    textColor: string | null;
    borderColor: string | null;
  } = {
    // DEFAULT_FORM_POSITION is `as const`, so its members are the literal types
    // 30 / 25 — the annotation above widens them back to number, otherwise the
    // reassignment below can't type-check.
    registerFormX: DEFAULT_FORM_POSITION.register_form_x_position,
    registerFormY: DEFAULT_FORM_POSITION.register_form_y_position,
    textColor: null as string | null,
    borderColor: null as string | null,
  };
  let fields: PreviewField[] = [];
  let setupNeeded: string | null = null;

  try {
    const loaded = await getEventConfiguration(eventId);
    configuration = {
      registerFormX: loaded.registerFormX,
      registerFormY: loaded.registerFormY,
      textColor: loaded.textColor,
      borderColor: loaded.borderColor,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("42P01") || /relation .* does not exist/i.test(message)) {
      setupNeeded = "db:event-configurations";
    }
    console.warn("[event_configurations] could not load configuration:", message);
  }

  try {
    fields = await listActiveRegistrationFields(eventId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!setupNeeded && (message.includes("42P01") || /relation .* does not exist/i.test(message))) {
      setupNeeded = "db:registration-fields";
    }
    console.warn("[event_configurations] could not load registration fields:", message);
  }

  let backgroundImage: string | null = null;
  try {
    const backgrounds = await getEventRegisterBackgrounds(eventId);
    backgroundImage = assetUrl(backgrounds.desktop) ?? null;
  } catch (e) {
    console.warn("[event_configurations] could not load the background image:", e);
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel space-y-6 rounded-2xl border border-white/10 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
              <LayoutTemplate className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Register / Login Design
              </h1>
              <p className="text-xs font-medium text-zinc-400">
                Position the registration form over the event background for Event #{eventId}.
              </p>
            </div>
          </div>

          <Link
            href={`/members/manage_registration?event_id=${eventId}`}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:border-white/25 hover:bg-white/10"
          >
            <ListChecks className="h-4 w-4" /> Manage Fields
          </Link>
        </div>

        {setupNeeded ? (
          <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
            <p className="text-sm font-black uppercase tracking-wide">One-time setup needed</p>
            <p className="text-xs leading-relaxed">
              A table this screen depends on doesn&apos;t exist in the database yet. Create it with:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-black/50 px-4 py-3 text-xs font-bold text-emerald-300">
              npm run {setupNeeded}
            </pre>
            <p className="text-[11px] text-amber-200/70">
              Safe to re-run — it only creates what is missing. Then reload this page.
            </p>
          </div>
        ) : (
          <RegisterDesignCanvas
            eventId={eventId}
            backgroundImage={backgroundImage}
            initialX={configuration.registerFormX}
            initialY={configuration.registerFormY}
            textColor={configuration.textColor}
            borderColor={configuration.borderColor}
            fields={fields}
          />
        )}
      </div>
    </div>
  );
}
