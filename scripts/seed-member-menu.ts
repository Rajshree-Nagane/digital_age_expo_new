/**
 * Seeds find_event_menus with the REAL members-dashboard navigation — the same 7 tabs / 76
 * items that src/components/EventAdminNavbar now reads live via
 * src/lib/services/memberMenu.ts's getLiveMemberMenu() (this table used to be a dead-end the
 * live nav never read — that's now fixed, so what you edit in CP → Member Menu Manager is what
 * members actually see).
 *
 * Every item is seeded with ALL FIVE role flags true (visitor/organiser/exhibitor/sponsor/
 * speaker), matching the old hardcoded nav's actual behavior — every role saw the exact same
 * full menu. That's also this app's established convention for "unrestricted": see
 * getLiveMemberMenu()'s doc comment. Narrow specific items to specific roles afterwards in the
 * CP, on purpose, rather than that being an accidental side effect of this seed.
 *
 * Also backfills two previously-unused columns so the live nav's tab colors/icons match the
 * original hardcoded design: `attribute` (tab code, e.g. "LGTS") and `icon_mstr_cd` (tab icon
 * name) — see GROUP_META below.
 *
 * Safe to re-run: matches existing rows by (title, link, menu_group) and skips them, so manual
 * edits made afterwards in the CP aren't overwritten.
 *
 * Run with:
 *   npx tsx scripts/seed-member-menu.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

interface SeedItem {
  title: string;
  link: string;
  icon: string;
  color?: string;
  menu_type?: string;
  is_modal?: number;
  modal_name?: string;
}

interface SeedGroup {
  label: string;
  colorClass: string;
  /** Legacy tab code, backfilled into find_event_menus.attribute. */
  code: string;
  /** Tab-level icon name, backfilled into find_event_menus.icon_mstr_cd. */
  tabIcon: string;
  items: SeedItem[];
}

