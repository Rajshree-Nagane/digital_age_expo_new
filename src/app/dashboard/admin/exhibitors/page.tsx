import { getDomain } from "@/lib/services/domain";
import { getExhibitorsForAdmin } from "@/lib/services/exhibitors";
import { RegistrationTable } from "@/components/admin/RegistrationTable";

export const metadata = { title: "Manage Exhibitors" };

const STATUS_ACTIONS = [
  { value: "active", label: "Approve", tone: "approve" as const },
  { value: "pending", label: "Set Pending", tone: "pending" as const },
  { value: "excluded", label: "Reject", tone: "reject" as const },
];

export default async function AdminExhibitorsPage() {
  const domain = await getDomain();
  const exhibitors = domain.event_id ? await getExhibitorsForAdmin(domain.event_id) : [];

  return (
    <RegistrationTable
      rows={exhibitors}
      apiBasePath="/api/admin/exhibitors"
      statusActions={STATUS_ACTIONS}
      extraColumn={{ label: "Stand", field: "standNumber" }}
    />
  );
}
