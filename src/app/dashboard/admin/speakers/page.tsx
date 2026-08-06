import { getDomain } from "@/lib/services/domain";
import { getSpeakersForAdmin } from "@/lib/services/speakers";
import { RegistrationTable } from "@/components/admin/RegistrationTable";

export const metadata = { title: "Manage Speakers" };

const STATUS_ACTIONS = [
  { value: "active", label: "Approve", tone: "approve" as const },
  { value: "pending", label: "Set Pending", tone: "pending" as const },
  { value: "reject", label: "Reject", tone: "reject" as const },
];

export default async function AdminSpeakersPage() {
  const domain = await getDomain();
  const speakers = domain.event_id ? await getSpeakersForAdmin(domain.event_id) : [];

  return (
    <RegistrationTable
      rows={speakers}
      apiBasePath="/api/admin/speakers"
      statusActions={STATUS_ACTIONS}
      extraColumn={{ label: "Topic", render: (row) => row.title || "—" }}
    />
  );
}
