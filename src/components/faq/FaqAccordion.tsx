"use client";

import { useState } from "react";
import type { FaqGroup } from "@/lib/services/faq";

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {groups.map((group) => (
        <div key={group.area}>
          <h2 className="text-xl font-bold text-indigo-950">{group.area}</h2>
          <div className="mt-4 space-y-3">
            {group.faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div key={faq.id} className="rounded-lg border border-indigo-950/10">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-indigo-950"
                  >
                    <span>{faq.question}</span>
                    <span className="ml-4 text-fuchsia-600">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-indigo-950/10 px-5 py-4 text-indigo-950/80">
                      <p className="whitespace-pre-line">{faq.response}</p>
                      {faq.attachment && (
                        <a
                          href={faq.attachment}
                          download
                          className="mt-3 inline-block text-sm font-semibold text-fuchsia-600 hover:underline"
                        >
                          Download Attachment
                        </a>
                      )}
                      {faq.videoUrl && (
                        <div className="mt-3 aspect-video overflow-hidden rounded-md bg-black">
                          <iframe
                            src={faq.videoUrl}
                            title={faq.question}
                            className="h-full w-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                          />
                        </div>
                      )}
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
