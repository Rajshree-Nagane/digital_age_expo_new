import Link from "next/link";
import { CalendarDays, Clock3, Mic2 } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { speakerSlug } from "@/lib/slug";
import type { ScheduleDay } from "@/lib/services/schedule";

export function ScheduleDaySection({ day }: { day: ScheduleDay }) {
  return (
    <div className="mx-auto max-w-6xl">

      {/* Day Header */}
      <div className="mb-10 text-center">
        {day.dayTitle && (
          <span className="inline-flex rounded-full border border-brand-pink/30 bg-brand-pink/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-brand-pink">
            {day.dayTitle}
          </span>
        )}

        <div className="mt-5 flex items-center justify-center gap-3">
          <CalendarDays className="h-7 w-7 text-brand-pink" />

          <h3 className="font-display text-4xl font-black sophisticated-gradient-text">
            {day.dateLabel}
          </h3>
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-6">
        {day.slots.map((slot) => (
          <div
            key={slot.id}
            className="glass-panel hover-tilt-3d rounded-3xl p-6 transition-all duration-300"
          >
            <div className="flex flex-col gap-6 lg:flex-row">

              {/* Time */}
              <div className="flex w-full items-start gap-3 lg:w-52 lg:flex-col lg:border-r lg:border-white/10 lg:pr-6">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink">
                  <Clock3 className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-pink">
                    Session Time
                  </p>

                  <p className="mt-2 text-lg font-bold text-white">
                    {slot.startTime} – {slot.endTime}
                  </p>
                </div>
              </div>

              {/* Session Details */}
              <div className="flex-1">

                <div className="flex items-center gap-3">
                  <Mic2 className="h-5 w-5 text-brand-pink" />

                  <h4 className="text-2xl font-display font-bold text-white">
                    {slot.title}
                  </h4>
                </div>

                {slot.agendaName && (
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-pink">
                    {slot.agendaName}
                  </p>
                )}

                {slot.description && (
                  <p className="mt-4 leading-8 text-zinc-300">
                    {slot.description}
                  </p>
                )}
              </div>

            
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}