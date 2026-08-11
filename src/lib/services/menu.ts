import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";

export interface MenuItem {
  id: number;
  title: string;
  link: string;
  target: string;
  children: MenuItem[];
}

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: 1,
    title: "Free Ticket",
    link: "/free-ticket",
    target: "_self",
    children: [],
  },
  {
    id: 2,
    title: "Visit",
    link: "#",
    target: "_self",
    children: [
      { id: 21, title: "Why Join Exhibit", link: "/why_join_exhibit", target: "_self", children: [] },
      { id: 22, title: "Event Features", link: "/event_features", target: "_self", children: [] },
      { id: 23, title: "Event Zones", link: "/event_zones", target: "_self", children: [] },
      { id: 24, title: "Visitor Login", link: "/enter-the-show", target: "_self", children: [] },
    ],
  },
  {
    id: 3,
    title: "Schedules",
    link: "/event_schedule",
    target: "_self",
    children: [],
  },
  {
    id: 4,
    title: "Exhibitor",
    link: "/exhibitor-registration?action=buy",
    target: "_self",
    children: [
      { id: 41, title: "Stand art work", link: "/Standartworktemplates", target: "_self", children: [] },
      { id: 42, title: "Book a Stand", link: "/exhibitor-registration", target: "_self", children: [] },
      { id: 43, title: "Our Exhibitors", link: "/exhibitors", target: "_self", children: [] },
      { id: 44, title: "Why Exhibit", link: "/why-exhibit", target: "_self", children: [] },
      { id: 45, title: "Stand and Packages", link: "/membership_packages", target: "_self", children: [] },
      { id: 46, title: "Exhibitor Guide", link: "/magazine?id=192", target: "_self", children: [] },
      { id: 47, title: "Glimpse of the show", link: "/glimpse-of-the-show", target: "_self", children: [] },
      { id: 48, title: "Exhibitor Login", link: "/members/index", target: "_self", children: [] },
    ],
  },
  {
    id: 5,
    title: "Speakers",
    link: "/view_speaker",
    target: "_self",
    children: [
      { id: 51, title: "Speaker Registration", link: "/speaker_registration", target: "_self", children: [] },
      { id: 52, title: "Our Speakers", link: "/view_speaker", target: "_self", children: [] },
      { id: 53, title: "Speaker Schedule", link: "/event_schedule", target: "_self", children: [] },
      { id: 54, title: "Speaker Guide", link: "#", target: "_self", children: [] },
    ],
  },
  {
    id: 6,
    title: "Sponsors",
    link: "/sponsors",
    target: "_self",
    children: [
      { id: 61, title: "Our Sponsors", link: "/our_sponsor", target: "_self", children: [] },
      { id: 62, title: "Request for Sponsorship", link: "/sponsor_registration", target: "_self", children: [] },
      { id: 63, title: "Sponsorship Guide", link: "/", target: "_self", children: [] },
      { id: 64, title: "Why Sponsor", link: "/why-sponsor", target: "_self", children: [] },
      { id: 65, title: "Sponsorship Options", link: "/sponsor_opportunity", target: "_self", children: [] },
    ],
  },
  {
    id: 7,
    title: "What's on",
    link: "#",
    target: "_self",
    children: [
      { id: 71, title: "Addon Services", link: "/event-services", target: "_self", children: [] },
      { id: 72, title: "Exhibitor Information", link: "/exhibitor-information", target: "_self", children: [] },
      { id: 73, title: "Webinars", link: "/webinars", target: "_self", children: [] },
      { id: 74, title: "Masterclass", link: "/masterclass", target: "_self", children: [] },
      { id: 75, title: "Speed Networking", link: "/networking", target: "_self", children: [] },
      { id: 76, title: "Vip Lounge", link: "/vip-lounge", target: "_self", children: [] },
      { id: 77, title: "Seminars", link: "/seminars", target: "_self", children: [] },
      { id: 78, title: "Live Workshop", link: "/live-workshop", target: "_self", children: [] },
      { id: 79, title: "Keynote Sessions", link: "/keynote", target: "_self", children: [] },
      { id: 710, title: "Buy Conference Pass", link: "/buy_tickets", target: "_self", children: [] },
      { id: 711, title: "FAQs", link: "/frequently-asked-questions", target: "_self", children: [] },
    ],
  },
  {
    id: 8,
    title: "Login",
    link: "#",
    target: "_self",
    children: [
      { id: 81, title: "Speaker Login", link: "/members/index", target: "_self", children: [] },
      { id: 82, title: "Visitor Login", link: "/enter-the-show", target: "_self", children: [] },
      { id: 83, title: "Exhibitor Login", link: "/members/index", target: "_self", children: [] },
    ],
  },
  {
    id: 9,
    title: "Event Experience",
    link: "/event_experience",
    target: "_blank",
    children: [],
  },
  {
    id: 10,
    title: "About",
    link: "#",
    target: "_self",
    children: [
      { id: 101, title: "Speaker Questionnaires", link: "/speaker-questionaire", target: "_self", children: [] },
      { id: 102, title: "Sponsorship Opportunity", link: "/sponsor_opportunity", target: "_self", children: [] },
      { id: 103, title: "Glimpse of the show", link: "/glimpse-of-the-show", target: "_self", children: [] },
      { id: 104, title: "Show guide", link: "/magazine?id=192", target: "_self", children: [] },
      { id: 105, title: "Gallery", link: "/view_gallery", target: "_self", children: [] },
      { id: 106, title: "Knowledge Center", link: "/articles", target: "_self", children: [] },
      { id: 107, title: "View All Exhibitor", link: "/exhibitors", target: "_self", children: [] },
      { id: 108, title: "View All Speakers", link: "/view_speaker", target: "_self", children: [] },
      { id: 109, title: "View All Sponsors", link: "/view_sponsor", target: "_self", children: [] },
      { id: 110, title: "View Industry List", link: "/view_industry_list", target: "_self", children: [] },
    ],
  },
  {
    id: 11,
    title: "Past Events",
    link: "#",
    target: "_self",
    children: [
      { id: 111, title: "Digital Age Expo July 2021", link: "https://july.digitalageexpo.com/", target: "_blank", children: [] },
      { id: 112, title: "Digital Age Expo Nov 2021", link: "https://november.digitalageexpo.com/", target: "_blank", children: [] },
    ],
  },
  {
    id: 12,
    title: "Contact Us",
    link: "/contact",
    target: "_self",
    children: [],
  },
];

