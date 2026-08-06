"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/newsletter";

export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema) });

  async function onSubmit(data: NewsletterInput) {
    try {
      await axios.post("/api/newsletter", data);
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <input
          {...register("name")}
          type="text"
          placeholder="Your name"
          className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name.message}</p>}
      </div>
      <div>
        <input
          {...register("email")}
          type="email"
          placeholder="Your email address"
          className="w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none"
        />
        {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-fuchsia-600 px-4 py-2 font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
      >
        {isSubmitting ? "Signing up..." : "Sign Up"}
      </button>
      {status === "success" && <p className="text-sm text-emerald-300">You&apos;re subscribed!</p>}
      {status === "error" && <p className="text-sm text-red-300">Something went wrong. Please try again.</p>}
    </form>
  );
}
