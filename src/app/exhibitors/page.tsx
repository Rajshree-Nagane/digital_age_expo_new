import { getDomain } from "@/lib/services/domain";
import { getEventExhibitorsPaged, getExhibitionZoneName } from "@/lib/services/exhibitors";
import { ExhibitorsGrid } from "@/components/exhibitors/ExhibitorsGrid";

export const metadata = {
  title: "Exhibitors",
  description: "Top exhibitors driving business growth at this event.",
};

const PAGE_SIZE = 20;

export default async function ExhibitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; zone?: string }>;
}) {
  const { page: pageParam, zone: zoneParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const zoneId = zoneParam ? Number(zoneParam) || undefined : undefined;

  const domain = await getDomain();
  const [{ exhibitors, total }, zoneName] = await Promise.all([
    domain.event_id
      ? getEventExhibitorsPaged(domain.event_id, page, PAGE_SIZE, zoneId)
      : Promise.resolve({ exhibitors: [], total: 0, page, pageSize: PAGE_SIZE }),
    zoneId ? getExhibitionZoneName(zoneId) : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ExhibitorsGrid
      exhibitors={exhibitors}
      currentPage={page}
      totalPages={totalPages}
      zoneId={zoneId}
      zoneName={zoneName}
    />
  );
}
