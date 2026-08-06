import { prisma } from "@/lib/prisma";

export interface EventPhaseItem {
  id: number;
  code: string;
  name: string;
  color: string;
  displayOrder: number;
}

export interface EventScheduleItem {
  id: number;
  eventId: number;
  eventCategoryId: number;
  name: string;
  code: string;
  phaseName: string;
  startDate: string; // YYYY-MM-DD or ISO
  endDate: string;
  scheduleDate: string;
  color: string;
  description?: string;
}

export interface EventScheduleData {
  event: {
    id: number;
    title: string;
    dateStart: string | null;
    dateEnd: string | null;
    lockSchedule: boolean;
  };
  phases: EventPhaseItem[];
  schedules: EventScheduleItem[];
}

const DEFAULT_PHASES: EventPhaseItem[] = [
  { id: 1, code: "nomination_phase", name: "Nomination Phase", color: "var(--color-blue-500)", displayOrder: 1 },
  { id: 2, code: "application_phase", name: "Application Phase", color: "var(--color-emerald-500)", displayOrder: 2 },
  { id: 3, code: "semi_finalist_judging", name: "Semi Finalist Judging", color: "var(--color-amber-500)", displayOrder: 3 },
  { id: 4, code: "finalist_judging", name: "Finalist Judging", color: "var(--color-violet-500)", displayOrder: 4 },
  { id: 5, code: "public_voting", name: "Public Voting", color: "var(--color-pink-500)", displayOrder: 5 },
  { id: 6, code: "awarding_ceremony", name: "Awarding Ceremony", color: "var(--color-red-500)", displayOrder: 6 },
  { id: 7, code: "closing", name: "Closing", color: "var(--color-gray-500)", displayOrder: 7 },
];

export async function getEventScheduleData(eventId: number): Promise<EventScheduleData> {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      date_start: true,
      date_end: true,
      lock_event_schedule: true,
    },
  });

  const eventTitle = event?.title || `Event #${eventId}`;
  const dateStart = event?.date_start ? event.date_start.toISOString() : null;
  const dateEnd = event?.date_end ? event.date_end.toISOString() : null;
  const lockSchedule = Boolean(event?.lock_event_schedule);

  // Query find_event_phases
  const rawPhases = await prisma.find_event_phases.findMany({
    orderBy: { display_order: "asc" },
  });

  let phases: EventPhaseItem[] = [];
  if (rawPhases.length > 0) {
    phases = rawPhases.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      color: p.color || "var(--color-violet-500)",
      displayOrder: p.display_order || 0,
    }));
  } else {
    phases = DEFAULT_PHASES;
  }

  // Query event_schedules
  const rawSchedules = await prisma.event_schedules.findMany({
    where: { event_id: eventId },
    orderBy: { start_date: "asc" },
  });

  const schedules: EventScheduleItem[] = rawSchedules.map((s) => ({
    id: s.id,
    eventId: s.event_id,
    eventCategoryId: s.event_category_id || 1,
    name: s.name,
    code: s.code || s.name.toLowerCase().replace(/\s+/g, "_"),
    phaseName: s.phase_name || s.name,
    startDate: s.start_date ? s.start_date.toISOString() : new Date().toISOString(),
    endDate: s.end_date ? s.end_date.toISOString() : new Date().toISOString(),
    scheduleDate: s.schedule ? s.schedule.toISOString() : new Date().toISOString(),
    color: s.color || "var(--color-violet-500)",
    description: s.description || "",
  }));

  return {
    event: {
      id: eventId,
      title: eventTitle,
      dateStart,
      dateEnd,
      lockSchedule,
    },
    phases,
    schedules,
  };
}

export async function autoScheduleByEventId(eventId: number) {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: { date_start: true, date_end: true, lock_event_schedule: true },
  });

  if (event?.lock_event_schedule) {
    throw new Error("Event schedule is locked and cannot be altered.");
  }

  const start = event?.date_start ? new Date(event.date_start) : new Date();
  const end = event?.date_end
    ? new Date(event.date_end)
    : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

  const rawPhases = await prisma.find_event_phases.findMany({
    orderBy: { display_order: "asc" },
  });

  const phases = rawPhases.length > 0 ? rawPhases : DEFAULT_PHASES;
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPerPhase = Math.max(1, Math.floor(totalDays / phases.length));

  // Clear existing
  await prisma.event_schedules.deleteMany({
    where: { event_id: eventId },
  });

  let currentStart = new Date(start);
  let createdCount = 0;

  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const phaseEnd = new Date(currentStart.getTime() + daysPerPhase * 24 * 60 * 60 * 1000);

    await prisma.event_schedules.create({
      data: {
        event_id: eventId,
        event_category_id: ("event_category_id" in p && p.event_category_id) ? p.event_category_id : 1,
        name: p.name,
        code: p.code,
        phase_name: p.name,
        display_order: "display_order" in p ? p.display_order : i + 1,
        start_date: currentStart,
        end_date: phaseEnd,
        schedule: currentStart,
        color: p.color || "var(--color-violet-500)",
        allDay: true,
      },
    });

    createdCount++;
    currentStart = new Date(phaseEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  return { insertedCount: createdCount };
}

export async function resetScheduleByEventId(eventId: number) {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: { lock_event_schedule: true },
  });

  if (event?.lock_event_schedule) {
    throw new Error("Event schedule is locked and cannot be reset.");
  }

  await prisma.event_schedules.deleteMany({
    where: { event_id: eventId },
  });

  return { success: true };
}

export async function createOrUpdateEventSchedule(eventId: number, data: any) {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: { lock_event_schedule: true },
  });

  if (event?.lock_event_schedule) {
    throw new Error("Event schedule is locked and cannot be edited.");
  }

  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const endDate = data.endDate ? new Date(data.endDate) : startDate;

  if (data.id) {
    return prisma.event_schedules.update({
      where: { id: Number(data.id) },
      data: {
        name: data.name || data.scheduleTask || "Schedule Task",
        code: data.code || data.scheduleName || "task_code",
        phase_name: data.phaseName || data.name || "Phase",
        start_date: startDate,
        end_date: endDate,
        schedule: startDate,
        color: data.color || "var(--color-violet-500)",
        updated_at: new Date(),
      },
    });
  }

  return prisma.event_schedules.create({
    data: {
      event_id: eventId,
      event_category_id: data.eventCategoryId ? Number(data.eventCategoryId) : 1,
      name: data.name || data.scheduleTask || "Schedule Task",
      code: data.code || data.scheduleName || "task_code",
      phase_name: data.phaseName || data.name || "Phase",
      start_date: startDate,
      end_date: endDate,
      schedule: startDate,
      color: data.color || "var(--color-violet-500)",
      allDay: true,
    },
  });
}

export async function deleteEventScheduleItem(eventId: number, id: number) {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: { lock_event_schedule: true },
  });

  if (event?.lock_event_schedule) {
    throw new Error("Event schedule is locked.");
  }

  return prisma.event_schedules.deleteMany({
    where: { id, event_id: eventId },
  });
}
