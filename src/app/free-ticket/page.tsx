import { getDomain } from "@/lib/services/domain";
import { getEventById } from "@/lib/services/events";
import { formatDateLocation } from "@/lib/format";
import { FreeTicketForm } from "@/components/free-ticket/FreeTicketForm";
import { CheckCircle, Ticket, Calendar, Clock, MapPin, Sparkles } from "lucide-react";

export const metadata = {
  title: "Get Your Free Ticket | Digital Age Expo",
  description: "Claim your complimentary visitor pass for Digital Age Expo. Access live keynotes, workshops, and virtual exhibition halls.",
};

export default async function FreeTicketPage() {
  const domain = await getDomain();
  const event = domain.event_id ? await getEventById(domain.event_id) : null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-pink-950 text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(var(--color-pink-500-rgb), 0.15),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4 border border-pink-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Limited Time Free Entry Pass
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Claim Your <span className="text-pink-500">Free Ticket</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Join thousands of tech leaders, business founders, and digital innovators at {domain.name}. Complete the registration below for instant access.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Registration Form Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-indigo-950 mb-2 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-pink-500" /> Pass Registration
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Fill in your details to receive your digital badge and login credentials.
            </p>

            <FreeTicketForm />
          </div>

          {/* Ticket Inclusions & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                What Your Pass Includes
              </h3>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Full access to Virtual Exhibition Halls & Booths</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Attendance to all Keynotes & Masterclasses</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <span>Interactive Speed Networking Lounge access</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                  <span>On-demand session recordings for 30 days</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-700 text-sm">
                <Calendar className="w-5 h-5 text-pink-500 shrink-0" />
                <div>
                  <div className="font-bold">Date & Time</div>
                  <div className="text-xs text-slate-500">
                    {event ? formatDateLocation(event.date_start, event.date_end, null) : "Live Virtual Event Days"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700 text-sm">
                <MapPin className="w-5 h-5 text-pink-500 shrink-0" />
                <div>
                  <div className="font-bold">Location</div>
                  <div className="text-xs text-slate-500">{event?.venue || "Global Virtual Event Platform"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}