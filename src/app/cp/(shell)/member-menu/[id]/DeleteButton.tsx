"use client";

export function DeleteMemberMenuButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this member menu item? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-red-400 transition hover:bg-red-500/20"
      >
        Delete
      </button>
    </form>
  );
}
