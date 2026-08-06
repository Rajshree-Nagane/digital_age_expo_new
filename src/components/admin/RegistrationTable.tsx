"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface RegistrationRow {
  id: number;
  name: string | null;
  business: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  joiningStatus: string | null;
  date: Date | string | null;
}

interface StatusAction {
  value: string;
  label: string;
  tone: "approve" | "reject" | "pending";
}

const TONE_CLASS: Record<StatusAction["tone"], string> = {
  approve: "bg-emerald-600 hover:bg-emerald-500",
  reject: "bg-red-600 hover:bg-red-500",
  pending: "bg-amber-500 hover:bg-amber-400",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-900",
  approved: "bg-emerald-50 text-emerald-900",
  pending: "bg-amber-50 text-amber-900",
  excluded: "bg-red-50 text-red-900",
  unapproved: "bg-red-50 text-red-900",
  reject: "bg-red-50 text-red-900",
};

interface RegistrationTableProps<T extends RegistrationRow> {
  rows: T[];
  apiBasePath: string;
  statusActions: StatusAction[];
  extraColumn?: { label: string; render: (row: T) => React.ReactNode };
}

export function RegistrationTable<T extends RegistrationRow>({
  rows,
  apiBasePath,
  statusActions,
  extraColumn,
}: RegistrationTableProps<T>) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = filter === "all" ? rows : rows.filter((row) => row.status === filter);

  async function setStatus(id: number, status: string) {
    setPendingId(id);
    setErrorMessage(null);
    try {
      await axios.patch(`${apiBasePath}/${id}`, { status });
      router.refresh();
    } catch {
      setErrorMessage("Could not update status. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this registration? This cannot be undone.")) return;
    setPendingId(id);
    setErrorMessage(null);
    try {
      await axios.delete(`${apiBasePath}/${id}`);
      router.refresh();
    } catch {
      setErrorMessage("Could not delete this registration. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            filter === "all" ? "bg-indigo-950 text-white" : "bg-indigo-950/5 text-indigo-950/70"
          }`}
        >
          All ({rows.length})
        </button>
        {statusActions.map((action) => (
          <button
            key={action.value}
            onClick={() => setFilter(action.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              filter === action.value ? "bg-indigo-950 text-white" : "bg-indigo-950/5 text-indigo-950/70"
            }`}
          >
            {action.label} ({rows.filter((row) => row.status === action.value).length})
          </button>
        ))}
      </div>

      {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-indigo-950/10">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-indigo-950/5 text-indigo-950/70">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              {extraColumn && <th className="px-4 py-3 font-semibold">{extraColumn.label}</th>}
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-indigo-950/50">
                  No registrations in this view.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-indigo-950/10">
                <td className="px-4 py-3 font-medium text-indigo-950">{row.name || "—"}</td>
                <td className="px-4 py-3 text-indigo-950/80">{row.business || "—"}</td>
                <td className="px-4 py-3 text-indigo-950/80">
                  <div>{row.email || "—"}</div>
                  <div className="text-indigo-950/50">{row.phone || ""}</div>
                </td>
                {extraColumn && <td className="px-4 py-3 text-indigo-950/80">{extraColumn.render(row)}</td>}
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      (row.status && STATUS_BADGE[row.status]) || "bg-indigo-950/5 text-indigo-950"
                    }`}
                  >
                    {row.status || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {statusActions
                      .filter((action) => action.value !== row.status)
                      .map((action) => (
                        <button
                          key={action.value}
                          disabled={pendingId === row.id}
                          onClick={() => setStatus(row.id, action.value)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 ${TONE_CLASS[action.tone]}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    <button
                      disabled={pendingId === row.id}
                      onClick={() => remove(row.id)}
                      className="rounded-md bg-indigo-950/10 px-3 py-1.5 text-xs font-semibold text-indigo-950 transition hover:bg-indigo-950/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