const GROUPS: SeedGroup[] = [
  {
    label: "View Event Summary",
    colorClass: "bg-brand-purple hover:bg-black",
    code: "LGTS",
    tabIcon: "Menu",
    items: [
      { title: "Event Summary", link: "/members/user_event_summary", icon: "Menu", color: "bg-brand-purple hover:bg-black" },
      { title: "View Public Event", link: "/members/event_show_info", icon: "Eye" },
      { title: "Marketing Tools", link: "/members/event_marketing_tools", icon: "Settings2" },
      { title: "Email Logs", link: "/members/event_mail_logs", icon: "Mail" },
      { title: "Letter Logs", link: "/members/event_letter_logs", icon: "Inbox" },
    ],
  },
  {
    label: "Setup Event",
    colorClass: "bg-brand-pink hover:bg-black",
    code: "LGTMM",
    tabIcon: "Settings",
    items: [
      { title: "Event Details", link: "/members/event_details", icon: "Settings" },
      { title: "Setup My Show Profile", link: "/members/event_todo_list", icon: "ZoomOut" },
      { title: "Setup Show Info", link: "/members/event_show_info", icon: "Info" },
      { title: "Setup About the Show", link: "/members/event_about_us", icon: "Indent" },
      { title: "Setup FAQs", link: "/members/event_faq", icon: "HelpCircle" },
      { title: "Setup Event Blog", link: "/members/user_blog", icon: "Newspaper" },
      { title: "Setup News Feed", link: "/members/news_feed", icon: "Rss" },
      { title: "Setup Event Tickets", link: "/members/event_ticket", icon: "Ticket" },
      { title: "Setup Event Schedule", link: "/members/event_schedule_meeting", icon: "Calendar" },
      { title: "Setup Sponsorship", link: "/members/event_sponsorship_setup", icon: "Settings" },
      { title: "Setup Trade stand", link: "/members/event_tradestand_setup", icon: "Wrench" },
      { title: "Manage Magazine Page Setup", link: "/members/event_magazine_setup", icon: "ListChecks" },
      {
        title: "Copy Event",
        link: "#",
        icon: "Copy",
        color: "bg-green-600 hover:bg-green-700",
        menu_type: "modal",
        is_modal: 1,
        modal_name: "copyEventModal",
      },
    ],
  },
  {
    label: "Configure Virtual Event",
    colorClass: "bg-brand-purple hover:bg-black",
    code: "LGTCL",
    tabIcon: "Wrench",
    items: [
      { title: "Configure Lobby", link: "/members/event_lobby_layout_manager", icon: "Building" },
      { title: "Configure Lobby Child", link: "/members/event_lobby_layout_child", icon: "Building2" },
      { title: "Configure Lobby Spots", link: "/members/event_lobby_spots", icon: "CircleDot" },
      { title: "Configure Lobby Welcome Tour", link: "/members/event_lobby_welcome_tour", icon: "Coffee" },
      { title: "Configure Lobby Assets", link: "/members/event_lobby_layout_type_assets", icon: "ListOrdered" },
      { title: "Configure Lobby Agenda", link: "/members/event_lobby_agenda_items", icon: "BookOpen" },
      { title: "Configure Lobby Polling", link: "/members/event_lobby_polling", icon: "Square" },
      { title: "Exhibitor Spots", link: "/members/event_lobby_spots_tabular", icon: "Building2" },
      { title: "Manage Registration Form", link: "/members/manage_registration", icon: "Square" },
      { title: "Event Menu", link: "/members/manage_event_menu", icon: "Menu" },
      { title: "Event Notification", link: "/members/event_notifications", icon: "Bell" },
      { title: "Networking Rooms", link: "/members/event_networking_room", icon: "Users" },
      { title: "Event Welcome Pack", link: "/members/event_welcome_pack", icon: "FileText" },
      { title: "Event Templates", link: "/members/event_lobby_templates", icon: "Files" },
    ],
  },
  {
    label: "Manage Events",
    colorClass: "bg-brand-pink hover:bg-black",
    code: "LGTME",
    tabIcon: "ListChecks",
    items: [
      { title: "Event Industry", link: "/members/view_industry_list", icon: "Factory" },
      { title: "Manage Leadership Boards", link: "/members/leadership_board", icon: "Bold" },
      { title: "Manage Agenda", link: "/members/event_lobby_agenda_items", icon: "BookOpen" },
      { title: "Manage My Team", link: "/members/event_member", icon: "UserPlus" },
      { title: "Manage Visitor", link: "/members/view_visitor", icon: "Users" },
      { title: "Manage Exhibitor", link: "/members/view_exhibitor", icon: "Users" },
      { title: "Manage Sponsorship", link: "/members/view_sponsor", icon: "LineChart" },
      { title: "Manage View Speaker Slots", link: "/members/manage_speaker_slots", icon: "Mic" },
      { title: "Manage Speaker", link: "/members/manage_speakers", icon: "Mic" },
      { title: "Manage Speaker Questionnaire", link: "/members/manage_speaker_questionaire", icon: "Mic" },
      { title: "Manage Banner Stand", link: "/members/manage_banner_stands", icon: "Map" },
      { title: "Manage Advertiser", link: "/members/manage_event_advertiser", icon: "Tv" },
      { title: "Manage Magazine", link: "/members/event_advertise_book", icon: "Newspaper" },
      { title: "Manage Partner", link: "/members/manage_awards_partner", icon: "Users" },
      { title: "Manage Marketer", link: "/members/manage_event_marketer", icon: "Tv" },
      { title: "Manage Publication Contacts", link: "/members/publication_contacts", icon: "UserPlus" },
      { title: "Manage Download", link: "/members/manage_event_download", icon: "Download" },
      { title: "Manage Artwork", link: "/members/manage_event_artwork", icon: "AlignCenter" },
      { title: "Manage Content Writing", link: "/members/manage_event_content_request", icon: "Edit" },
      { title: "Manage Promotions", link: "/members/manage_event_promotions", icon: "ArrowDownWideNarrow" },
      { title: "Manage Exhibitor Information", link: "/members/view_exhibitor_information", icon: "Users" },
      { title: "Manage Photos", link: "/members/manage_organiser_photos", icon: "Image" },
      { title: "Manage Videos", link: "/members/manage_organiser_videos", icon: "Clapperboard" },
      { title: "Manage Checklist", link: "/members/event_checklist", icon: "CheckSquare" },
      { title: "Manage Ticket Buyers", link: "/members/event_ticket_buyers", icon: "Users" },
    ],
  },
  {
    label: "Manage Virtual Booth",
    colorClass: "bg-black hover:bg-brand-purple",
    code: "LTGMVB",
    tabIcon: "Video",
    items: [
      { title: "Manage Lobby Visitor Enquires", link: "/members/event_lobby_visitor_enquires", icon: "Quote" },
      { title: "View My Booth", link: "/members/event_lobby_layout_manager?action=view_my_booth", icon: "Target" },
      { title: "Manage My Booth", link: "/members/manage_stand_assets", icon: "Briefcase" },
      { title: "Manage My Assets", link: "/members/manage_event_assets", icon: "Database" },
      { title: "Enter the show", link: "/members/event_lobby_layout_manager?action=view_lobby", icon: "Eye" },
      { title: "Change Auditorium link", link: "/members/event_lobby_layout_manager?action=change_auditiorium_link", icon: "Film" },
      { title: "Reports", link: "/members/reports", icon: "List" },
      { title: "Visitor Timeline", link: "/members/event_user_activity_report", icon: "LineChart" },
    ],
  },
  {
    label: "Manage Event Orders",
    colorClass: "bg-brand-purple hover:bg-brand-pink",
    code: "LGTBUY",
    tabIcon: "ShoppingCart",
    items: [
      { title: "Manage Orders", link: "/members/event_invoices", icon: "FileText" },
      { title: "View Invoices", link: "/members/event_invoices", icon: "StickyNote" },
      { title: "Buy Sponsorship", link: "/members/event_ticket", icon: "Home", color: "bg-red-600 hover:bg-red-700" },
      { title: "Buy Speaker Slot", link: "/members/manage_speakers", icon: "Megaphone", color: "bg-red-600 hover:bg-red-700" },
      { title: "Buy Banner Stand", link: "/members/manage_banner_stands", icon: "Bookmark", color: "bg-red-600 hover:bg-red-700" },
      { title: "Buy Advert", link: "/members/event_magazine_setup", icon: "Gem", color: "bg-red-600 hover:bg-red-700" },
      { title: "Buy Artwork", link: "/members/manage_event_artwork", icon: "Languages", color: "bg-red-600 hover:bg-red-700" },
      { title: "Buy Content Writing", link: "/members/manage_event_content_request", icon: "PenTool", color: "bg-red-600 hover:bg-red-700" },
    ],
  },
  {
    label: "Download Orders",
    colorClass: "bg-brand-pink hover:bg-black",
    code: "LTGDO",
    tabIcon: "ArrowDownCircle",
    items: [
      { title: "Download Purchase Order PDF", link: "/members/reports", icon: "ChevronDown" },
      { title: "Download Invoice PDF", link: "/members/reports", icon: "ChevronsDown" },
      { title: "Download Credit Note PDF", link: "/members/reports", icon: "ArrowDownCircle" },
    ],
  },
];

