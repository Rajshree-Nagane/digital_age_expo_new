import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getAboutUsForm } from "@/lib/services/eventAboutUs";
import { AboutUsManager } from "@/components/dashboard/AboutUsManager";

export const metadata = { title: "About Show" };

export default async function EventAboutUsPage() {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/members/event_about_us");
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const domain = await getDomain();
  const eventId = domain?.event_id ?? 1;

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    redirect("/members/event_member");
  }

  const form = await getAboutUsForm(context);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">{form.tabName}</h1>
        <p className="text-zinc-400 font-medium max-w-2xl">
          Content blocks shown to exhibitors and attendees describing this show.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8">
        <AboutUsManager tabName={form.tabName} fields={form.fields} />
      </div>
    </div>
  );
}
