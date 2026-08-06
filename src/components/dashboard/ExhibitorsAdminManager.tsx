"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Filter, ExternalLink, Video, Star, CheckCircle, Clock } from "lucide-react";
import {
  eventExhibitorAdminSchema,
  EXHIBITOR_STATUSES,
  EXHIBITOR_BULK_STATUS_ACTIONS,
  type EventExhibitorAdminInput,
} from "@/lib/validations/eventExhibitorAdmin";
import type { ExhibitorAdminRow, ExhibitorStats } from "@/lib/services/eventExhibitorAdmin";
import { TablePagination } from "@/components/dashboard/TablePagination";

const PAGE_SIZE = 20;

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors backdrop-blur-md";

const CHECKBOX_LABEL_CLASS =
  "flex items-center gap-3 cursor-pointer text-xs font-semibold text-zinc-300 hover:text-white select-none";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Interested: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  Reserved: "bg-brand-purple/10 text-brand-purple border border-brand-purple/20",
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "Not Interested": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "Unable to attend": "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  "Call Back": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  "No Answer": "bg-red-500/10 text-red-300 border border-red-500/20",
  "Invalid Number": "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  "Voice Mail": "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  "Meeting Scheduled": "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  excluded: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const BULK_ACTION_LABEL: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  Interested: "Interested",
  Reserved: "Reserved",
  "Not Interested": "No Interest",
  "Unable to attend": "Unable",
  "Call Back": "Call Back",
  "No Answer": "No Answer",
  "Invalid Number": "Invalid #",
  "Voice Mail": "Voice Mail",
  "Meeting Scheduled": "Scheduled",
  excluded: "Exclude",
};

interface BadgeDef {
  label: string;
  key: keyof ExhibitorStats;
  typeFilter?: string;
  color: string;
}