/** Strips the "/members" base and any query string, e.g. "/members/event_show_info?event_id=852" -> "event_show_info". */
function derivePageName(link: string): string {
  const withoutQuery = link.split("?")[0];
  const trimmed = withoutQuery.replace(/^\/*(members\/)?/, "").replace(/\/+$/, "");
  return trimmed || "link";
}

async function ensureItem(group: SeedGroup, item: SeedItem, sequence: number): Promise<void> {
  const existing = await prisma.find_event_menus.findFirst({
    where: { title: item.title, link: item.link, menu_group: group.label },
  });
  if (existing) return;

  await prisma.find_event_menus.create({
    data: {
      menu_type: item.menu_type ?? "link",
      title: item.title,
      color: item.color ?? group.colorClass,
      sequence,
      event_category: "default",
      icon: item.icon,
      icon_mstr_cd: group.tabIcon,
      page_name: derivePageName(item.link),
      link: item.link,
      is_modal: item.is_modal ?? 0,
      modal_name: item.modal_name ?? null,
      visitor: true,
      organiser: true,
      exhibitor: true,
      sponsor: true,
      speaker: true,
      partner: 1,
      marketer: 1,
      visible: true,
      attribute: group.code,
      menu_group: group.label,
    },
  });
  console.log(`Created "${item.title}" (${group.label})`);
}

async function main() {
  console.log("Seeding find_event_menus with the real members-dashboard navigation...");
  for (const group of GROUPS) {
    let sequence = 1;
    for (const item of group.items) {
      await ensureItem(group, item, sequence);
      sequence += 1;
    }
  }
  const total = await prisma.find_event_menus.count();
  console.log(`\nDone. find_event_menus now has ${total} row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
