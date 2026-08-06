"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { EventFaqItem } from "@/lib/services/eventFaqDisplay";

interface Props {
  items: EventFaqItem[];
  canManage: boolean;
}

export function EventFaqList({ items, canManage }: Props) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function toggleVisibility(fieldKey: string, currentStatus: boolean) {
    if (!canManage) return;
    setPendingKey(fieldKey);
    try {
      await axios.post("/api/members/event-faq/permission", {
        fieldKey,
        published: !currentStatus,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update FAQ permission", err);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-white/10">
          <p className="text-zinc-500 font-medium italic">No FAQ items defined for this event yet.</p>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.fieldKey}
            className={`glass-panel rounded-3xl p-8 border-white/10 shadow-xl backdrop-blur-md relative transition-opacity duration-300 ${
              !item.published && canManage ? "opacity-60" : ""
            }`}
          >
            <div className={canManage ? "pr-32" : ""}>
              <h3 className="text-lg font-black uppercase tracking-tight text-white mb-4">
                {item.question}
              </h3>
              <div className="prose prose-invert prose-pink prose-sm max-w-none text-zinc-400 font-medium leading-relaxed">
                {item.answer}
              </div>
            </div>

            {canManage && (
              <div className="absolute top-8 right-8">
                <button
                  disabled={pendingKey === item.fieldKey}
                  onClick={() => toggleVisibility(item.fieldKey, item.published)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 ${
                    item.published
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                      : "bg-zinc-800 text-zinc-500 border border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pendingKey === item.fieldKey ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : item.published ? (
                    <>
                      <Eye className="h-3 w-3" /> Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" /> Unpublished
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
