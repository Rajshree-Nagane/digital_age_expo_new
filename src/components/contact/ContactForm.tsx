"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { contactEnquirySchema, type ContactEnquiryInput } from "@/lib/validations/contactEnquiry";

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
    <div className="container pb-8 w-full max-w-4xl mx-auto">
      <div 
        id="contact_form_wrapper" 
        className="contact_top bg-white text-slate-950 p-8 sm:p-12 relative"
        style={{ border: "10px solid var(--color-brand-pink)" }}
      >
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          id="enquiry_form" 
          name="form-6a6101524d277" 
          className="space-y-6"
        >
          <div>
            <h1 className="text-black text-3xl font-bold tracking-tight mb-2">
              Get In Touch With Us
            </h1>
            <p className="text-xs text-slate-500">
              Have questions or enquiries? Drop us a message below.
            </p>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="first_name" className="block text-black font-bold text-sm mb-2">
                Your Name
              </label>
              <input
                id="first_name"
                type="text"
                placeholder="Name*"
                {...register("first_name")}
                className="w-full bg-slate-50 border border-slate-300 rounded-none px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink text-sm transition"
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{errors.first_name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-black font-bold text-sm mb-2">
                Your Email
              </label>
              <input
                id="email"
                type="text"
                placeholder="Email*"
                {...register("email")}
                className="w-full bg-slate-50 border border-slate-300 rounded-none px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink text-sm transition"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email.message}</p>
              )}
            </div>

            {/* Message Textarea */}
            <div>
              <label htmlFor="message" className="block text-black font-bold text-sm mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                cols={10}
                rows={10}
                placeholder="Message"
                {...register("message")}
                className="w-full bg-slate-50 border border-slate-300 rounded-none px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink text-sm transition resize-none"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{errors.message.message}</p>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {status === "success" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-none">
              ⚠️ Your message was received successfully! We will get in touch shortly.
            </div>
          )}

          {status === "error" && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-none">
              ⚠️ Something went wrong. Please check your inputs and try again.
            </div>
          )}

          {/* Submit buttons */}
          <div className="text-center pt-2">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                id="submit_bushido_enquiry"
                name="submit_bushido_enquiry"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto min-w-[160px] rounded-none border border-slate-900"
              >
                {isSubmitting ? "Sending..." : "CONTACT US"}
              </button>
              <button
                type="submit"
                id="submit_santoshk"
                name="submit_santoshk"
                disabled={isSubmitting}
                className="px-8 py-3.5 text-xs font-black uppercase tracking-widest transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto min-w-[160px] rounded-none text-white border"
                style={{ backgroundColor: "var(--color-brand-pink)", borderColor: "var(--color-brand-pink)" }}
              >
                {isSubmitting ? "Sending..." : "SEND"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
