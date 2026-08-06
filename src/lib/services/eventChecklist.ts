import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";

export type ChecklistSection = "pre" | "at" | "post";

const SECTION_TYPE_CD: Record<ChecklistSection, string> = {
  pre: "CLTPRE",
  at: "CLTAE",
  post: "CLTPE",
};

export const SECTION_LABELS: Record<ChecklistSection, string> = {
  pre: "Pre Event Checklist",
  at: "At The Show Checklist",
  post: "Post Event Checklist",
};

export interface ChecklistItem {
  code: string;
  name: string;
  description: string | null;
  value: boolean;
}

export interface ChecklistSectionData {
  section: ChecklistSection;
  label: string;
  items: ChecklistItem[];
  percentComplete: number;
}

/** Mirrors members/event_checklist.php — organiser-only Yes/No checklist across three phases
 * of running the event. The legacy page also narrows items down by the event's industry
 * category (find_event_category_checklist); that join is skipped here for simplicity, so this
 * shows the full master checklist item set rather than a category-narrowed subset. */
export async function getChecklist(context: EventMemberContext): Promise<ChecklistSectionData[]> {
  if (context.role !== "organiser") return [];

  const savedRows = await prisma.find_event_checklists.findMany({
    where: { event_id: context.eventId, user_id: context.userId },
    select: { task_cd: true, value: true },
  });
  const savedByCode = new Map<string, string | null>(savedRows.map((r: any) => [r.task_cd, r.value]));

  const sections = await Promise.all(
    (Object.keys(SECTION_TYPE_CD) as ChecklistSection[]).map(async (section) => {
      const configs = await prisma.find_checklist_item_config.findMany({
        where: { checklist_type_cd: SECTION_TYPE_CD[section], status: "enabled" },
        select: { checklist_item_id: true },
      });
      const itemIds = [...new Set(configs.map((c: any) => c.checklist_item_id).filter((v: any): v is number => !!v))];

      const masters =
        itemIds.length > 0
          ? await prisma.independent_mst.findMany({
              where: { id: { in: itemIds } },
              orderBy: { sequence: "asc" },
              select: { mstr_cd: true, mstr_nm: true, mstr_desc: true },
            })
          : [];

      const items: ChecklistItem[] = masters
        .filter((m: any) => m.mstr_cd)
        .map((m: any) => ({
          code: m.mstr_cd,
          name: m.mstr_nm,
          description: m.mstr_desc,
          value: savedByCode.get(m.mstr_cd) === "Yes",
        }));

      const completed = items.filter((i) => i.value).length;
      const percentComplete = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

      return { section, label: SECTION_LABELS[section], items, percentComplete };
    })
  );

  return sections;
}

export async function saveChecklistSection(context: EventMemberContext, values: Record<string, boolean>) {
  if (context.role !== "organiser") return { ok: false as const, error: "Only the event organiser can update this checklist." };

  await Promise.all(
    Object.entries(values).map(([code, value]) =>
      prisma.find_event_checklists.upsert({
        where: { event_id_user_id_task_cd: { event_id: context.eventId, user_id: context.userId, task_cd: code } },
        update: { value: value ? "Yes" : "No" },
        create: { event_id: context.eventId, user_id: context.userId, task_cd: code, value: value ? "Yes" : "No" },
      })
    )
  );

  return { ok: true as const };
}
