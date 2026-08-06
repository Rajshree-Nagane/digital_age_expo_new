import { prisma } from "@/lib/prisma";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import type { EventExhibitorAdminInput } from "@/lib/validations/eventExhibitorAdmin";

export interface ExhibitorAdminRow {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  workPhone: string | null;
  business: string | null;
  position: string | null;
  website: string | null;
  linkedinUserProfile: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  whatsappNo: string | null;
  zoom: string | null;
  calendly: string | null;
  youtube: string | null;
  aboutUs: string | null;
  standNumber: string | null;
  standSize: string | null;
  standPrice: number | null;
  discount: number | null;
  charitableAmount: number | null;
  exchangeAmount: number | null;
  exchangeServices: boolean;
  featured: boolean;
  memberCompanyProfile: boolean;
  excludedFromAdvertise: boolean;
  enableVideoCalling: boolean;
  videoCallingSoftwareProvider: string | null;
  videoCallUrl: string | null;
  specialInstructions: string | null;
  referralCode: string | null;
  referralMstrId: string | null;
  referrerFrom: string | null;
  keynoteSpeechTopic: string | null;
  isWebinars: boolean;
  isWorkshops: boolean;
  isBusinessPresentation: boolean;
  isEMagazine: boolean;
  isNewsletter: boolean;
  visitorNotificationMail: boolean;
  status: string;
  joiningStatus: string | null;
  orderId: number | null;
  telecallingGradeId: string | null;
  batchNumber: string | null;
}

export interface ExhibitorStats {
  total: number;
  registered: number;
  interested: number;
  reserved: number;
  pending: number;
  notInterested: number;
  joinedAccounts: number;
  pendingAccounts: number;
  noStandNumber: number;
  noStandPrice: number;
  noStandSize: number;
  noOrder: number;
  uncontacted: number;
}

const SELECT_FIELDS = {
  id: true,
  first_name: true,
  last_name: true,
  name: true,
  email: true,
  phone: true,
  work_phone: true,
  business: true,
  position: true,
  website: true,
  linkedin_user_profile: true,
  facebook: true,
  twitter: true,
  instagram: true,
  whatsapp_no: true,
  zoom: true,
  calendly: true,
  youtube: true,
  about_us: true,
  stand_number: true,
  stand_size: true,
  stand_price: true,
  discount: true,
  charitable_amount: true,
  exchange_amount: true,
  exchange_services: true,
  featured: true,
  member_company_profile: true,
  excluded_from_advertise: true,
  enable_video_calling: true,
  video_calling_software_provider: true,
  video_call_url: true,
  special_instructions: true,
  referral_code: true,
  referral_mstr_id: true,
  referrer_from: true,
  keynote_speech_topic: true,
  is_webinars: true,
  is_workshops: true,
  is_business_presentation: true,
  is_e_magazine: true,
  is_newsletter: true,
  visitor_notification_mail: true,
  status: true,
  joining_status: true,
  order_id: true,
  telecalling_grade_id: true,
  batch_number: true,
  user_id: true,
} as const;

