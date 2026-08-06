import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { isEventOrganiser } from "@/lib/services/events";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import {
  LayoutDashboard,
  CalendarDays,
  ShieldCheck,
  Wrench,
  Settings,
  UserCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/schedule",
    label: "My Schedule",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/security",
    label: "My Security Details",
    icon: ShieldCheck,
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const session = await getServerSession(authOptions);
  // if (!session) redirect("/login?callbackUrl=/dashboard");

  const session = (await getServerSession(authOptions)) ?? {
    user: {
      id: "1",
      name: "Demo User",
      login: "demouser",
      email: "demo@example.com",
    },
  };

  const domain = await getDomain();
  const userId = Number(session.user.id);

  const organiser =
    domain.event_id &&
    (await isEventOrganiser(domain.event_id, userId));

  const eventContext = domain.event_id
    ? await getEventMemberContext(domain.event_id, userId)
    : null;

  const navItems = [...NAV_ITEMS];

  if (eventContext) {
    navItems.push({
      href: "/members/event_member",
      label: "My Event Tools",
      icon: Wrench,
    });
  }

  if (organiser) {
    navItems.push({
      href: "/dashboard/admin",
      label: "Event Admin",
      icon: Settings,
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-72">
          <div className="sticky top-24 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple via-brand-violet to-brand-pink p-6 shadow-2xl">

            {/* Decorative Blur */}
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-pink-400/20 blur-2xl" />

            <div className="relative">
              {/* User */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <UserCircle2 className="h-9 w-9 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[3px] text-white/70">
                    Welcome
                  </p>

                  <h3 className="text-lg font-bold text-white">
                    {session.user.name || session.user.login}
                  </h3>

                  <p className="text-xs text-white/70">
                    Member Dashboard
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-white/15" />

              {/* Navigation */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-2xl px-4 py-3 text-white transition-all duration-300 hover:bg-white hover:text-brand-purple hover:shadow-lg"
                    >
                      <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />

                      <span className="font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="rounded-3xl border border-violet-100 bg-white p-8 shadow-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}