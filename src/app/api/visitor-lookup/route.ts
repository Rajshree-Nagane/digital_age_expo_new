import { NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/lib/services/domain";
import { lookupVisitorByEmail } from "@/lib/services/freeTicket";

const schema = z.object({ email: z.string().trim().email() });

/** Passwordless "Visitor Login" lookup used by the `?view=virtual-event` entry modal on the homepage. */
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const domain = await getDomain();
  if (!domain.event_id) {
    return NextResponse.json({ error: "No event is configured for this site." }, { status: 400 });
  }

  const result = await lookupVisitorByEmail(domain.event_id, parsed.data.email);
  return NextResponse.json(result);
}
