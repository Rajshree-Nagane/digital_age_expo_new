import Link from "next/link";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { listEmailTemplates, ensureDefaultTemplates } from "@/lib/cp/email/emailTemplatesRepository";
import { Pagination } from "../../_components/Pagination";

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireCpPermission(CP_PERMISSIONS.EMAIL_TEMPLATES_VIEW);

  // Idempotent — only inserts whichever of the 10 named templates from the spec don't
  // already exist as find_email_templates rows (e.g. on a fresh database).
  await ensureDefaultTemplates();

  const { page } = await searchParams;
  const currentPage = page ? Number(page) : 1;
  const { templates, total, pageSize } = await listEmailTemplates({ page: currentPage });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">Email Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {total} template(s) — find_email_templates. recipients/from/reply/subject/body per template.
          Test-send and version history aren&apos;t built yet (see src/app/cp/README.md).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Template</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {templates.map((t) => (
              <tr key={t.id} className="text-zinc-300">
                <td className="px-4 py-3 font-bold text-white">{t.id}</td>
                <td className="px-4 py-3 text-zinc-500">{t.subject || <span className="text-zinc-700">— not set —</span>}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      t.disable
                        ? "rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-zinc-500"
                        : "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400"
                    }
                  >
                    {t.disable ? "Disabled" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/cp/email-templates/${t.id}`} className="text-xs font-bold text-zinc-400 hover:text-white">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  No templates on this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cp/email-templates" />
    </div>
  );
}
