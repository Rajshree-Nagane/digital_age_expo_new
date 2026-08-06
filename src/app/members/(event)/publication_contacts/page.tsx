import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getPublicationContacts } from "@/lib/services/publicationContacts";
import { PublicationContactsManager } from "@/components/dashboard/PublicationContactsManager";

export const metadata = { title: "Manage Publication Contacts" };

export default async function PublicationContactsPage() {
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
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-wider brand-gradient-text">Publication Contacts</h1>
        <p className="rounded-2xl border border-white/10 bg-zinc-950/40 p-8 text-zinc-400 font-medium">
          Publication contacts management is only available to the event organiser.
        </p>
      </div>
    );
  }

  const contacts = await getPublicationContacts(context);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider brand-gradient-text">Publication Contacts</h1>
        <p className="mt-2 text-zinc-400 font-medium">Press and media contacts for this event's publications.</p>
      </div>

      <div className="mt-6">
        <PublicationContactsManager contacts={contacts} />
      </div>
    </div>
  );
}
