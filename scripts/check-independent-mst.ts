// scripts/check-independent-mst.ts
//
// Diagnostic only — makes NO changes to any data. Reports how many rows
// independent_mst currently has in the live Neon database, broken down by
// typ_id, so we can confirm whether typ_id=7 (Industries, used by
// /members/view_industry_list) is genuinely empty or something else is wrong.
//
// Safe to re-run. Run with: npx tsx scripts/check-independent-mst.ts
import "dotenv/config"; // same recurring gotcha as every other standalone script in this
// project — src/lib/prisma.ts would silently fall back to its in-memory mock client without this.
import { prisma } from "@/lib/prisma";

async function main() {
  const total = await prisma.independent_mst.count();
  console.log(`independent_mst total rows (all typ_id): ${total}`);

  const byType = await prisma.independent_mst.groupBy({
    by: ["typ_id"],
    _count: { _all: true },
    orderBy: { typ_id: "asc" },
  });

  console.log("\nRow counts by typ_id:");
  if (byType.length === 0) {
    console.log("  (table is completely empty)");
  } else {
    for (const row of byType) {
      const marker = row.typ_id === 7 ? "   <-- Industries (view_industry_list)" : "";
      console.log(`  typ_id=${row.typ_id ?? "NULL"}: ${row._count._all} rows${marker}`);
    }
  }

  const industryRows = await prisma.independent_mst.findMany({
    where: { typ_id: 7 },
    select: { id: true, mstr_nm: true, mstr_cd: true, status: true },
    take: 20,
  });

  console.log(`\ntyp_id=7 sample rows (up to 20 shown, ${industryRows.length} found):`);
  if (industryRows.length === 0) {
    console.log("  none found");
  } else {
    for (const r of industryRows) {
      console.log(`  #${r.id} ${r.mstr_nm} (${r.mstr_cd ?? "no code"}) status=${r.status}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("Diagnostic failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
