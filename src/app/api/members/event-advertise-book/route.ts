import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = Number(searchParams.get("eventId"));
    const id = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    // Fetch single record for edit
    if (id) {
      const record = await prisma.find_events_book.findUnique({
        where: { id: Number(id) }
      });
      return NextResponse.json(record);
    }

    // Fetch list of magazines for event
    const records = await prisma.find_events_book.findMany({
      where: { event_id: eventId },
      orderBy: { id: 'desc' }
    });

    const books = await prisma.find_advertise_books.findMany({
      where: { status: 1 } // Note: original code checks status=1
    });

    // We'll join them in code since Prisma might not have the relation configured properly
    const enrichedRecords = records.map((r: any) => {
      const book = books.find((b: any) => b.id === r.book_id);
      return {
        ...r,
        book_title: book?.book_title || "Unknown Book",
        is_static: book?.is_static || 0,
        page_format: book?.page_format || 0
      };
    }).filter((r: any) => r.book_title !== "Unknown Book"); // only keep if book matches status=1

    // Also fetch available books for the dropdown
    return NextResponse.json({ records: enrichedRecords, books });

  } catch (error: any) {
    console.error("GET event_advertise_book Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, book_id, title, publication_type, issue_link, publication_title_id } = body;

    const existing = await prisma.find_events_book.findFirst({
      where: { event_id: Number(event_id), book_id: Number(book_id) }
    });

    if (existing) {
      return NextResponse.json({ error: "Magazine already added for this event" }, { status: 400 });
    }

    const created = await prisma.find_events_book.create({
      data: {
        event_id: Number(event_id),
        book_id: Number(book_id),
        title,
        publication_type,
        issue_link: issue_link || "",
        publication_pdf: "",
        status: "active",
        publication_title_id,
        is_generated: false,
        generated_pdf: null
      }
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("POST event_advertise_book Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, book_id, title, publication_type, issue_link, publication_title_id } = body;

    const updated = await prisma.find_events_book.update({
      where: { id: Number(id) },
      data: {
        book_id: Number(book_id),
        title,
        publication_type,
        issue_link: issue_link || "",
        publication_title_id,
        status: "active"
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT event_advertise_book Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === "lock") {
      const updated = await prisma.find_events_book.update({
        where: { id: Number(id) },
        data: { is_generated: true }
      });
      return NextResponse.json(updated);
    }
    
    if (action === "activate" || action === "deactivate") {
      const updated = await prisma.find_events_book.update({
        where: { id: Number(id) },
        data: { status: action === "activate" ? "active" : "inactive" }
      });
      return NextResponse.json(updated);
    }
    
    // generate magazine placeholder logic
    if (action === "generate") {
      // In real backend, this would generate PDF
      // For now we just mark it as generated or update generated_pdf
      const record = await prisma.find_events_book.findUnique({ where: { id: Number(id) } });
      const book = await prisma.find_advertise_books.findUnique({ where: { id: Number(record?.book_id) } });
      
      const updated = await prisma.find_events_book.update({
        where: { id: Number(id) },
        data: { 
          is_generated: true,
          generated_pdf: book?.uploaded_path || "generated.pdf"
        }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH event_advertise_book Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
