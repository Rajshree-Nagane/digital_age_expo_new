import { redirect } from "next/navigation";

export default function NotificationsRedirect() {
  redirect("/members/event_notifications");
}
