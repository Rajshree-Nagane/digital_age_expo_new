"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { Plus, Pencil, Trash2, Search, X, Star, Home } from "lucide-react";
import { eventSponsorAdminSchema, SPONSOR_STATUSES, type EventSponsorAdminInput } from "@/lib/validations/eventSponsorAdmin";
import type { SponsorAdminRow } from "@/lib/services/eventSponsorAdmin";
import { TablePagination } from "@/components/dashboard/TablePagination";

const PAGE_SIZE = 20;

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors backdrop-blur-md";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  unapproved: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  excluded: "bg-red-500/10 text-red-400 border border-red-500/20",
};

interface FormDefaults extends Partial<EventSponsorAdminInput> {
  id?: number;
}

function SponsorFormModal({
  defaultValues,
  onClose,
  onSaved,
}: {
  defaultValues?: FormDefaults;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEdit = typeof defaultValues?.id === "number";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventSponsorAdminInput>({
    resolver: zodResolver(eventSponsorAdminSchema) as any,
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      business: defaultValues?.business ?? "",
      position: defaultValues?.position ?? "",
      website: defaultValues?.website ?? "",
      linkedin_user_profile: defaultValues?.linkedin_user_profile ?? "",
      sponsor_type: defaultValues?.sponsor_type ?? "",
      status: defaultValues?.status ?? "pending",
      is_approved: defaultValues?.is_approved ?? false,
      enable_home_page: defaultValues?.enable_home_page ?? false,
      featured: defaultValues?.featured ?? false,
    },
  });

  async function onSubmit(data: EventSponsorAdminInput) {
    setErrorMessage(null);
    try {
      if (isEdit) {
        await axios.patch(`/api/members/sponsors-admin/${defaultValues!.id}`, data);
      } else {
        await axios.post("/api/members/sponsors-admin", data);
      }
      onSaved();
    } catch (err) {
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save this sponsor. Please check the form and try again."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-zinc-900 border border-white/10 p-8 shadow-2xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black uppercase tracking-widest text-white">{isEdit ? "Edit Sponsor" : "Add Sponsor"}</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Partner Integration</p>
          </div>
          <button onClick={onClose} className="rounded-full h-10 w-10 flex items-center justify-center bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Contact Name*</label>
            <input {...register("name")} className={FIELD_CLASS} placeholder="Full Name" />
            {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Official Email</label>
              <input {...register("email")} type="email" className={FIELD_CLASS} placeholder="email@company.com" />
              {errors.email && <p className="mt-1 text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Phone</label>
              <input {...register("phone")} className={FIELD_CLASS} placeholder="+44..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Business</label>
              <input {...register("business")} className={FIELD_CLASS} placeholder="Company Name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Position</label>
              <input {...register("position")} className={FIELD_CLASS} placeholder="e.g. CMO" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Website</label>
            <input {...register("website")} className={FIELD_CLASS} placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">LinkedIn Profile</label>
            <input {...register("linkedin_user_profile")} className={FIELD_CLASS} placeholder="https://linkedin.com/in/..." />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sponsorship Type</label>
              <input {...register("sponsor_type")} className={FIELD_CLASS} placeholder="e.g. Platinum" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status</label>
              <select {...register("status")} className={FIELD_CLASS}>
                {SPONSOR_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 select-none">
              <input type="checkbox" {...register("is_approved")} className="h-4 w-4 rounded-lg border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
              Approved
            </label>
            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 select-none">
              <input type="checkbox" {...register("enable_home_page")} className="h-4 w-4 rounded-lg border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
              Home Page
            </label>
            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 select-none">
              <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded-lg border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
              Featured
            </label>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-4 border-t border-white/5 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : isEdit ? "Save Profile" : "Register Sponsor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SponsorsAdminManager({ sponsors }: { sponsors: SponsorAdminRow[] }) {
  const router = useRouter();
  const [modalSponsor, setModalSponsor] = useState<SponsorAdminRow | "new" | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return sponsors;
    return sponsors.filter((s) =>
      [s.name, s.email, s.business, s.status, s.sponsorType].filter(Boolean).some((field) => field!.toLowerCase().includes(q))
    );
  }, [sponsors, keyword]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  async function remove(id: number) {
    if (!window.confirm("Remove this sponsor? This cannot be undone.")) return;
    setPendingId(id);
    setErrorMessage(null);
    try {
      await axios.delete(`/api/members/sponsors-admin/${id}`);
      router.refresh();
    } catch {
      setErrorMessage("Could not remove this sponsor. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handleSaved() {
    setModalSponsor(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Partnership List</p>
          <p className="text-sm font-bold text-zinc-400">Track and manage every sponsor backing this event.</p>
        </div>
        <button
          onClick={() => setModalSponsor("new")}
          className="inline-flex items-center gap-2 rounded-full bg-brand-pink px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add New Sponsor
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-xl backdrop-blur-md">
        <Search className="h-5 w-5 shrink-0 text-brand-pink" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Filter by name, email, company or status…"
          className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none font-medium"
        />
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border-white/10 shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-white/5">
              <tr>
                <th className="px-6 py-5">Sponsor / Contact</th>
                <th className="px-6 py-5">Company</th>
                <th className="px-6 py-5">Sponsorship</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Flags</th>
                <th className="px-6 py-5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-zinc-500 font-medium italic">
                      {sponsors.length === 0 ? "No sponsors have been added yet." : "No sponsors match your search."}
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((sponsor) => (
                  <tr key={sponsor.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-zinc-200">{sponsor.name}</div>
                      <div className="text-[11px] text-zinc-500 font-medium">{sponsor.email || "—"}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-zinc-300">{sponsor.business || "—"}</div>
                    </td>
                    <td className="px-6 py-5">
                      {sponsor.sponsorType ? (
                        <span className="inline-flex rounded-full bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-purple">
                          {sponsor.sponsorType}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg ${STATUS_BADGE[sponsor.status ?? ""] || "bg-white/5 text-zinc-500 border border-white/10"}`}>
                        {sponsor.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        {sponsor.featured && <Star className="h-4 w-4 text-brand-pink fill-brand-pink/20" aria-label="Featured" />}
                        {sponsor.enableHomePage && <Home className="h-4 w-4 text-brand-purple" aria-label="Home page" />}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setModalSponsor(sponsor)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-brand-purple hover:text-white transition-all shadow-xl"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled={pendingId === sponsor.id}
                          onClick={() => remove(sponsor.id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/5 text-zinc-400 hover:bg-red-500 hover:text-white transition-all shadow-xl disabled:opacity-20"
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

        <TablePagination
          currentPage={page}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="px-6 pb-5"
        />
      </div>

      {modalSponsor && (
        <SponsorFormModal
          defaultValues={
            modalSponsor === "new"
              ? undefined
              : {
                  id: modalSponsor.id,
                  name: modalSponsor.name,
                  email: modalSponsor.email ?? "",
                  phone: modalSponsor.phone ?? "",
                  business: modalSponsor.business ?? "",
                  position: modalSponsor.position ?? "",
                  website: modalSponsor.website ?? "",
                  linkedin_user_profile: modalSponsor.linkedinUserProfile ?? "",
                  sponsor_type: modalSponsor.sponsorType ?? "",
                  status: (modalSponsor.status as (typeof SPONSOR_STATUSES)[number]) ?? "pending",
                  is_approved: modalSponsor.isApproved,
                  enable_home_page: modalSponsor.enableHomePage,
                  featured: modalSponsor.featured,
                }
          }
          onClose={() => setModalSponsor(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
