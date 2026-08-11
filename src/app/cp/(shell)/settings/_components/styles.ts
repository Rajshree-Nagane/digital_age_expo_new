/**
 * Shared Tailwind class strings for every Settings sub-page — pulled out of the original
 * general/company/branding/social/theme pages (which each declared their own identical
 * copies of these three constants) so the 10 settings pages stay visually consistent and a
 * design tweak only has to happen once.
 */
export const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors disabled:opacity-50";
export const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";
export const HINT_CLASS = "text-xs text-zinc-600";
export const SECTION_TITLE_CLASS = "text-xs font-black uppercase tracking-[0.25em] text-brand-pink";
export const CHECKBOX_ROW_CLASS = "flex items-center gap-3";
export const CHECKBOX_CLASS = "h-4 w-4 rounded border-white/20 bg-white/5 disabled:opacity-50";
