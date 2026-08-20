import { getDomain } from "@/lib/services/domain";
import { getVisitorsForAdmin } from "@/lib/services/visitors";
import { RegistrationTable } from "@/components/admin/RegistrationTable";

export const metadata = { title: "Manage Visitors" };

const STATUS_ACTIONS = [
  { value: "Registered", label: "Approve", tone: "approve" as const },
  { value: "Pending", label: "Set Pending", tone: "pending" as const },
  { value: "Excluded", label: "Reject", tone: "reject" as const },
];

export default async function AdminVisitorsPage() {
  const domain = await getDomain();
  const visitors = domain.event_id ? await getVisitorsForAdmin(domain.event_id) : [];

  return (
    <RegistrationTable
      rows={visitors}
      apiBasePath="/api/admin/visitors"
      statusActions={STATUS_ACTIONS}
      extraColumn={{ label: "Referral Code", field: "referralCode" }}
    />
  );
}