/** Legacy multi-domain gate, inherited from class_menu_links.php: a row with a blank/null
 * domain_id applies everywhere; otherwise it applies only if its comma-separated domain_id
 * list includes this site's DOMAIN_ID. Exported so menuLinksRepository.ts (the CP's Menu
 * Manager) can scope its own listing the same way — without this, the Menu Manager shows
 * every domain's rows mixed together (727 of them, from the shared legacy install), not just
 * this site's. */
export function appliesToDomain(domainId: string | null): boolean {
  if (!domainId || domainId.trim() === "") return true;
  return domainId
    .split(",")
    .map((id) => id.trim())
    .includes(String(DOMAIN_ID));
}

function resolveLink(link: string): string {
  if (!link) return "#";
  let clean = link.replace(/^https?:\/\/(www\.)?digitalageexpo\.com/, "");
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (!clean.startsWith("/") && !clean.startsWith("#") && !clean.startsWith("?")) {
    clean = `/${clean}`;
  }
  return clean || "/";
}

/** CMS-managed navigation (find_menu_links), mirrors class_menu_links.php::getLinks(). */
export async function getMenu(): Promise<MenuItem[]> {
  try {
    const rows = await prisma.find_menu_links.findMany({
      where: { active: 1, logged_out: 1 },
      orderBy: { ordering: "asc" },
      select: {
        id: true,
        title: true,
        link: true,
        target: true,
        parent_id: true,
        domain_id: true,
      },
    });

    const visible = rows.filter((row: any) => appliesToDomain(row.domain_id));

    if (visible.length >= 3) {
      const byId = new Map<number, MenuItem>();
      for (const row of visible) {
        byId.set(row.id, {
          id: row.id,
          title: row.title,
          link: resolveLink(row.link),
          target: row.target || "_self",
          children: [],
        });
      }

      const roots: MenuItem[] = [];
      for (const row of visible) {
        const item = byId.get(row.id)!;
        if (row.parent_id && byId.has(row.parent_id)) {
          byId.get(row.parent_id)!.children.push(item);
        } else if (!row.parent_id) {
          roots.push(item);
        }
      }
      if (roots.length > 0) {
        return roots;
      }
    }
  } catch {
    // Fallback if DB query fails or is empty
  }

  return DEFAULT_MENU;
}