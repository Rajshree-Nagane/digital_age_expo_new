"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CheckCircle2, HelpCircle } from "lucide-react";
import type { ChecklistSectionData, ChecklistSection } from "@/lib/services/eventChecklist";

function SectionPanel({ data }: { data: ChecklistSectionData }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(data.items.map((i) => [i.code, i.value]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const completed = Object.values(values).filter(Boolean).length;
  const percent = data.items.length > 0 ? Math.round((completed / data.items.length) * 100) : 0;

  async function onSave() {
    setIsSubmitting(true);
    setStatus("idle");
    try {
      await axios.patch("/api/members/checklist", { values });
      setStatus("success");
      router.refresh();
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (data.items.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border-dashed">
        <p className="text-zinc-500 font-medium italic">
          No checklist items have been configured for this section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">{data.label}</h3>
        <div className="flex items-center gap-4">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-pink to-brand-purple transition-all duration-1000 shadow-lg shadow-brand-pink/20"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-black text-white">{percent}%</span>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border-white/5">
        <div className="divide-y divide-white/5">
          {data.items.map((item) => (
            <div key={item.code} className="flex items-center justify-between gap-6 p-6 hover:bg-white/[0.02] transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200">{item.name}</span>
                  {item.description && (
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-zinc-600 hover:text-brand-pink transition-colors cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-white/10 rounded-xl text-[11px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                        {item.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValues((prev) => ({ ...prev, [item.code]: !prev[item.code] }))}
                className={`relative h-7 w-14 shrink-0 rounded-full transition-all duration-300 p-1 ${
                  values[item.code] ? "bg-brand-pink" : "bg-white/10"
                }`}
                aria-pressed={values[item.code]}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    values[item.code] ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={onSave}
          disabled={isSubmitting}
          className="rounded-full bg-brand-pink px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Progress"}
        </button>
        {status === "success" && (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Checklist saved.
          </span>
        )}
        {status === "error" && (
          <span className="text-sm font-bold text-red-500">Could not save. Please try again.</span>
        )}
      </div>
    </div>
  );
}

export function EventChecklistManager({ sections }: { sections: ChecklistSectionData[] }) {
  const [tab, setTab] = useState<ChecklistSection>("pre");
  const active = sections.find((s) => s.section === tab) ?? sections[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {sections.map((s) => (
          <button
            key={s.section}
            onClick={() => setTab(s.section)}
            className={`rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              tab === s.section
                ? "bg-brand-pink text-white shadow-lg shadow-brand-pink/20"
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {active && <SectionPanel key={active.section} data={active} />}
      </div>
    </div>
  );
}
