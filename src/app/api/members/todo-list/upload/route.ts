import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { UPLOAD_KINDS, IMAGE_UPLOAD_MIME_TYPES, IMAGE_UPLOAD_MAX_BYTES, type UploadKind } from "@/lib/validations/eventTodoList";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** One deterministic on-disk filename per (listing, kind), mirroring the legacy PHP's own
 * `copy($tmp, FILES_PATH.'/files/exhibitorAdvertise/fullpage_'.$listing_id.'.'.$ext)` style
 * naming — re-uploading the same kind for the same listing simply overwrites the old file. */
function buildStoragePath(kind: UploadKind, listingId: number, ext: string): { diskPath: string; publicUrl: string } {
  const filename =
    kind === "logo"
      ? `${listingId}.${ext}`
      : kind === "advertise_image"
        ? `${listingId}.${ext}`
        : `${kind.toLowerCase()}page_${listingId}.${ext}`;

  const category = kind === "logo" ? "logo" : "exhibitorAdvertise";
  const diskPath = path.join(process.cwd(), "public", "files", category, filename);
  const publicUrl = `/files/${category}/${filename}`;
  return { diskPath, publicUrl };
}

export async function POST(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  if (context.role !== "organiser" && context.role !== "exhibitor") {
    return NextResponse.json({ error: "Only organisers and exhibitors can upload images here." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kindRaw = form.get("kind");
  const listingIdRaw = form.get("listing_id");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (typeof kindRaw !== "string" || !UPLOAD_KINDS.includes(kindRaw as UploadKind)) {
    return NextResponse.json({ error: "Unrecognised upload kind." }, { status: 400 });
  }
  const listingId = Number(listingIdRaw);
  if (!listingId || !Number.isInteger(listingId) || listingId <= 0) {
    return NextResponse.json({ error: "Missing or invalid listing_id." }, { status: 400 });
  }
  if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Only JPG, PNG, GIF, or WEBP images are allowed." }, { status: 400 });
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const kind = kindRaw as UploadKind;
  const ext = EXTENSION_BY_MIME[file.type] ?? "jpg";
  const { diskPath, publicUrl } = buildStoragePath(kind, listingId, ext);

  try {
    await mkdir(path.dirname(diskPath), { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, bytes);
  } catch (err) {
    console.error("[todo-list/upload] failed to write file:", err);
    return NextResponse.json({ error: "Could not save the uploaded image." }, { status: 500 });
  }

  // Cache-bust so the browser re-fetches immediately after overwriting the same filename.
  return NextResponse.json({ success: true, url: `${publicUrl}?v=${Date.now()}` });
}
