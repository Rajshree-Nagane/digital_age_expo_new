'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';
import { ScheduleDay, ScheduleSlot } from '@/lib/services/schedule';

interface Props {
  scheduleDays: ScheduleDay[];
}

export function HomeSchedulePreview({ scheduleDays }: Props) {
  // Extract first 2 slots across any days, or use premium tech fallbacks
  const slots: (ScheduleSlot & { dayTitle?: string })[] = [];
  for (const day of scheduleDays) {
    for (const slot of day.slots) {
      slots.push({ ...slot, dayTitle: day.dayTitle });
    }
  }

  const displaySlots = slots.slice(0, 2);

  const fallbackSlots = [
    {
      id: 101,
      title: "Keynote: Redefining Corporate Operations with Advanced Neural Architecture",
      description: "How leading architectures leverage cognitive pipelines and deep machine intelligence to scale corporate logistics and compliance workflows seamlessly.",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      agendaName: "Main Seminar Stage",
      speakerName: "Dr. Aria Chen",
      dayTitle: "Day 1"
    },
    {
      id: 102,
      title: "Panel: Scaling Secure Decentrailised Ledgers in Financial Networks",
      description: "NexaScale and partners debate the scaling and throughput milestones for peer-to-peer enterprise financial ledgers under quantum threats.",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      agendaName: "FinTech Innovation Hub",
      speakerName: "Marcus Vance",
      dayTitle: "Day 1"
    }
  ];

  const sessionsToRender = displaySlots.length > 0 ? displaySlots : fallbackSlots;

  return (
    <section className="relative overflow-hidden bg-surface-1/40 px-6 py-20 text-white border-y border-white/10">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-bold font-mono text-brand-pink uppercase tracking-widest block">
              STAGE SCHEDULES
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
              Live Schedules Preview
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              A snapshot of major technical presentations taking place across stages. Register a delegate pass for full interactive access.
            </p>
          </div>
          <Link 
            href="/event_schedule"
            className="flex items-center gap-2 text-xs text-brand-pink hover:text-brand-pink/80 font-extrabold tracking-widest uppercase shrink-0 transition-colors"
          >
            <span>EXPLORE FULL SCHEDULE</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sessionsToRender.map((session) => (
            <div 
              key={session.id} 
              className="rounded-2xl glass-panel p-6 flex flex-col justify-between h-56 transition-all duration-350 hover:border-brand-pink/50 hover:shadow-lg hover:shadow-brand-pink/10 animate-fade-in"
              id={`schedule-slot-${session.id}`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold font-mono text-brand-pink uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{session.startTime} - {session.endTime}</span>
                  <span className="text-zinc-700">|</span>
                  <span>{session.agendaName || "Stage Presentation"}</span>
                  {session.dayTitle && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <span>{session.dayTitle}</span>
                    </>
                  )}
                </div>
                <h4 className="text-base font-extrabold text-white leading-snug uppercase tracking-wide line-clamp-1">
                  {session.title}
                </h4>
                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                  {session.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 text-zinc-400 flex justify-between items-center text-[10px] font-mono">
                <span>HOST: <span className="font-extrabold text-white uppercase">{session.speakerName || "Specialist Keynote Speaker"}</span></span>
                <span className="bg-surface-2 px-3 py-1 rounded-md border border-white/5 uppercase font-extrabold text-[9px] text-brand-pink">
                  Virtual Lobby Entry
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
