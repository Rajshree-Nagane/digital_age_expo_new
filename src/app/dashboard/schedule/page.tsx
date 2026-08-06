import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getMemberSchedule } from "@/lib/services/member";

export const metadata = {
  title: "My Schedule",
};

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const STATUS_STYLES: Record<string, string> = {
  Accepted: "bg-emerald-50 text-emerald-900",
  Proposed: "bg-amber-50 text-amber-900",
  inprogress: "bg-blue-50 text-blue-900",
  cancelled: "bg-red-50 text-red-900",
};

export default async function MySchedulePage() {
  const session = await getServerSession(authOptions);
  const userId = Number(session!.user.id);
  const meetings = await getMemberSchedule(userId);

  return (
    <div>
      <h1 className="text-2xl font-black uppercase text-indigo-950">My Schedule</h1>
      <p className="mt-2 text-indigo-950/70">Meetings booked with exhibitors, sponsors and speakers.</p>

      {meetings.length === 0 ? (
        <p className="mt-8 rounded-lg border border-indigo-950/10 p-6 text-indigo-950/70">
          You don&apos;t have any meetings scheduled yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="rounded-lg border border-indigo-950/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-indigo-950">{meeting.subject || "Meeting"}</p>
                {meeting.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_STYLES[meeting.status] || "bg-indigo-950/5 text-indigo-950"
                    }`}
                  >
                    {meeting.status}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-indigo-950/70">With {meeting.counterpartName}</p>
              <p className="mt-1 text-sm text-indigo-950/70">
                {meeting.startTime ? TIME_FORMAT.format(meeting.startTime) : "Time TBC"}
                {meeting.location ? ` · ${meeting.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
