"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Pencil, Trash2, MessageCircle, BadgeCheck, Search } from "lucide-react";
import { TeamMemberFormModal } from "@/components/dashboard/TeamMemberFormModal";
import type { TeamMemberRow } from "@/lib/services/eventTeamMembers";
import { TablePagination } from "@/components/dashboard/TablePagination";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-900",
  Registered: "bg-emerald-50 text-emerald-900",
};

interface Props {
  members: TeamMemberRow[];
}

export function TeamMembersManager({ members }: Props) {
  const router = useRouter();
  const [modalMember, setModalMember] = useState<TeamMemberRow | "new" | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const filteredMembers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.firstName, m.lastName, m.email, m.business, m.position, m.status]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [members, keyword]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  const paged = useMemo(
    () => filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMembers, page]
  );

  async function remove(id: number) {
    if (!window.confirm("Remove this team member? This cannot be undone.")) return;
    setPendingId(id);
    setErrorMessage(null);
    try {
      await axios.delete(`/api/members/team-members/${id}`);
      router.refresh();
    } catch {
      setErrorMessage("Could not remove this team member. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handleSaved() {
    setModalMember(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p className="text-sm font-medium text-zinc-400 max-w-xl">
          People who help you run your stand or session — added here can be given event access and chat.
        </p>
        <button
          onClick={() => setModalMember("new")}
          className="btn-brand-gradient inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-2xl transition hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-bold">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-xl backdrop-blur-md">
        <Search className="h-5 w-5 shrink-0 text-brand-pink" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search members by name, email, business or status…"
          className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none font-medium"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-white/10">
              <tr>
                <th className="px-6 py-5">Name</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5">Position</th>
                <th className="px-6 py-5">Business</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Account</th>
                <th className="px-6 py-5 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-zinc-500 italic font-medium">
                    {members.length === 0
                      ? "No team members yet — add the people who'll help staff your stand or session."
                      : "No team members match your search."}
                  </td>
                </tr>
              )}
              {paged.map((member) => (
                <tr key={member.id} className="align-top hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-black text-white tracking-tight">
                      {member.firstName} {member.lastName}
                      {member.isContact && <BadgeCheck className="h-4 w-4 text-brand-pink" aria-label="Event contact" />}
                      {member.enableChat && <MessageCircle className="h-4 w-4 text-brand-purple" aria-label="Chat enabled" />}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-zinc-400 font-medium">
                    <div className="text-zinc-200">{member.email}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1">{member.workPhone}</div>
                  </td>
                  <td className="px-6 py-5 text-zinc-300 font-bold text-xs uppercase tracking-wide">{member.position}</td>
                  <td className="px-6 py-5 text-zinc-300 font-medium">{member.business || "—"}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                      member.status === 'Registered' 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {member.status || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-zinc-400 text-xs font-bold">{member.joiningStatus || "—"}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModalMember(member)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:bg-white/10 hover:text-white transition shadow-xl"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        disabled={pendingId === member.id}
                        onClick={() => remove(member.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition shadow-xl disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={page}
          totalItems={filteredMembers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          className="px-6 pb-5"
        />
      </div>

      {modalMember && (
        <TeamMemberFormModal
          defaultValues={
            modalMember === "new"
              ? undefined
              : {
                  id: modalMember.id,
                  first_name: modalMember.firstName,
                  last_name: modalMember.lastName,
                  email: modalMember.email,
                  phone: modalMember.phone ?? "",
                  work_phone: modalMember.workPhone,
                  position: modalMember.position,
                  status: (modalMember.status as "Pending" | "Registered") ?? "Pending",
                  linkedin_user_profile: modalMember.linkedinUserProfile ?? "",
                  description: modalMember.description ?? "",
                  is_contact: modalMember.isContact,
                  enable_chat: modalMember.enableChat,
                }
          }
          onClose={() => setModalMember(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
