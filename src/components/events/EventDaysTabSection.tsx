"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Search } from 'lucide-react';
import { assetUrl } from '@/lib/assets';
import { speakerSlug } from '@/lib/slug';
import type { ScheduleDay } from '@/lib/services/schedule';

interface Props {
  categoryTitle: string;
  enrollText: string;
  /** Real event schedule days (from getEventSchedule), indexed 0/1/2 for Day 1/2/3. */
  days?: ScheduleDay[];
  /** Substring matched (case-insensitive) against each slot's agenda/venue name to scope the
   * schedule down to this page's zone, e.g. "webinar", "masterclass", "vip". */
  zoneKeyword?: string;
}

const DAY_META = [
  { id: "date_1" as const, label: "Day 1 - August 26, 2026", subtitle: "Event Start Day" },
  { id: "date_2" as const, label: "Day 2 - August 27, 2026", subtitle: "Mid Event Day" },
  { id: "date_3" as const, label: "Day 3 - August 28, 2026", subtitle: "Event Closure Day" },
];

export function EventDaysTabSection({ categoryTitle, enrollText, days = [], zoneKeyword }: Props) {
  const [activeTab, setActiveTab] = useState<"date_1" | "date_2" | "date_3">("date_1");
  const activeIndex = DAY_META.findIndex((d) => d.id === activeTab);

  const daySlots = days[activeIndex]?.slots ?? [];
  const keyword = zoneKeyword?.toLowerCase().trim();
  const filteredSlots = keyword
    ? daySlots.filter((slot) => (slot.agendaName || "").toLowerCase().includes(keyword))
    : daySlots;

  return (
    <div className="w-full bg-slate-950 text-white min-h-screen pb-20">
      <div className="container mx-auto px-4 sm:px-6 pt-10">
        <div className="space-y-4">
          {/* Day Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DAY_META.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveTab(day.id)}
                className={`p-6 text-left rounded-2xl border transition-all ${
                  activeTab === day.id
                    ? "bg-fuchsia-600/20 border-fuchsia-500 shadow-lg ring-1 ring-fuchsia-500"
                    : "bg-slate-900/90 border-white/10 hover:border-white/20"
                }`}
              >
                <h3 className="text-lg font-black uppercase text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>{day.label}</span>
                  <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider">{day.subtitle}</span>
                </h3>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-3xl border border-white/15 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-md my-8">
            {filteredSlots.length > 0 ? (
              <div className="space-y-4 w-full">
                {filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-2xl border border-white/10 bg-slate-950/60 hover:border-fuchsia-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 px-3.5 py-2 rounded-xl border border-fuchsia-500/20 shrink-0">
                      <Clock className="w-4 h-4" />
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        {slot.agendaName || "General Session"}
                      </span>
                      <h4 className="text-base font-bold text-white leading-snug">{slot.title}</h4>
                      {slot.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{slot.description}</p>
                      )}
                    </div>

                    {slot.speakerId && slot.speakerName && (
                      <Link
                        href={`/speaker/${speakerSlug(slot.speakerName, slot.speakerId)}`}
                        className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 hover:border-fuchsia-500/50 transition-all sm:w-64 shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(slot.speakerProfilePic) ?? "/no-image.jpg"}
                          alt={slot.speakerName}
                          className="w-10 h-10 rounded-full object-cover border border-fuchsia-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{slot.speakerName}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {slot.speakerPosition} {slot.speakerBusiness ? `• ${slot.speakerBusiness}` : ""}
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
                  <Search className="w-7 h-7" />
                </div>
                <p className="text-slate-400 font-medium text-sm sm:text-base">
                  No records found for {DAY_META[activeIndex]?.label.split(" - ")[0] ?? "this day"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Speaker / Registration Section */}
        <div className="py-16 text-center space-y-6 border-t border-white/10 mt-12">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-fuchsia-400">Your story. Your vision. Our stage.</p>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">{categoryTitle}</h2>
          </div>

          <div>
            <p className="text-slate-300 text-sm font-medium">Be the First one to Register for {categoryTitle.toLowerCase()}</p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/view_speaker"
              className="rounded-full border border-white/20 bg-slate-800/90 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-8 py-4 shadow-lg transition-all duration-300 hover:scale-105"
            >
              View All Speakers
            </Link>

            <Link
              href="/speaker_registration"
              className="btn-brand-gradient inline-flex items-center gap-2 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>{enrollText}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
