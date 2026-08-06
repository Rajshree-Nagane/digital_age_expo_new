"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import type { AboutUsField } from "@/lib/services/eventAboutUs";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-all";

interface Props {
  tabName: string;
  fields: AboutUsField[];
}

export function AboutUsManager({ tabName, fields }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [String(f.fieldId), f.value]))
  );
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (fields.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-20 text-center">
        <p className="text-zinc-500 font-medium italic">
          No {tabName} fields have been configured for this event yet.
        </p>
      </div>
    );
  }

  function setValue(fieldId: number, value: string) {
    setValues((prev) => ({ ...prev, [String(fieldId)]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missing = fields.find((f) => f.required && !values[String(f.fieldId)]?.trim());
    if (missing) {
      setStatus("error");
      setErrorMessage(`"${missing.label}" is required.`);
      return;
    }

    setStatus("saving");
    setErrorMessage(null);
    try {
      await axios.put("/api/members/about-us", values);
      setStatus("success");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save settings. Please try again."
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <div className="grid gap-6">
        {fields.map((field) => (
          <div key={field.fieldId} className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              {field.label}
              {field.required && <span className="text-brand-pink">*</span>}
            </label>
            {field.description && <p className="text-xs font-medium text-zinc-500">{field.description}</p>}
            {field.isLongText ? (
              <textarea
                value={values[String(field.fieldId)] ?? ""}
                onChange={(e) => setValue(field.fieldId, e.target.value)}
                rows={6}
                className={`${FIELD_CLASS} resize-none`}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            ) : (
              <input
                value={values[String(field.fieldId)] ?? ""}
                onChange={(e) => setValue(field.fieldId, e.target.value)}
                className={FIELD_CLASS}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={status === "saving"}
          className="btn-brand-gradient w-full sm:w-auto rounded-full px-10 py-4 text-sm font-black uppercase tracking-widest text-white shadow-2xl transition hover:scale-105 disabled:opacity-60"
        >
          {status === "saving" ? "Processing..." : "Save Changes"}
        </button>

        {status === "error" && errorMessage && (
          <p className="text-xs font-bold text-red-400 animate-in fade-in slide-in-from-left-2 duration-300">
            {errorMessage}
          </p>
        )}
        {status === "success" && (
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-300">
            Successfully Updated
          </p>
        )}
      </div>
    </form>
  );
}
