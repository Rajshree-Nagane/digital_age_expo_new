"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import {
  freeTicketSchema,
  REFERRAL_SOURCE_OPTIONS,
  OTHER_REFERRAL_CODE,
  type FreeTicketInput,
} from "@/lib/validations/freeTicket";

// Same dark-theme field styling as ExhibitorRegistrationForm.tsx, for visual consistency
// across the site's registration forms.
const INPUT_CLASS =
  "w-full rounded-xl border border-white/15 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all";

const LABEL_CLASS = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300";

const INTEREST_OPTIONS = [
  "Digital Marketing & Sales",
  "AI & Automation",
  "E-Commerce & Retail",
  "Cloud & Cybersecurity",
  "Networking & Partnership",
];

const DIGITAL_OFFERINGS = [
  { name: "is_webinars" as const, label: "Webinars & Seminars" },
  { name: "is_workshops" as const, label: "Workshops" },
  { name: "is_e_magazine" as const, label: "E-magazine" },
  { name: "is_newsletter" as const, label: "Newsletter" },
  { name: "is_business_presentation" as const, label: "Business Presentation" },
];

export function FreeTicketForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FreeTicketInput>({
    resolver: zodResolver(freeTicketSchema),
    defaultValues: { interest: INTEREST_OPTIONS[0], confirm: false },
  });

  // Mirrors the legacy form's `#referral_mstr_id.change()` jQuery handler — the free-text
  // "where did you hear about the show?" field only appears when "Other" is selected.
  const referralSource = watch("referral_mstr_id");
  const showReferrerFrom = referralSource === OTHER_REFERRAL_CODE;

  async function onSubmit(data: FreeTicketInput) {
    try {
      setStatus("idle");
      setErrorMessage(null);
      await axios.post("/api/free-ticket", data);
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      if (isAxiosError(err) && err.response?.status === 409) {
        setErrorMessage("You have already claimed a free ticket with this email address.");
      } else {
        setErrorMessage("Something went wrong claiming your ticket. Please try again.");
      }
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 sm:p-12 text-center text-emerald-200 backdrop-blur-md space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black uppercase text-white">Ticket Claimed!</h3>
        <p className="text-sm sm:text-base text-emerald-300 max-w-md mx-auto font-medium">
          Your free pass has been registered. Check your inbox for confirmation and access details closer to the show.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-emerald-500"
        >
          Claim Another Pass
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>First Name *</label>
          <input {...register("first_name")} placeholder="John" className={INPUT_CLASS} />
          {errors.first_name && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Last Name *</label>
          <input {...register("last_name")} placeholder="Doe" className={INPUT_CLASS} />
          {errors.last_name && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Work Email *</label>
        <input {...register("email")} type="email" placeholder="john@company.com" className={INPUT_CLASS} />
        {errors.email && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Mobile Phone *</label>
          <input {...register("phone")} placeholder="+44 7700 900123" className={INPUT_CLASS} />
          {errors.phone && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.phone.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Work Number</label>
          <input {...register("work_phone")} placeholder="+44 20 7946 0000" className={INPUT_CLASS} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Company Name</label>
          <input {...register("business")} placeholder="Acme Inc" className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Job Title</label>
          <input {...register("position")} placeholder="Marketing Director" className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>LinkedIn Profile</label>
        <input {...register("linkedin_profile")} placeholder="https://linkedin.com/in/johndoe" className={INPUT_CLASS} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Primary Interest</label>
        <select {...register("interest")} className={INPUT_CLASS}>
          {INTEREST_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-900 text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-white/10" />

      <div>
        <label className={LABEL_CLASS}>Where did you hear about the show?</label>
        <select {...register("referral_mstr_id")} className={INPUT_CLASS} defaultValue="">
          <option value="" className="bg-slate-900 text-white">
            Select an option
          </option>
          {REFERRAL_SOURCE_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {showReferrerFrom && (
        <div>
          <input
            {...register("referrer_from")}
            placeholder="Tell us where you heard about the show"
            className={INPUT_CLASS}
          />
          {errors.referrer_from && (
            <p className="mt-1 text-xs text-rose-400 font-medium">{errors.referrer_from.message}</p>
          )}
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Referral Code</label>
        <input
          {...register("referral_code")}
          placeholder="Please use the code handed to you by our partners, if any"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Interested in exhibiting or sponsorship opportunities?</label>
        <input {...register("why_exhibit")} placeholder="Tell us a little about your interest" className={INPUT_CLASS} />
      </div>

      <hr className="border-white/10" />

      <div>
        <p className={LABEL_CLASS}>Please tick any of the following free digital products you are interested in</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {DIGITAL_OFFERINGS.map((item) => (
            <label key={item.name} className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-200 hover:text-white">
              <input type="checkbox" {...register(item.name)} className="h-4 w-4 rounded accent-fuchsia-500" />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-white/10" />

      <div className="space-y-3">
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          By clicking Register below you submit this registration form for your interest and consent to the event
          organisers sending you emails regarding this event.
        </p>
        <label className="flex items-start gap-3 cursor-pointer text-xs font-bold text-white">
          <input
            type="checkbox"
            {...register("confirm")}
            className="mt-0.5 h-4 w-4 rounded accent-fuchsia-500 shrink-0"
          />
          <span>Please tick here to indicate you have read and understood this *</span>
        </label>
        {errors.confirm && <p className="text-xs text-rose-400 font-medium">{errors.confirm.message}</p>}
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          By clicking Register below, you consent to allow the show to store, share and process the personal
          information submitted above to provide you the content requested.
        </p>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/30 p-4 text-xs font-semibold text-rose-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-brand-gradient w-full rounded-full py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Ticket className="w-4 h-4" />
        {isSubmitting ? "Claiming your pass..." : "Claim Free Pass Now"}
      </button>
    </form>
  );
}
