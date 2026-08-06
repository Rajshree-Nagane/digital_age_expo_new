import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { isEventOrganiser } from "@/lib/services/events";

const ADMIN_NAV_ITEMS = [
  { href: "/dashboard/admin/exhibitors", label: "Exhibitors" },
  { href: "/dashboard/admin/speakers", label: "Speakers" },
  { href: "/dashboard/admin/sponsors", label: "Sponsors" },
  { href: "/dashboard/admin/visitors", label: "Visitors" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/dashboard/admin");
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo Organiser", login: "demoorganiser", email: "demo@example.com" },
  };

  const domain = await getDomain();
  // const organiser = domain.event_id && (await isEventOrganiser(domain.event_id, Number(session.user.id)));
  // if (!organiser) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-black uppercase text-indigo-950">Event Admin</h1>
      <p className="mt-2 text-indigo-950/70">Manage exhibitor, speaker, sponsor and visitor registrations.</p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-indigo-950/10 pb-2">
        {ADMIN_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-semibold text-indigo-950/80 hover:bg-black/5"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
