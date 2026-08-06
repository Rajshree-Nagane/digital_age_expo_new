"use client";

import { useState, use } from "react";
import { Plus, Search, CheckCircle2, Settings, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Item {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
}

export default function MemberToolPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const label = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: 1, title: `${label} Main Configuration`, status: "Active", updatedAt: "2026-07-28" },
    { id: 2, title: `Default ${label} Template`, status: "Published", updatedAt: "2026-07-27" },
    { id: 3, title: `Partner Integration Feed`, status: "Syncing", updatedAt: "2026-07-25" },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const filteredItems = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setItems([
      { id: Date.now(), title: newTitle.trim(), status: "Active", updatedAt: new Date().toISOString().split("T")[0] },
      ...items,
    ]);
    setNewTitle("");
    setSuccessMsg(`Successfully created new entry for ${label}!`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(i => i.id !== id));
    setSuccessMsg("Item deleted successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-purple/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-pink/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-pink">
              Event Management Module
            </span>
            <span className="text-xs text-black/50">/members/{slug}</span>
          </div>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-brand-purple">{label}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSuccessMsg("Settings refreshed successfully.")}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-purple/20 bg-white px-4 py-2 text-xs font-bold uppercase text-brand-purple shadow-xs hover:bg-brand-pink/5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Module
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Control bar */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-brand-purple/15 bg-white p-3 shadow-sm">
          <Search className="h-4 w-4 text-brand-purple/50 ml-2 shrink-0" />
          <input
            type="text"
            placeholder={`Search ${label} items...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-black placeholder:text-black/45 focus:outline-hidden"
          />
        </div>

        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            placeholder="New entry title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded-2xl border border-brand-purple/15 bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-black/45 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-brand-purple/20"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-brand-purple px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-black transition shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-brand-purple/15 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-brand-purple/15 bg-slate-50/70 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-brand-purple">
            Active Records ({filteredItems.length})
          </h3>
          <span className="text-xs font-bold text-black/50">Real-time synchronized</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-black/50">
            <p className="text-sm font-medium">No records found matching your query.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-purple/10">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 hover:bg-brand-pink/5 transition">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-black">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-black/60 font-medium">
                    <span>Updated: {item.updatedAt}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-brand-pink font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`Editing record #${item.id}: ${item.title}`)}
                    className="rounded-xl border border-brand-purple/20 bg-white px-3 py-1.5 text-xs font-bold uppercase text-brand-purple hover:bg-black hover:text-white transition shadow-xs"
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold uppercase text-rose-700 hover:bg-rose-100 transition shadow-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

