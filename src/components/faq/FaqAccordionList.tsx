"use client";

import { useState } from "react";
import type { FaqGroup } from "@/lib/services/faq";

export function FaqAccordionList({ groups }: { groups: FaqGroup[] }) {
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({});

  const toggleAccordion = (id: number) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-700 font-medium">
        FAQs are being updated for this event — please check back soon or contact us directly.
      </div>
    );
  }

  return (
    <div className="space-y-8" id="accordion">
      {groups.map((group) => (
        <div key={group.area} className="space-y-4">
          <h2 className="text-black text-2xl font-black border-b border-pink-600/30 pb-2">
            {group.area}
          </h2>

          <div className="space-y-3">
            {group.faqs.map((faq, index) => {
              const isOpen = openIds[faq.id] || false;
              const isPrimary = index % 2 === 0;
              const bgClass = isPrimary ? "bg-indigo-950" : "bg-purple-950";

              return (
                <div
                  key={faq.id}
                  className={`rounded-xl border border-white/10 shadow-md overflow-hidden ${bgClass}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="faq-link flex w-full items-center justify-between p-5 text-left transition hover:opacity-90"
                  >
                    <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-3 pr-4">
                      <span className="text-fuchsia-400">▶</span>
                      {faq.question}
                    </h4>
                    <span className="shrink-0 text-white">
                      <span className="text-2xl">❓</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 p-5 bg-black/30 text-white/90 text-sm sm:text-base leading-relaxed">
                      <p className="whitespace-pre-line">{faq.response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
