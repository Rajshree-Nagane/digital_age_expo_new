import { NextResponse } from "next/server";
import { requireEventMember } from "@/lib/auth/requireEventMember";
import { getListingOptionsForUser } from "@/lib/services/eventBannerStands";

export async function GET(request: Request) {
  const context = await requireEventMember();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const userIdStr = searchParams.get("userId");

  if (!userIdStr) {
    return NextResponse.json({ listings: [] });
  }

  const listings = await getListingOptionsForUser(Number(userIdStr));
  return NextResponse.json({ listings });
}
