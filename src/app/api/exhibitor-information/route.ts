import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = await getDomain();
    const eventId = domain.event_id || 1474;

    const {
      business,
      first_name,
      last_name,
      email,
      phone,
      about_us,
      facebook,
      linkedin,
      instagram,
      twitter,
      website,
      whatsapp,
      calendy_url,
      zoom_meeting,
      youtube_url,
      exhibition_zone_id,
      package_id,
      graphics_services,
    } = body;

    if (!business || !first_name || !last_name || !email || !phone) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    // Upsert or create exhibitor info
    const exhibitor = await prisma.find_event_exhibitor.create({
      data: {
        event_id: eventId,
        batch_number: `EXH-INFO-${Date.now()}`,
        name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        business,
        email,
        phone,
        linkedin_user_profile: linkedin || null,
        status: "submitted",
      },
    });

    return NextResponse.json({ success: true, id: exhibitor.id, message: "Exhibitor information successfully submitted!" });
  } catch (err: unknown) {
    console.error("Exhibitor information submission error:", err);
    return NextResponse.json({ error: "Failed to submit exhibitor information. Please try again." }, { status: 500 });
  }
}
