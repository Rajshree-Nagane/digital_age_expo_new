import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { eventCopySchema } from "@/lib/validations/eventCopy";
import { IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES } from "@/lib/validations/eventTodoList";
import { copyEvent, setEventImage } from "@/lib/services/eventDetails";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/**
 * Mirrors members/user_events.php's "Copy Event" modal (copy_title / copy_friendly_url /
 * copy_image / copy_date_start / copy_date_end) — duplicates the event named by `?event_id=`
 * into a brand new find_events row and returns its id.
 */
export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json({ error: "Only the event organiser can copy this event." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = eventCopySchema.safeParse({
    title: form.get("title"),
    friendly_url: form.get("friendly_url"),
    date_start: form.get("date_start"),
    date_end: form.get("date_end"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Only JPG, PNG, GIF, or WEBP images are allowed." }, { status: 400 });
    }
    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }
  }

  let newEvent;
  try {
    newEvent = await copyEvent(context, parsed.data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not copy this event." },
      { status: 400 }
    );
  }

  // Best-effort: the event itself is already created at this point, so a failure here shouldn't
  // fail the whole request — it just means the copy keeps the source event's image for now.
  if (file instanceof File && file.size > 0) {
    try {
      const ext = EXTENSION_BY_MIME[file.type] ?? "jpg";
      const filename = `event_${newEvent.id}.${ext}`;
      const diskPath = path.join(process.cwd(), "public", "images", "events", filename);
      await mkdir(path.dirname(diskPath), { recursive: true });
      await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
      await setEventImage(newEvent.id, ext, filename);
    } catch (err) {
      console.error("[event-details/copy] failed to save the uploaded image:", err);
    }
  }

  return NextResponse.json({ success: true, event: newEvent });
}
