import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { setNewsFeedImage } from "@/lib/services/eventNewsFeed";
import { IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES } from "@/lib/validations/eventTodoList";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/**
 * Mirrors news_feed.php's image handling:
 *   copy($data['image']['tmp_name'], FILES_PATH.'/files/feeds/'.$id.'.'.$ext)
 * — one file per row, named after the row's own id, so the row must be saved
 * before its image can be uploaded.
 */
export async function POST(request: Request) {
  const context = await requireEventMember(request);
  if ("error" in context) return context.error;

  if (context.role !== "organiser") {
    return NextResponse.json(
      { error: "Only the event organiser can upload feed images." },
      { status: 403 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const idRaw = form.get("id");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  const id = Number(idRaw);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Missing or invalid id. Save the feed before uploading an image." },
      { status: 400 },
    );
  }
  if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Only JPG, PNG, GIF, or WEBP images are allowed." }, { status: 400 });
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const ext = EXTENSION_BY_MIME[file.type] ?? "jpg";
  const filename = `${id}.${ext}`;
  const diskPath = path.join(process.cwd(), "public", "files", "feeds", filename);
  const publicUrl = `/files/feeds/${filename}`;

  try {
    await mkdir(path.dirname(diskPath), { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, bytes);
  } catch (err) {
    console.error("[news-feed/upload] failed to write file:", err);
    return NextResponse.json({ error: "Could not save the uploaded image." }, { status: 500 });
  }

  const result = await setNewsFeedImage(context, id, publicUrl);
  if (result.count === 0) {
    return NextResponse.json({ error: "Feed not found for this event." }, { status: 404 });
  }

  return NextResponse.json({ success: true, url: `${publicUrl}?v=${Date.now()}` });
}
