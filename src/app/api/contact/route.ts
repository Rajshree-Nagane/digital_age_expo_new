import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomain } from "@/lib/services/domain";
import { contactEnquirySchema } from "@/lib/validations/contactEnquiry";
import fs from "fs";
import path from "path";

const BACKUP_FILE_PATH = path.join(process.cwd(), "src", "app", "api", "contact", "data.json");

// Helper to read backup contact records
function readBackupContacts() {
  try {
    if (!fs.existsSync(BACKUP_FILE_PATH)) {
      const dir = path.dirname(BACKUP_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(BACKUP_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading contact backup:", err);
    return [];
  }
}

// Helper to write backup contact records
function writeBackupContacts(data: any[]) {
  try {
    const dir = path.dirname(BACKUP_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing contact backup:", err);
    return false;
  }
}

export async function GET() {
  try {
    const contacts = readBackupContacts();
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const domain = await getDomain();
    const { first_name, last_name, email, contact, message } = parsed.data;

    let enquiryId = "enq_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // Try creating via Prisma
    try {
      const enquiry = await prisma.find_user_enquiry.create({
        data: {
          first_name,
          last_name: last_name || null,
          name: [first_name, last_name].filter(Boolean).join(" "),
          email,
          contact: contact || null,
          message,
          event_id: domain.event_id,
          source_domain: domain.name,
          years_experiece: "",
          status: "new",
          assigned_sales_user: 0,
          exhibit_in_show: "",
        },
        select: { id: true },
      });

      if (enquiry && enquiry.id) {
        enquiryId = String(enquiry.id);
      }
    } catch (dbError) {
      console.warn("[API Contact] Failed to save in main database, using fallback ID:", dbError);
    }

    // Always save to backup JSON file for reliable tracking
    const backupData = readBackupContacts();
    const newEntry = {
      id: enquiryId,
      first_name,
      last_name: last_name || "",
      email,
      contact: contact || "",
      message,
      created_at: new Date().toISOString(),
    };
    backupData.push(newEntry);
    writeBackupContacts(backupData);

    return NextResponse.json({ success: true, id: enquiryId });
  } catch (error: any) {
    console.error("POST Error in contact API:", error);
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 });
  }
}

