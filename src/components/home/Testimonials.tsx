'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { assetUrl } from "@/lib/assets";

export function Testimonials() {
  const defaultTestimonials = [
    {
      id: "test-1",
      name: "Marcus Vance",
      role: "Lead Systems Architect",
      company: "AetherOps",
      content: "Exhibiting at the Digital Age Expo brought us over 40 highly qualified enterprise leads with zero travel friction. The face-to-face video matchmaking software is extremely powerful.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
    },
    {
      id: "test-2",
      name: "Sarah Jenkins",
      role: "VP of Product",
      company: "NexaScale",
      content: "The expert masterclasses alone were worth the Delegate Pass. I've sent my entire software infrastructure team to attend the zero-trust compliance panels. Absolute goldmine.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
    }
  ];

  return (
    <section className="relative overflow-hidden bg-surface-1/40 border-y border-white/10 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl space-y-14">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <span className="text-xs font-bold font-mono text-brand-pink uppercase tracking-widest block">
            ATTENDEE STORIES
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
            Testimonials from our Cohort
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {defaultTestimonials.map((test) => (
            <div 
              key={test.id} 
              className="rounded-2xl glass-panel p-6 space-y-6 flex flex-col justify-between transition-all duration-350 hover:border-brand-pink/50 hover:shadow-lg hover:shadow-brand-pink/10 animate-fade-in"
              id={`testimonial-item-${test.id}`}
            >
              <div className="space-y-3">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-zinc-300 italic text-sm leading-relaxed font-normal">
                  &ldquo;{test.content}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-surface-2 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={assetUrl(test.avatar)} 
                    alt={test.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm uppercase tracking-wider font-display">
                    {test.name}
                  </h5>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">
                    {test.role} @ <span className="font-bold text-brand-pink">{test.company}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
