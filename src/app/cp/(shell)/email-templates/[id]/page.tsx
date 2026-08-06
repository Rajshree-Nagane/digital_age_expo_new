import { notFound } from "next/navigation";
import { requireCpPermission, CP_PERMISSIONS } from "@/lib/cp/rbac";
import { getEmailTemplate } from "@/lib/cp/email/emailTemplatesRepository";
import { updateEmailTemplateAction, duplicateEmailTemplateAction } from "../actions";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors";
const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCpPermission(CP_PERMISSIONS.EMAIL_TEMPLATES_VIEW);
  const canEdit = session.perms.includes(CP_PERMISSIONS.EMAIL_TEMPLATES_EDIT);
  const { id } = await params;

  const template = await getEmailTemplate(id);
  if (!template) notFound();

  const updateWithId = updateEmailTemplateAction.bind(null, id);
  const duplicateWithId = duplicateEmailTemplateAction.bind(null, id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">{template.id}</h1>
        <p className="mt-1 text-sm text-zinc-500">find_email_templates.id={template.id}</p>
      </div>

      <form action={updateWithId} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>From Name</label>
            <input name="from_name" defaultValue={template.from_name ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>From Address</label>
            <input name="from_address" defaultValue={template.from_address ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Reply-To Name</label>
            <input name="reply_name" defaultValue={template.reply_name ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Reply-To Address</label>
            <input name="reply_address" defaultValue={template.reply_address ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
          </div>
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Recipients (comma-separated, or a placeholder like {"{{user_email}}"})</label>
          <input name="recipients" defaultValue={template.recipients ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
        </div>

        <div className="space-y-2">
          <label className={LABEL_CLASS}>Subject</label>
          <input name="subject" defaultValue={template.subject ?? ""} disabled={!canEdit} className={FIELD_CLASS} />
        </div>
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Body (HTML — variables like {"{{first_name}}"} are just plain text here; nothing renders them yet, see README)</label>
          <textarea name="body_html" defaultValue={template.body_html ?? ""} disabled={!canEdit} rows={10} className={`${FIELD_CLASS} font-mono text-xs`} />
        </div>

        <div className="flex gap-6 text-sm text-zinc-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="disable" defaultChecked={!!template.disable} disabled={!canEdit} className="rounded border-white/20 bg-transparent" />
            Disabled (this template never sends)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="moderate" defaultChecked={!!template.moderate} disabled={!canEdit} className="rounded border-white/20 bg-transparent" />
            Requires moderation before sending
          </label>
        </div>

        {canEdit && (
          <div className="flex justify-end border-t border-white/5 pt-6">
            <button
              type="submit"
              className="rounded-full bg-brand-pink px-10 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-[1.02] active:scale-95"
            >
              Save
            </button>
          </div>
        )}
      </form>

      {canEdit && (
        <form action={duplicateWithId} className="flex gap-3 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <input name="newId" placeholder="new_template_id" required className={FIELD_CLASS} />
          <button
            type="submit"
            className="whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Duplicate As...
          </button>
        </form>
      )}
    </div>
  );
}
