import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import {
  DEFAULT_FORM_POSITION,
  type RegisterFormPositionInput,
} from "@/lib/validations/eventConfiguration";

/**
 * ---------------------------------------------------------------------------
 * find_event_configurations — port of legacy members/event_configurations.php
 * ---------------------------------------------------------------------------
 *
 * Raw SQL for the same reason as eventRegistrationFields.ts: the table is not in
 * prisma/schema.prisma, and inventing a model for a table whose real column
 * types can't be inspected from here risks disagreeing with the live database.
 * Create it with `npm run db:event-configurations`.
 */

export interface EventConfigurationRow {
  eventId: number;
  registerFormX: number;
  registerFormY: number;
  textColor: string | null;
  borderColor: string | null;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Returns the event's saved layout, or the defaults when no row exists yet.
 * Never throws for "no row" — a brand-new event simply has nothing saved.
 */
export async function getEventConfiguration(
  eventId: number,
): Promise<EventConfigurationRow> {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT event_id, register_form_x_position, register_form_y_position,
           register_page_text_color, register_page_border_color
      FROM find_event_configurations
     WHERE event_id = ${eventId}
     LIMIT 1
  `;

  const row = rows[0];
  return {
    eventId,
    registerFormX: toNumber(row?.register_form_x_position, DEFAULT_FORM_POSITION.register_form_x_position),
    registerFormY: toNumber(row?.register_form_y_position, DEFAULT_FORM_POSITION.register_form_y_position),
    textColor: row?.register_page_text_color ?? null,
    borderColor: row?.register_page_border_color ?? null,
  };
}

/**
 * Upsert of the dragged position.
 *
 * The legacy handler wrote the SAME x/y into both the register_* and login_*
 * columns, because one draggable box represents both screens — that behaviour is
 * kept, so the login form stays wherever the register form was placed.
 *
 * Relies on the unique index on event_id created by
 * scripts/create-event-configurations-table.ts; without it, ON CONFLICT has no
 * arbiter and concurrent saves would insert duplicate rows.
 */
export async function saveRegisterFormPosition(
  context: EventMemberContext,
  input: RegisterFormPositionInput,
): Promise<void> {
  const { register_form_x_position: x, register_form_y_position: y } = input;

  await prisma.$executeRaw`
    INSERT INTO find_event_configurations
      (event_id, register_form_x_position, register_form_y_position,
       login_form_x_position, login_form_y_position)
    VALUES (${context.eventId}, ${x}, ${y}, ${x}, ${y})
    ON CONFLICT (event_id) DO UPDATE
       SET register_form_x_position = EXCLUDED.register_form_x_position,
           register_form_y_position = EXCLUDED.register_form_y_position,
           login_form_x_position    = EXCLUDED.login_form_x_position,
           login_form_y_position    = EXCLUDED.login_form_y_position
  `;
}

/**
 * The registration background images for an event.
 *
 * Fetched here with its own narrow query rather than by widening
 * getEventById()'s select list: that selector is shared by pages across the
 * whole site, and these three columns are only ever needed on this screen.
 *
 * `find_events` IS a real Prisma model, so this one uses the typed client.
 */
export async function getEventRegisterBackgrounds(eventId: number): Promise<{
  desktop: string | null;
  mobile: string | null;
  parkingSlide: string | null;
}> {
  const event = await prisma.find_events.findUnique({
    where: { id: eventId },
    select: {
      register_page_image: true,
      register_page_mob_image: true,
      parking_slide_image: true,
    },
  });

  return {
    desktop: event?.register_page_image ?? null,
    mobile: event?.register_page_mob_image ?? null,
    parkingSlide: event?.parking_slide_image ?? null,
  };
}

/**
 * The fields previewed inside the draggable box.
 *
 * Mirrors the PHP: the event's own active fields, falling back to the default
 * template set when the event has none configured yet.
 */
export interface PreviewField {
  fieldName: string;
  fieldVariable: string;
  fieldType: string;
  isRequired: boolean;
  options: string[];
}

function parseOptions(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter((o) => o.trim() !== "") : [];
  } catch {
    return [];
  }
}

export async function listActiveRegistrationFields(eventId: number): Promise<PreviewField[]> {
  let rows = await prisma.$queryRaw<any[]>`
    SELECT field_name, field_variable, field_type, is_required, options
      FROM find_event_registration_fields
     WHERE event_id = ${eventId} AND is_active = 1
     ORDER BY id ASC
  `;

  if (rows.length === 0) {
    rows = await prisma.$queryRaw<any[]>`
      SELECT field_name, field_variable, field_type, is_required, options
        FROM find_event_registration_fields
       WHERE is_default = 1 AND is_active = 1
       ORDER BY id ASC
    `;
  }

  return rows
    // The legacy form builder skips `password` on this screen — the preview is of
    // the visitor registration box, which doesn't collect one here.
    .filter((r: any) => r.field_variable !== "password")
    .map((r: any) => ({
      fieldName: r.field_name ?? "",
      fieldVariable: r.field_variable ?? "",
      fieldType: r.field_type ?? "text",
      isRequired: r.is_required === 1 || r.is_required === true || r.is_required === "1",
      options: parseOptions(r.options),
    }));
}
