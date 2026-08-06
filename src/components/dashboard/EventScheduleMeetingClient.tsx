"use client";

import { useState } from "react";
import { Calendar, Layers, Users } from "lucide-react";
import type { EventMeetingRow } from "@/lib/services/eventMeetings";
import type { EventScheduleData } from "@/lib/services/eventSchedule";
import type { EventMemberContext } from "@/lib/services/eventAccess";
import { EventMeetingsTable } from "@/components/dashboard/EventMeetingsTable";
import { EventScheduleManager } from "@/components/dashboard/EventScheduleManager";

interface Props {
  scheduleData: EventScheduleData;
  meetings: EventMeetingRow[];
  context: EventMemberContext;
}

export function EventScheduleMeetingClient({
  scheduleData,
  meetings,
  context,
}: Props) {
  const [activeTab, setActiveTab] = useState<"schedule" | "meetings">("schedule");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-brand-pink" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">Event Administration</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            {activeTab === "schedule" ? "Event Schedule & Phases" : "Scheduled 1:1 Meetings"}
          </h1>
          <p className="text-zinc-400 font-medium max-w-2xl">
            {activeTab === "schedule"
              ? "Configure event schedule phases, auto-schedule timelines, manage calendar tasks, and set activity dates."
              : context.role === "organiser"
              ? "Every 1:1 meeting booked across exhibitors, speakers, and attendees for this event."
              : "Meetings booked with you for this event."}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-zinc-900/90 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === "schedule"
                ? "bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-lg"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Event Schedule ({scheduleData.schedules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("meetings")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === "meetings"
                ? "bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-lg"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="h-4 w-4" />
            1:1 Meetings ({meetings.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "schedule" ? (
        <EventScheduleManager
          initialData={scheduleData}
          eventId={context.eventId}
        />
      ) : (
        <div className="glass-panel rounded-3xl p-8 border border-white/10 bg-zinc-900/90 shadow-2xl">
          <EventMeetingsTable meetings={meetings} role={context.role} />
        </div>
      )}
    </div>
  );
}
