'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function FaqsAccordionSection() {
  const [activeFaqId, setActiveFaqId] = useState<string | null>('faq-1');

  const faqs = [
    {
      id: 'faq-1',
      question: "How do I claim my Free Access Badge?",
      answer: "You can click on the 'Get Free Ticket' button on any page and complete the short registration form. You will receive a PDF badge and access credentials directly in your email inbox."
    },
    {
      id: 'faq-2',
      question: "What technical requirements are there for the Virtual Platform?",
      answer: "The platform is fully browser-based and optimized for Google Chrome, Safari, and Microsoft Edge on desktops, laptops, and tablets. No plugins or downloads are required."
    },
    {
      id: 'faq-3',
      question: "Are the live session recordings available after the show?",
      answer: "Yes, Delegate and VIP Pass holders receive complete post-event access to all HD recordings of keynote lectures, panel discussions, and technical workshops on demand."
    },
    {
      id: 'faq-4',
      question: "How do virtual exhibitor stands work?",
      answer: "Exhibitor stands work similarly to in-person shows but online. Visitors can read brochures, watch introduction videos, browse websites, and click 'Call Now' to enter a direct live video call with your booth team."
    }
  ];

  return (
    <section className="relative overflow-hidden bg-surface-1/40 border-y border-white/10 px-6 py-20 text-white animate-fade-in">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <span className="text-xs font-bold font-mono text-brand-pink uppercase tracking-widest block">
            EXPO INQUIRIES
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => {
            const isOpen = activeFaqId === faq.id;
            return (
              <div 
                key={faq.id} 
                className="rounded-2xl border border-white/10 bg-surface-2/60 overflow-hidden transition-all duration-300"
                id={`faq-accordion-${faq.id}`}
              >
                <button
                  onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                  className="w-full text-left px-6 py-5 font-extrabold text-white text-sm uppercase flex justify-between items-center hover:bg-white/5 transition-colors"
                >
                  <span className="pr-4">{faq.question}</span>
                  <HelpCircle className={`w-5 h-5 text-zinc-500 shrink-0 transition-all ${isOpen ? 'rotate-180 text-brand-pink' : ''}`} />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100 border-t border-white/5 px-6 py-5' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <p className="text-zinc-400 text-sm leading-relaxed font-normal">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
