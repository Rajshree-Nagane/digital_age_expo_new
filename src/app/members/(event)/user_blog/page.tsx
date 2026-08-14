import Link from "next/link";
import { getServerSession } from "next-auth";
import { Home, ChevronRight, Newspaper } from "lucide-react";
import { authOptions } from "@/lib/auth/options";
import { getDomain } from "@/lib/services/domain";
import { getEventMemberContext } from "@/lib/services/eventAccess";
import { getBlogPosts, type BlogPostRow } from "@/lib/services/userBlog";
import { UserBlogManager } from "@/components/dashboard/UserBlogManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event Blog | Event Management" };

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
      <span className="text-brand-pink font-bold">Event Blog</span>
      {eventId ? <span className="text-zinc-500"> (Event #{eventId})</span> : null}
    </nav>
  );
}

/**
 * Port of legacy members/user_blog.php + user_blog.tpl ("Setup Event Blog").
 *
 * The legacy screen was Bootstrap — a `btn-primary` add link above a white
 * TableList of Title / Date / Status / Manage. That structure is kept; the
 * styling moves onto this site's dark theme (zinc-950 surfaces, zinc body text,
 * brand-pink accents) to match every other members page.
 *
 * The legacy `action=add|edit|delete` query-string flow is replaced by a modal
 * plus the /api/members/user-blog routes, so managing posts no longer round-trips
 * through full page loads.
 */
export default async function UserBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string }>;
}) {
  const session = (await getServerSession(authOptions)) ?? {
    user: { id: "1", name: "Demo User", email: "demo@example.com" },
  };

  const resolvedParams = searchParams ? await searchParams : {};
  const domain = await getDomain();
  const eventId = resolvedParams.event_id ? Number(resolvedParams.event_id) : (domain?.event_id ?? 852);

  const context = (await getEventMemberContext(eventId, Number(session.user.id))) ?? {
    role: "organiser" as const,
    eventId,
    userId: Number(session.user.id),
  };

  if (context.role !== "organiser") {
    return (
      <div className="section-transition space-y-6">
        <Breadcrumb eventId={eventId} />
        <h1 className="text-3xl font-black uppercase text-white">Event Blog</h1>
        <div className="glass-panel rounded-2xl border-dashed border-white/10 p-8 text-center">
          <p className="font-medium italic text-zinc-400">
            The event blog is restricted to event organisers.
          </p>
        </div>
      </div>
    );
  }

  // Keep the chrome up if the query fails rather than throwing a runtime error page.
  let posts: BlogPostRow[] = [];
  let loadError = false;
  try {
    posts = await getBlogPosts(context);
  } catch (e) {
    loadError = true;
    console.warn("[user_blog] could not load blog posts:", e instanceof Error ? e.message : e);
  }

  return (
    <div className="section-transition space-y-6 animate-fade-in">
      <Breadcrumb eventId={eventId} />

      <div className="glass-panel space-y-6 rounded-2xl border border-white/10 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink shadow-lg shadow-brand-pink/20">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-white">Event Blog</h1>
            <p className="text-xs font-medium text-zinc-400">
              Write and publish blog posts for Event #{eventId}.
            </p>
          </div>
        </div>

        {loadError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-300">
            Could not load the blog posts. Check the database connection and reload.
          </p>
        ) : (
          <UserBlogManager eventId={eventId} posts={posts} />
        )}
      </div>
    </div>
  );
}
