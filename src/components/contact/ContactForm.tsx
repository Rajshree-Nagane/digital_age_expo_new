"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { contactEnquirySchema, type ContactEnquiryInput } from "@/lib/validations/contactEnquiry";

/**
 * Palette note: this card used to be `bg-white text-slate-950` with a 10px pink
 * border — a light block dropped into a dark site. Worse, globals.css styles every
 * input with `background-color: rgb(var(--color-surface-1-rgb) / 0.8) !important`
 * and `color: white !important`, so the fields rendered dark-on-dark INSIDE the
 * white card and the typed text was barely legible.
 *
 * It is now a `.glass-panel` on the site's zinc-950 surface, with the brand accent
 * kept as the gradient rule along the top edge (same ramp as the footer's divider)
 * instead of a heavy border. Input colours are left to the global rules rather than
 * fought with local classes.
 */
const FIELD_CLASS =
  "w-full rounded-xl border px-4 py-3 text-sm transition placeholder:text-zinc-500";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactEnquiryInput>({ resolver: zodResolver(contactEnquirySchema) });

  async function onSubmit(data: ContactEnquiryInput) {
    try {
      await axios.post("/api/contact", data);
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-full">
      <div
        id="contact_form_wrapper"
        className="contact_top glass-panel relative overflow-hidden rounded-3xl p-8 text-white sm:p-12"
      >
        {/* Brand accent rule — mirrors the divider above the site footer */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-purple via-fuchsia-500 to-brand-pink" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          id="enquiry_form"
          name="form-6a6101524d277"
          className="space-y-6"
        >
          <div>
            <h2 className="mb-2 text-3xl font-black tracking-tight text-white">
              Get In Touch <span className="brand-gradient-text">With Us</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Have questions or enquiries? Drop us a message below.
            </p>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="first_name" className="mb-2 block text-sm font-bold text-zinc-300">
                Your Name
              </label>
              <input
                id="first_name"
                type="text"
                placeholder="Name*"
                aria-invalid={!!errors.first_name}
                {...register("first_name")}
                className={FIELD_CLASS}
              />
              {errors.first_name && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.first_name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-zinc-300">
                Your Email
              </label>
              <input
                id="email"
                type="text"
                placeholder="Email*"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={FIELD_CLASS}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Message Textarea */}
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-bold text-zinc-300">
                Your Message
              </label>
              <textarea
                id="message"
                cols={10}
                rows={10}
                placeholder="Message"
                aria-invalid={!!errors.message}
                {...register("message")}
                className={`${FIELD_CLASS} resize-none`}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">{errors.message.message}</p>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {status === "success" && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300"
            >
              <CheckCircle2 className="mt-px h-4 w-4 shrink-0" />
              <span>Your message was received successfully! We will get in touch shortly.</span>
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-300"
            >
              <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
              <span>Something went wrong. Please check your inputs and try again.</span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-2 text-center">
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                type="submit"
                id="submit_bushido_enquiry"
                name="submit_bushido_enquiry"
                disabled={isSubmitting}
                className="flex w-full min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Contact Us"}
              </button>
              <button
                type="submit"
                id="submit_santoshk"
                name="submit_santoshk"
                disabled={isSubmitting}
                className="btn-brand-gradient flex w-full min-w-[160px] cursor-pointer items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-xs font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
