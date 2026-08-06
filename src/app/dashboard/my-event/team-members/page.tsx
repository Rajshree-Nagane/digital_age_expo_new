import { redirect } from "next/navigation";

export default function TeamMembersRedirect() {
  redirect("/members/event_member");
}