const BADGES: BadgeDef[] = [
  { label: "Registered Exh.", key: "registered", typeFilter: "active", color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20" },
  { label: "Interested", key: "interested", typeFilter: "Interested", color: "from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20" },
  { label: "Reserved", key: "reserved", typeFilter: "Reserved", color: "from-brand-purple/20 to-brand-purple/5 text-brand-purple border-brand-purple/20" },
  { label: "Pending", key: "pending", typeFilter: "pending", color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20" },
  { label: "Not Interested", key: "notInterested", typeFilter: "Not Interested", color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20" },
  { label: "Total Exhibitors", key: "total", typeFilter: undefined, color: "from-white/10 to-white/5 text-white border-white/20" },
  { label: "Joined Accounts", key: "joinedAccounts", typeFilter: "joined_account", color: "from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/20" },
  { label: "Pending Accounts", key: "pendingAccounts", typeFilter: "pending_account", color: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20" },
  { label: "No Order", key: "noOrder", typeFilter: "no_order", color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20" },
  { label: "Unallocated", key: "noStandSize", typeFilter: "unallocated", color: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20" },
  { label: "No Stand #", key: "noStandNumber", typeFilter: "no_stand_num", color: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/20" },
  { label: "No Price", key: "noStandPrice", typeFilter: "no_stand_price", color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20" },
  { label: "Uncontacted", key: "uncontacted", typeFilter: "uncontacted", color: "from-red-500/20 to-red-500/5 text-red-400 border-red-500/20" },
];

interface FormDefaults extends Partial<EventExhibitorAdminInput> {
  id?: number;
}

function ExhibitorFormModal({
  defaultValues,
  onClose,
  onSaved,
}: {
  defaultValues?: FormDefaults;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "stand" | "digital" | "preferences">("general");
  const isEdit = typeof defaultValues?.id === "number";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventExhibitorAdminInput>({
    resolver: zodResolver(eventExhibitorAdminSchema) as any,
    defaultValues: {
      first_name: defaultValues?.first_name ?? "",
      last_name: defaultValues?.last_name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      work_phone: defaultValues?.work_phone ?? "",
      business: defaultValues?.business ?? "",
      position: defaultValues?.position ?? "",
      website: defaultValues?.website ?? "",
      linkedin_user_profile: defaultValues?.linkedin_user_profile ?? "",
      facebook: defaultValues?.facebook ?? "",
      twitter: defaultValues?.twitter ?? "",
      instagram: defaultValues?.instagram ?? "",
      whatsapp_no: defaultValues?.whatsapp_no ?? "",
      zoom: defaultValues?.zoom ?? "",
      calendly: defaultValues?.calendly ?? "",
      youtube: defaultValues?.youtube ?? "",
      about_us: defaultValues?.about_us ?? "",
      stand_number: defaultValues?.stand_number ?? "",
      stand_size: defaultValues?.stand_size ?? "",
      stand_price: defaultValues?.stand_price ?? "",
      discount: defaultValues?.discount ?? "",
      charitable_amount: defaultValues?.charitable_amount ?? "",
      exchange_amount: defaultValues?.exchange_amount ?? "",
      exchange_services: defaultValues?.exchange_services ?? false,
      featured: defaultValues?.featured ?? false,
      member_company_profile: defaultValues?.member_company_profile ?? false,
      excluded_from_advertise: defaultValues?.excluded_from_advertise ?? false,
      enable_video_calling: defaultValues?.enable_video_calling ?? false,
      video_calling_software_provider: defaultValues?.video_calling_software_provider ?? "",
      video_call_url: defaultValues?.video_call_url ?? "",
      special_instructions: defaultValues?.special_instructions ?? "",
      referral_code: defaultValues?.referral_code ?? "",
      referral_mstr_id: defaultValues?.referral_mstr_id ?? "",
      referrer_from: defaultValues?.referrer_from ?? "",
      keynote_speech_topic: defaultValues?.keynote_speech_topic ?? "",
      is_webinars: defaultValues?.is_webinars ?? false,
      is_workshops: defaultValues?.is_workshops ?? false,
      is_business_presentation: defaultValues?.is_business_presentation ?? false,
      is_e_magazine: defaultValues?.is_e_magazine ?? false,
      is_newsletter: defaultValues?.is_newsletter ?? false,
      visitor_notification_mail: defaultValues?.visitor_notification_mail ?? true,
      status: defaultValues?.status ?? "pending",
    },
  });

  const isVideoCalling = watch("enable_video_calling");
  const isExchange = watch("exchange_services");

  async function onSubmit(data: EventExhibitorAdminInput) {
    setErrorMessage(null);
    try {
      if (isEdit) {
        await axios.patch(`/api/members/exhibitors-admin/${defaultValues!.id}`, data);
      } else {
        await axios.post("/api/members/exhibitors-admin", data);
      }
      onSaved();
    } catch (err) {
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save this exhibitor. Please check the form and try again."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-zinc-950 border border-white/10 p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-widest text-white">{isEdit ? "Edit Exhibitor Profile" : "Register New Exhibitor"}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Trade Stand & Company Setup</p>
          </div>
          <button onClick={onClose} className="rounded-full h-10 w-10 flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 ${
              activeTab === "general" ? "border-brand-pink text-brand-pink" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Contact & Role
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stand")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 ${
              activeTab === "stand" ? "border-brand-pink text-brand-pink" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Stand & Financials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("digital")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 ${
              activeTab === "digital" ? "border-brand-pink text-brand-pink" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Booth & Socials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 shrink-0 ${
              activeTab === "preferences" ? "border-brand-pink text-brand-pink" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Preferences & Promo
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">First Name*</label>
                  <input {...register("first_name")} className={FIELD_CLASS} placeholder="e.g. Sarah" />
                  {errors.first_name && <p className="mt-1 text-xs font-bold text-red-500">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Last Name*</label>
                  <input {...register("last_name")} className={FIELD_CLASS} placeholder="e.g. Miller" />
                  {errors.last_name && <p className="mt-1 text-xs font-bold text-red-500">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Official Email*</label>
                <input {...register("email")} type="email" className={FIELD_CLASS} placeholder="email@company.com" />
                {errors.email && <p className="mt-1 text-xs font-bold text-red-500">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Mobile Phone</label>
                  <input {...register("phone")} className={FIELD_CLASS} placeholder="+44..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Work Direct Line</label>
                  <input {...register("work_phone")} className={FIELD_CLASS} placeholder="Direct extension..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Business / Organisation*</label>
                  <input {...register("business")} className={FIELD_CLASS} placeholder="Company Name" />
                  {errors.business && <p className="mt-1 text-xs font-bold text-red-500">{errors.business.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Position / Job Title</label>
                  <input {...register("position")} className={FIELD_CLASS} placeholder="e.g. Managing Director" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Company Website</label>
                  <input {...register("website")} className={FIELD_CLASS} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Exhibitor Lifecycle Status</label>
                  <select {...register("status")} className={FIELD_CLASS}>
                    {EXHIBITOR_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stand" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Stand Number</label>
                  <input {...register("stand_number")} className={FIELD_CLASS} placeholder="e.g. Stand A10" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Stand Size / Tier</label>
                  <input {...register("stand_size")} className={FIELD_CLASS} placeholder="e.g. 3m x 3m Premium" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Stand Price (£)</label>
                  <input {...register("stand_price")} className={FIELD_CLASS} placeholder="2500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Discount (£)</label>
                  <input {...register("discount")} className={FIELD_CLASS} placeholder="250" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Charitable (£)</label>
                  <input {...register("charitable_amount")} className={FIELD_CLASS} placeholder="0" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className={CHECKBOX_LABEL_CLASS}>
                  <input type="checkbox" {...register("exchange_services")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                  Exchange Services Agreed
                </label>

                {isExchange && (
                  <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Exchange Credit Amount (£)</label>
                    <input {...register("exchange_amount")} className={FIELD_CLASS} placeholder="500" />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Special Instructions / Admin Notes</label>
                <textarea {...register("special_instructions")} rows={2} className={FIELD_CLASS} placeholder="Internal organizer remarks regarding this stand..." />
              </div>
            </div>
          )}

          {activeTab === "digital" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">About Company / Exhibition Summary</label>
                <textarea {...register("about_us")} rows={3} className={FIELD_CLASS} placeholder="Overview of services offered at booth..." />
              </div>

              <div className="space-y-3 pt-2">
                <label className={CHECKBOX_LABEL_CLASS}>
                  <input type="checkbox" {...register("enable_video_calling")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                  Enable Virtual Booth Video Calling
                </label>

                {isVideoCalling && (
                  <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Software Provider</label>
                      <input {...register("video_calling_software_provider")} className={FIELD_CLASS} placeholder="e.g. Daily, Zoom, Teams" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Video Call Room URL</label>
                      <input {...register("video_call_url")} className={FIELD_CLASS} placeholder="https://daily.co/..." />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Zoom Link</label>
                  <input {...register("zoom")} className={FIELD_CLASS} placeholder="https://zoom.us/j/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Calendly Booking Link</label>
                  <input {...register("calendly")} className={FIELD_CLASS} placeholder="https://calendly.com/..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Youtube Demo Video</label>
                  <input {...register("youtube")} className={FIELD_CLASS} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">LinkedIn Profile</label>
                  <input {...register("linkedin_user_profile")} className={FIELD_CLASS} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">WhatsApp #</label>
                  <input {...register("whatsapp_no")} className={FIELD_CLASS} placeholder="+44..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Facebook</label>
                  <input {...register("facebook")} className={FIELD_CLASS} placeholder="facebook.com/..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Instagram</label>
                  <input {...register("instagram")} className={FIELD_CLASS} placeholder="@handle" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Referral Partner Code</label>
                  <input {...register("referral_code")} className={FIELD_CLASS} placeholder="PARTNER-2026" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Referrer Type / Master ID</label>
                  <input {...register("referral_mstr_id")} className={FIELD_CLASS} placeholder="e.g. Email / Social" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Referrer Origin</label>
                  <input {...register("referrer_from")} className={FIELD_CLASS} placeholder="How did exhibitor find show?" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Keynote Speech Topic</label>
                  <input {...register("keynote_speech_topic")} className={FIELD_CLASS} placeholder="Title of presentation..." />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-pink">Exhibitor Promotion & Options</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Featured Exhibitor
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("member_company_profile")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Member Company Profile
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("excluded_from_advertise")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Exclude from Advertise Magazine
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("visitor_notification_mail")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Visitor Lead Mail Notifications
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("is_webinars")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Webinars & Seminars
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("is_workshops")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Workshops
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("is_business_presentation")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Business Presentation
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("is_e_magazine")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    E-Magazine
                  </label>
                  <label className={CHECKBOX_LABEL_CLASS}>
                    <input type="checkbox" {...register("is_newsletter")} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    Newsletter
                  </label>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-4 border-t border-white/5 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-pink px-10 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : isEdit ? "Save Profile" : "Register Exhibitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ExhibitorsAdminManager({
  initialExhibitors,
  initialStats,
}: {
  initialExhibitors: ExhibitorAdminRow[];
  initialStats: ExhibitorStats;
}) {
  const [rows, setRows] = useState<ExhibitorAdminRow[]>(initialExhibitors);
  const [stats, setStats] = useState<ExhibitorStats>(initialStats);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modalExhibitor, setModalExhibitor] = useState<ExhibitorAdminRow | "new" | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function refreshData() {
    try {
      const [exRes, statsRes] = await Promise.all([
        axios.get<{ exhibitors: ExhibitorAdminRow[] }>("/api/members/exhibitors-admin"),
        axios.get<{ stats: ExhibitorStats }>("/api/members/exhibitors-admin/stats"),
      ]);
      setRows(exRes.data.exhibitors);
      setStats(statsRes.data.stats);
      setSelected(new Set());
    } catch {
      setErrorMessage("Could not refresh exhibitor list.");
    }
  }

  const filtered = useMemo(() => {
    let result = rows;

    if (activeFilter) {
      if (activeFilter === "joined_account") {
        result = result.filter((r) => r.joiningStatus === "Joined");
      } else if (activeFilter === "pending_account") {
        result = result.filter((r) => r.joiningStatus === "Pending");
      } else if (activeFilter === "no_order") {
        result = result.filter((r) => r.status === "active" && !r.orderId);
      } else if (activeFilter === "unallocated") {
        result = result.filter((r) => r.status === "active" && !r.standSize);
      } else if (activeFilter === "no_stand_num") {
        result = result.filter((r) => r.status === "active" && !r.standNumber);
      } else if (activeFilter === "no_stand_price") {
        result = result.filter((r) => r.status === "active" && (r.standPrice === null || r.standPrice === undefined));
      } else if (activeFilter === "uncontacted") {
        result = result.filter((r) => !r.telecallingGradeId && r.status !== "active");
      } else {
        result = result.filter((r) => r.status === activeFilter);
      }
    }

    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((e) =>
        [e.firstName, e.lastName, e.fullName, e.email, e.business, e.position, e.standNumber, e.status]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }

    return result;
  }, [rows, activeFilter, keyword]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, keyword]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const allSelected = paged.length > 0 && paged.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const pageIds = paged.map((r) => r.id);
      const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBadgeClick(typeFilter?: string) {
    if (activeFilter === typeFilter) {
      setActiveFilter(undefined);
    } else {
      setActiveFilter(typeFilter);
    }
  }

  async function applyBulkStatus(status: string) {
    if (selected.size === 0) return;
    setBulkPending(true);
    setErrorMessage(null);
    try {
      await axios.post("/api/members/exhibitors-admin/bulk-status", { ids: [...selected], status });
      await refreshData();
    } catch {
      setErrorMessage("Could not update selected exhibitors.");
    } finally {
      setBulkPending(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected exhibitor${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBulkPending(true);
    setErrorMessage(null);
    try {
      await axios.post("/api/members/exhibitors-admin/bulk-delete", { ids: [...selected] });
      await refreshData();
    } catch {
      setErrorMessage("Could not delete selected exhibitors.");
    } finally {
      setBulkPending(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Remove this exhibitor? This cannot be undone.")) return;
    setPendingId(id);
    setErrorMessage(null);
    try {
      await axios.delete(`/api/members/exhibitors-admin/${id}`);
      await refreshData();
    } catch {
      setErrorMessage("Could not remove this exhibitor. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handleSaved() {
    setModalExhibitor(null);
    refreshData();
  }

  return (
    <div className="space-y-8">
      {/* Interactive Stat Filter Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {BADGES.map((b) => {
          const isActive = activeFilter === b.typeFilter;
          return (
            <button
              key={b.label}
              onClick={() => handleBadgeClick(b.typeFilter)}
              className={`rounded-2xl bg-gradient-to-br p-4 border text-left transition-all cursor-pointer hover:scale-105 active:scale-95 ${b.color} ${
                isActive ? "ring-2 ring-brand-pink scale-105 shadow-lg" : "opacity-90"
              }`}
            >
              <div className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">{b.label}</div>
              <div className="text-2xl font-black">{stats[b.key]}</div>
            </button>
          );
        })}
      </div>

      <div className="glass-panel rounded-3xl p-8 border-white/10 shadow-2xl backdrop-blur-md space-y-6">
        {/* Bulk Action Controls & Top Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {EXHIBITOR_BULK_STATUS_ACTIONS.map((status) => (
              <button
                key={status}
                disabled={selected.size === 0 || bulkPending}
                onClick={() => applyBulkStatus(status)}
                className="rounded-full bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-purple hover:bg-brand-purple hover:text-white transition-all disabled:opacity-20 cursor-pointer"
              >
                {BULK_ACTION_LABEL[status] ?? status}
              </button>
            ))}
            <button
              disabled={selected.size === 0 || bulkPending}
              onClick={bulkDelete}
              className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-20 cursor-pointer"
            >
              Bulk Delete
            </button>
          </div>

          <button
            onClick={() => setModalExhibitor("new")}
            className="inline-flex items-center gap-2 rounded-full bg-brand-pink px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Exhibitor
          </button>
        </div>

        {/* Filter Indicator & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-xl backdrop-blur-md">
            <Search className="h-5 w-5 shrink-0 text-brand-pink" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search exhibitors by name, company, email or stand #..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none font-medium"
            />
          </div>

          {activeFilter && (
            <div className="flex items-center gap-2 rounded-2xl border border-brand-pink/30 bg-brand-pink/10 px-4 py-2 text-xs font-bold text-brand-pink">
              <Filter className="h-4 w-4" />
              <span>Filtered by: {activeFilter}</span>
              <button onClick={() => setActiveFilter(undefined)} className="hover:text-white ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {/* Main Exhibitor Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-white/5">
              <tr>
                <th className="px-4 py-5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                </th>
                <th className="px-4 py-5">Exhibitor Contact</th>
                <th className="px-4 py-5">Company & Position</th>
                <th className="px-4 py-5">Stand & Price</th>
                <th className="px-4 py-5">Digital Booth</th>
                <th className="px-4 py-5">Status</th>
                <th className="px-4 py-5">Account</th>
                <th className="px-4 py-5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500 italic">
                    {rows.length === 0 ? "No exhibitors registered yet." : "No exhibitors match your filter or search."}
                  </td>
                </tr>
              ) : (
                paged.map((exhibitor) => (
                  <tr key={exhibitor.id} className={`group hover:bg-white/[0.02] transition-colors ${selected.has(exhibitor.id) ? "bg-white/[0.03]" : ""}`}>
                    <td className="px-4 py-5">
                      <input type="checkbox" checked={selected.has(exhibitor.id)} onChange={() => toggleOne(exhibitor.id)} className="h-4 w-4 rounded border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
                    </td>
                    <td className="px-4 py-5 font-bold text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span>{exhibitor.fullName}</span>
                        {exhibitor.featured && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Featured
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-300 mt-0.5">{exhibitor.email}</div>
                      {exhibitor.phone && <div className="text-[10px] text-zinc-500 mt-0.5">Mob: {exhibitor.phone}</div>}
                    </td>
                    <td className="px-4 py-5">
                      <div className="font-bold text-zinc-300">{exhibitor.business || "—"}</div>
                      {exhibitor.position && <div className="text-[10px] text-zinc-500">{exhibitor.position}</div>}
                      {exhibitor.website && (
                        <a href={exhibitor.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-brand-pink hover:underline mt-0.5">
                          <ExternalLink className="h-3 w-3" /> Website
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      {exhibitor.standNumber ? (
                        <span className="inline-flex rounded-full bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-purple">
                          {exhibitor.standNumber}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic text-xs">Unassigned</span>
                      )}
                      {exhibitor.standSize && <div className="text-[10px] text-zinc-400 mt-1 font-medium">{exhibitor.standSize}</div>}
                      {exhibitor.standPrice !== null && (
                        <div className="text-[10px] font-black tracking-widest text-emerald-400 mt-0.5">
                          £{exhibitor.standPrice} {exhibitor.discount ? `(-£${exhibitor.discount})` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-5">
                      {exhibitor.enableVideoCalling ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                          <Video className="h-3 w-3" /> Live Call
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600">Standard</span>
                      )}
                      {exhibitor.zoom && <div className="text-[9px] text-zinc-400 mt-0.5">Zoom linked</div>}
                    </td>
                    <td className="px-4 py-5">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg ${STATUS_BADGE[exhibitor.status] || "bg-white/5 text-zinc-500 border border-white/10"}`}>
                        {exhibitor.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {exhibitor.joiningStatus ?? "—"}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setModalExhibitor(exhibitor)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-brand-purple hover:text-white transition-all shadow-xl cursor-pointer"
                          title="Edit Exhibitor Profile"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled={pendingId === exhibitor.id}
                          onClick={() => remove(exhibitor.id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-red-500 hover:text-white transition-all shadow-xl disabled:opacity-20 cursor-pointer"
                          title="Delete Exhibitor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination currentPage={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Showing {filtered.length} of {rows.length} total exhibitors
          </p>
        </div>
      </div>

      {modalExhibitor && (
        <ExhibitorFormModal
          defaultValues={
            modalExhibitor === "new"
              ? undefined
              : {
                  id: modalExhibitor.id,
                  first_name: modalExhibitor.firstName,
                  last_name: modalExhibitor.lastName,
                  email: modalExhibitor.email,
                  phone: modalExhibitor.phone ?? "",
                  work_phone: modalExhibitor.workPhone ?? "",
                  business: modalExhibitor.business ?? "",
                  position: modalExhibitor.position ?? "",
                  website: modalExhibitor.website ?? "",
                  linkedin_user_profile: modalExhibitor.linkedinUserProfile ?? "",
                  facebook: modalExhibitor.facebook ?? "",
                  twitter: modalExhibitor.twitter ?? "",
                  instagram: modalExhibitor.instagram ?? "",
                  whatsapp_no: modalExhibitor.whatsappNo ?? "",
                  zoom: modalExhibitor.zoom ?? "",
                  calendly: modalExhibitor.calendly ?? "",
                  youtube: modalExhibitor.youtube ?? "",
                  about_us: modalExhibitor.aboutUs ?? "",
                  stand_number: modalExhibitor.standNumber ?? "",
                  stand_size: modalExhibitor.standSize ?? "",
                  stand_price: modalExhibitor.standPrice?.toString() ?? "",
                  discount: modalExhibitor.discount?.toString() ?? "",
                  charitable_amount: modalExhibitor.charitableAmount?.toString() ?? "",
                  exchange_amount: modalExhibitor.exchangeAmount?.toString() ?? "",
                  exchange_services: modalExhibitor.exchangeServices,
                  featured: modalExhibitor.featured,
                  member_company_profile: modalExhibitor.memberCompanyProfile,
                  excluded_from_advertise: modalExhibitor.excludedFromAdvertise,
                  enable_video_calling: modalExhibitor.enableVideoCalling,
                  video_calling_software_provider: modalExhibitor.videoCallingSoftwareProvider ?? "",
                  video_call_url: modalExhibitor.videoCallUrl ?? "",
                  special_instructions: modalExhibitor.specialInstructions ?? "",
                  referral_code: modalExhibitor.referralCode ?? "",
                  referral_mstr_id: modalExhibitor.referralMstrId ?? "",
                  referrer_from: modalExhibitor.referrerFrom ?? "",
                  keynote_speech_topic: modalExhibitor.keynoteSpeechTopic ?? "",
                  is_webinars: modalExhibitor.isWebinars,
                  is_workshops: modalExhibitor.isWorkshops,
                  is_business_presentation: modalExhibitor.isBusinessPresentation,
                  is_e_magazine: modalExhibitor.isEMagazine,
                  is_newsletter: modalExhibitor.isNewsletter,
                  visitor_notification_mail: modalExhibitor.visitorNotificationMail,
                  status: (modalExhibitor.status as (typeof EXHIBITOR_STATUSES)[number]) ?? "pending",
                }
          }
          onClose={() => setModalExhibitor(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