function toRow(e: any): ExhibitorAdminRow {
  return {
    id: e.id,
    firstName: e.first_name ?? "",
    lastName: e.last_name ?? "",
    fullName: e.name ?? `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim(),
    email: e.email ?? "",
    phone: e.phone,
    workPhone: e.work_phone,
    business: e.business,
    position: e.position,
    website: e.website,
    linkedinUserProfile: e.linkedin_user_profile,
    facebook: e.facebook,
    twitter: e.twitter,
    instagram: e.instagram,
    whatsappNo: e.whatsapp_no,
    zoom: e.zoom,
    calendly: e.calendly,
    youtube: e.youtube,
    aboutUs: e.about_us,
    standNumber: e.stand_number,
    standSize: e.stand_size,
    standPrice: e.stand_price,
    discount: e.discount,
    charitableAmount: e.charitable_amount,
    exchangeAmount: e.exchange_amount,
    exchangeServices: Boolean(e.exchange_services),
    featured: Boolean(e.featured),
    memberCompanyProfile: Boolean(e.member_company_profile),
    excludedFromAdvertise: Boolean(e.excluded_from_advertise),
    enableVideoCalling: Boolean(e.enable_video_calling),
    videoCallingSoftwareProvider: e.video_calling_software_provider,
    videoCallUrl: e.video_call_url,
    specialInstructions: e.special_instructions,
    referralCode: e.referral_code,
    referralMstrId: e.referral_mstr_id,
    referrerFrom: e.referrer_from,
    keynoteSpeechTopic: e.keynote_speech_topic,
    isWebinars: Boolean(e.is_webinars),
    isWorkshops: Boolean(e.is_workshops),
    isBusinessPresentation: Boolean(e.is_business_presentation),
    isEMagazine: Boolean(e.is_e_magazine),
    isNewsletter: Boolean(e.is_newsletter),
    visitorNotificationMail: Boolean(e.visitor_notification_mail),
    status: e.status ?? "pending",
    joiningStatus: e.joining_status,
    orderId: e.order_id,
    telecallingGradeId: e.telecalling_grade_id,
    batchNumber: e.batch_number,
  };
}

export async function getExhibitorsAdmin(context: EventMemberContext): Promise<ExhibitorAdminRow[]> {
  if (context.role !== "organiser") return [];
  const rows = await prisma.find_event_exhibitor.findMany({
    where: { event_id: context.eventId },
    orderBy: { id: "desc" },
    select: SELECT_FIELDS,
  });
  return rows.map(toRow);
}

export async function getExhibitorsAdminStats(context: EventMemberContext): Promise<ExhibitorStats> {
  if (context.role !== "organiser") {
    return {
      total: 0,
      registered: 0,
      interested: 0,
      reserved: 0,
      pending: 0,
      notInterested: 0,
      joinedAccounts: 0,
      pendingAccounts: 0,
      noStandNumber: 0,
      noStandPrice: 0,
      noStandSize: 0,
      noOrder: 0,
      uncontacted: 0,
    };
  }

  const rows = await prisma.find_event_exhibitor.findMany({
    where: { event_id: context.eventId, status: { not: "excluded" } },
    select: {
      status: true,
      joining_status: true,
      stand_number: true,
      stand_price: true,
      stand_size: true,
      order_id: true,
      telecalling_grade_id: true,
      user_id: true,
    },
  });

  let registered = 0;
  let interested = 0;
  let reserved = 0;
  let pending = 0;
  let notInterested = 0;
  let joinedAccounts = 0;
  let pendingAccounts = 0;
  let noStandNumber = 0;
  let noStandPrice = 0;
  let noStandSize = 0;
  let noOrder = 0;
  let uncontacted = 0;

  for (const r of rows) {
    if (r.status === "active") registered++;
    else if (r.status === "Interested") interested++;
    else if (r.status === "Reserved") reserved++;
    else if (r.status === "Not Interested") notInterested++;
    else if (r.status === "pending") pending++;

    if (r.joining_status === "Joined") joinedAccounts++;
    else if (r.joining_status === "Pending") pendingAccounts++;

    if (r.status === "active") {
      if (!r.stand_number) noStandNumber++;
      if (r.stand_price === null || r.stand_price === undefined) noStandPrice++;
      if (!r.stand_size) noStandSize++;
      if (!r.order_id) noOrder++;
    }

    if (!r.telecalling_grade_id && r.status !== "active") uncontacted++;
  }

  return {
    total: rows.length,
    registered,
    interested,
    reserved,
    pending,
    notInterested,
    joinedAccounts,
    pendingAccounts,
    noStandNumber,
    noStandPrice,
    noStandSize,
    noOrder,
    uncontacted,
  };
}

function generateBatchNumber(eventId: number): string {
  return `EX-${eventId}-${Date.now().toString(36).toUpperCase()}`;
}

function toNumberOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createExhibitorAdmin(context: EventMemberContext, input: EventExhibitorAdminInput) {
  if (context.role !== "organiser") return null;
  return prisma.find_event_exhibitor.create({
    data: {
      event_id: context.eventId,
      batch_number: generateBatchNumber(context.eventId),
      first_name: input.first_name,
      last_name: input.last_name,
      name: `${input.first_name} ${input.last_name}`.trim(),
      email: input.email,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      business: input.business,
      position: input.position || null,
      website: input.website || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      facebook: input.facebook || null,
      twitter: input.twitter || null,
      instagram: input.instagram || null,
      whatsapp_no: input.whatsapp_no || null,
      zoom: input.zoom || null,
      calendly: input.calendly || null,
      youtube: input.youtube || null,
      about_us: input.about_us || null,
      stand_number: input.stand_number || null,
      stand_size: input.stand_size || null,
      stand_price: toNumberOrNull(input.stand_price),
      discount: toNumberOrNull(input.discount) ?? 0,
      charitable_amount: toNumberOrNull(input.charitable_amount) ?? 0,
      exchange_amount: toNumberOrNull(input.exchange_amount) ?? 0,
      exchange_services: input.exchange_services ? 1 : 0,
      featured: input.featured ? 1 : 0,
      member_company_profile: input.member_company_profile ? 1 : 0,
      excluded_from_advertise: input.excluded_from_advertise ?? false,
      enable_video_calling: input.enable_video_calling ?? false,
      video_calling_software_provider: input.video_calling_software_provider || null,
      video_call_url: input.video_call_url || null,
      special_instructions: input.special_instructions || null,
      referral_code: input.referral_code || null,
      referral_mstr_id: input.referral_mstr_id || null,
      referrer_from: input.referrer_from || null,
      keynote_speech_topic: input.keynote_speech_topic || null,
      is_webinars: input.is_webinars ? 1 : 0,
      is_workshops: input.is_workshops ? 1 : 0,
      is_business_presentation: input.is_business_presentation ? 1 : 0,
      is_e_magazine: input.is_e_magazine ? 1 : 0,
      is_newsletter: input.is_newsletter ? 1 : 0,
      visitor_notification_mail: input.visitor_notification_mail ? 1 : 0,
      status: input.status as any,
    },
    select: { id: true },
  });
}

export async function updateExhibitorAdmin(context: EventMemberContext, id: number, input: EventExhibitorAdminInput) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_exhibitor.updateMany({
    where: { id, event_id: context.eventId },
    data: {
      first_name: input.first_name,
      last_name: input.last_name,
      name: `${input.first_name} ${input.last_name}`.trim(),
      email: input.email,
      phone: input.phone || null,
      work_phone: input.work_phone || null,
      business: input.business,
      position: input.position || null,
      website: input.website || null,
      linkedin_user_profile: input.linkedin_user_profile || null,
      facebook: input.facebook || null,
      twitter: input.twitter || null,
      instagram: input.instagram || null,
      whatsapp_no: input.whatsapp_no || null,
      zoom: input.zoom || null,
      calendly: input.calendly || null,
      youtube: input.youtube || null,
      about_us: input.about_us || null,
      stand_number: input.stand_number || null,
      stand_size: input.stand_size || null,
      stand_price: toNumberOrNull(input.stand_price),
      discount: toNumberOrNull(input.discount) ?? 0,
      charitable_amount: toNumberOrNull(input.charitable_amount) ?? 0,
      exchange_amount: toNumberOrNull(input.exchange_amount) ?? 0,
      exchange_services: input.exchange_services ? 1 : 0,
      featured: input.featured ? 1 : 0,
      member_company_profile: input.member_company_profile ? 1 : 0,
      excluded_from_advertise: input.excluded_from_advertise ?? false,
      enable_video_calling: input.enable_video_calling ?? false,
      video_calling_software_provider: input.video_calling_software_provider || null,
      video_call_url: input.video_call_url || null,
      special_instructions: input.special_instructions || null,
      referral_code: input.referral_code || null,
      referral_mstr_id: input.referral_mstr_id || null,
      referrer_from: input.referrer_from || null,
      keynote_speech_topic: input.keynote_speech_topic || null,
      is_webinars: input.is_webinars ? 1 : 0,
      is_workshops: input.is_workshops ? 1 : 0,
      is_business_presentation: input.is_business_presentation ? 1 : 0,
      is_e_magazine: input.is_e_magazine ? 1 : 0,
      is_newsletter: input.is_newsletter ? 1 : 0,
      visitor_notification_mail: input.visitor_notification_mail ? 1 : 0,
      status: input.status as any,
    },
  });
}

export async function bulkUpdateExhibitorAdminStatus(context: EventMemberContext, ids: number[], status: string) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_exhibitor.updateMany({
    where: { id: { in: ids }, event_id: context.eventId },
    data: { status: status as any },
  });
}

export async function bulkDeleteExhibitorsAdmin(context: EventMemberContext, ids: number[]) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_exhibitor.deleteMany({
    where: { id: { in: ids }, event_id: context.eventId },
  });
}

export async function deleteExhibitorAdmin(context: EventMemberContext, id: number) {
  if (context.role !== "organiser") return { count: 0 };
  return prisma.find_event_exhibitor.deleteMany({ where: { id, event_id: context.eventId } });
}
