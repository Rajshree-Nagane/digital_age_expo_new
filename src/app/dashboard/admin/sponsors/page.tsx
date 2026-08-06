import { getDomain } from "@/lib/services/domain";
import { getSponsorsForAdmin } from "@/lib/services/sponsors";
import { RegistrationTable } from "@/components/admin/RegistrationTable";

export const metadata = { title: "Manage Sponsors" };

const STATUS_ACTIONS = [
  { value: "approved", label: "Approve", tone: "approve" as const },
  { value: "pending", label: "Set Pending", tone: "pending" as const },
  { value: "unapproved", label: "Reject", tone: "reject" as const },
];

export default async function AdminSponsorsPage() {
  const domain = await getDomain();
  const sponsors = domain.event_id ? await getSponsorsForAdmin(domain.event_id) : [];

  return (
    <RegistrationTable
      rows={sponsors}
      apiBasePath="/api/admin/sponsors"
      statusActions={STATUS_ACTIONS}
      extraColumn={{ label: "Sponsor Type", render: (row) => row.sponsorType || "—" }}
    />
  );
}
