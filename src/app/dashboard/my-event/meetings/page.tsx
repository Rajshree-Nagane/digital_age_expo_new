import { redirect } from "next/navigation";

export default function MeetingsRedirect() {
  redirect("/members/event_schedule_meeting");
}
