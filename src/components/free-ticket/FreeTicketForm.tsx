"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import { freeTicketSchema, type FreeTicketInput } from "@/lib/validations/freeTicket";

const INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500";

const LABEL_CLASS = "block text-xs font-bold text-slate-700 uppercase mb-1";

const INTEREST_OPTIONS = [
  "Digital Marketing & Sales",
  "AI & Automation",
  "E-Commerce & Retail",
  "Cloud & Cybersecurity",
  "Networking & Partnership",
];

export function FreeTicketForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FreeTicketInput>({
    resolver: zodResolver(freeTicketSchema),
    defaultValues: { interest: INTEREST_OPTIONS[0] },
  });

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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 uppercase">Ticket Claimed!</h3>
        <p className="text-sm text-emerald-800 max-w-md mx-auto">
          Your free pass has been registered. Check your inbox for confirmation and access details closer to the show.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 text-xs font-bold text-emerald-700 hover:underline uppercase"
        >
          Claim Another Pass
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>First Name *</label>
          <input {...register("first_name")} placeholder="John" className={INPUT_CLASS} />
          {errors.first_name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Last Name *</label>
          <input {...register("last_name")} placeholder="Doe" className={INPUT_CLASS} />
          {errors.last_name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Work Email *</label>
        <input {...register("email")} type="email" placeholder="john@company.com" className={INPUT_CLASS} />
        {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Mobile Phone *</label>
          <input {...register("phone")} placeholder="+44 7700 900123" className={INPUT_CLASS} />
          {errors.phone && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLASS}>Company Name</label>
          <input {...register("business")} placeholder="Acme Inc" className={INPUT_CLASS} />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Job Title</label>
        <input {...register("position")} placeholder="Marketing Director" className={INPUT_CLASS} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Primary Interest</label>
        <select {...register("interest")} className={INPUT_CLASS}>
          {INTEREST_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-4 bg-gradient-to-r from-pink-600 to-indigo-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:opacity-95 transition text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Ticket className="w-4 h-4" />
        {isSubmitting ? "Claiming your pass..." : "Claim Free Pass Now"}
      </button>
    </form>
  );
}
