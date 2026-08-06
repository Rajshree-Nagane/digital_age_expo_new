"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { CheckCircle2, AlertCircle, Ticket, Sparkles, ArrowRight, Star, XCircle } from "lucide-react";
import { ticketPurchaseSchema, type TicketPurchaseInput } from "@/lib/validations/ticketPurchase";
import type { EventTicketRow } from "@/lib/services/eventTickets";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/15 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all";
const LABEL_CLASS = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300";

function formatAmount(amount: string | null) {
  if (amount === null) return null;
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return n === 0 ? "Free" : `£${n.toFixed(2)}`;
}

export function BuyTicketsClient({ tickets }: { tickets: EventTicketRow[] }) {
  const [selectedTicket, setSelectedTicket] = useState<EventTicketRow | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TicketPurchaseInput>({
    resolver: zodResolver(ticketPurchaseSchema),
  });

  function selectTicket(ticket: EventTicketRow) {
    if (ticket.soldOutTicket) return;
    setSelectedTicket(ticket);
    setValue("ticket_id", ticket.id);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function onSubmit(data: TicketPurchaseInput) {
    try {
      setStatus("idle");
      setErrorMessage(null);
      await axios.post("/api/buy-tickets", data);
      setStatus("success");
      reset();
    } catch (err: unknown) {
      setStatus("error");
      if (isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(
          typeof err.response.data.error === "string"
            ? err.response.data.error
            : "We couldn't process your request. Please check your details."
        );
      } else {
        setErrorMessage("Something went wrong with your request. Please try again.");
      }
    }
  }

  if (tickets.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400 font-medium">
        Ticket sales for this event haven&apos;t opened yet — please check back soon or{" "}
        <a href="/contact" className="text-fuchsia-400 underline">
          contact us
        </a>{" "}
        for more information.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      {/* Ticket Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => {
          const isSelected = selectedTicket?.id === ticket.id;
          return (
            <div
              key={ticket.id}
              className={`relative rounded-3xl border p-6 sm:p-8 shadow-2xl backdrop-blur-md transition-all duration-300 ${
                isSelected
                  ? "bg-fuchsia-950/40 border-fuchsia-500 ring-2 ring-fuchsia-500/50"
                  : "bg-slate-900/90 border-white/15 hover:border-fuchsia-500/40"
              }`}
            >
              {ticket.featuredTicket && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-pink-500 text-white text-xs font-bold uppercase tracking-wider shadow flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Most Popular
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{ticket.name}</h3>
                {ticket.subTitle && <p className="text-xs text-fuchsia-300 font-bold uppercase tracking-wide">{ticket.subTitle}</p>}

                <div className="text-3xl font-black text-white">
                  {formatAmount(ticket.amount) ?? "Contact Us"}
                  {ticket.applyEarlyBird && ticket.earlyBirdDiscount && (
                    <span className="ml-2 text-xs font-bold text-emerald-400 align-middle">
                      {ticket.earlyBirdDiscount}% early bird
                    </span>
                  )}
                </div>

                {ticket.description && (
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">{ticket.description}</p>
                )}

                <button
                  type="button"
                  onClick={() => selectTicket(ticket)}
                  disabled={!!ticket.soldOutTicket}
                  className={`w-full mt-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                    ticket.soldOutTicket
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : isSelected
                        ? "btn-brand-gradient text-white shadow-lg"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  {ticket.soldOutTicket ? (
                    <>
                      <XCircle className="w-4 h-4" /> Sold Out
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" /> {isSelected ? "Selected" : "Select This Pass"}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration Form */}
      {selectedTicket && (
        <div id="ticket-form" className="max-w-2xl mx-auto">
          {status === "success" ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-8 sm:p-12 text-center text-emerald-200 backdrop-blur-md space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black uppercase text-white">Ticket Request Received!</h3>
              <p className="text-sm sm:text-base max-w-lg mx-auto font-medium text-emerald-300">
                Thank you for requesting the {selectedTicket.name} pass. Our team will be in touch shortly to confirm your registration and complete payment.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTicket(null);
                  setStatus("idle");
                }}
                className="rounded-full border border-white/20 bg-slate-800/80 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-700 transition"
              >
                Choose Another Pass
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-3xl border border-fuchsia-500/30 bg-slate-900/95 p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-6"
            >
              <div className="border-b border-white/10 pb-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-fuchsia-300 mb-2">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{selectedTicket.name}</span>
                </div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight">Your Details</h2>
              </div>

              <input type="hidden" {...register("ticket_id", { valueAsNumber: true })} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS}>First Name*</label>
                  <input {...register("first_name")} className={INPUT_CLASS} placeholder="e.g. Sarah" />
                  {errors.first_name && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS}>Last Name*</label>
                  <input {...register("last_name")} className={INPUT_CLASS} placeholder="e.g. Jenkins" />
                  {errors.last_name && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.last_name.message}</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS}>Email Address*</label>
                  <input {...register("email")} type="email" className={INPUT_CLASS} placeholder="sarah@company.com" />
                  {errors.email && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email.message}</p>}
                </div>
                <div>
                  <label className={LABEL_CLASS}>Phone</label>
                  <input {...register("phone")} className={INPUT_CLASS} placeholder="e.g. +44 7700 900456" />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Company Name</label>
                  <input {...register("business")} className={INPUT_CLASS} placeholder="e.g. Acme Inc" />
                </div>
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
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting..." : "Request This Pass"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
