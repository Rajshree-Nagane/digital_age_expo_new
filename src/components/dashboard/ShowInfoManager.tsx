"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { Pencil } from "lucide-react";
import { showInfoSchema, type ShowInfoInput } from "@/lib/validations/eventShowInfo";
import type { ShowInfo } from "@/lib/services/eventShowInfo";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors backdrop-blur-md";

interface Props {
  showInfo: ShowInfo | null;
  canManage: boolean;
  startInEditMode: boolean;
}

export function ShowInfoManager({ showInfo, canManage, startInEditMode }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(startInEditMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ShowInfoInput>({
    resolver: zodResolver(showInfoSchema) as any,
    defaultValues: {
      description: showInfo?.description ?? "",
      is_publish: showInfo?.isPublish ?? false,
    },
  });

  async function onSubmit(data: ShowInfoInput) {
    setErrorMessage(null);
    try {
      await axios.put("/api/members/show-info", data);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save Show Info. Please try again."
      );
    }
  }

  if (canManage && editing) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 glass-panel rounded-3xl p-8 border-white/10 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-300">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Information Content*</label>
          <textarea 
            {...register("description")} 
            rows={12} 
            className={FIELD_CLASS} 
            placeholder="Describe the event details... (HTML is supported for advanced formatting)" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center h-5">
            <input 
              type="checkbox" 
              {...register("is_publish")} 
              className="h-5 w-5 rounded-lg border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink transition-all" 
            />
          </div>
          <label className="text-sm font-bold text-zinc-300 select-none">
            Publish and show to all Exhibitors
          </label>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4 border-t border-white/5 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brand-pink px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Save Information"}
          </button>
          {showInfo?.id && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-black uppercase tracking-widest text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-8 border-white/10 shadow-2xl backdrop-blur-md space-y-6 relative group">
      {canManage && (
        <div className="absolute top-8 right-8">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white transition-all shadow-xl"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Info
          </button>
        </div>
      )}

      {showInfo?.description ? (
        <div
          className="prose prose-invert prose-pink max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-brand-pink"
          dangerouslySetInnerHTML={{ __html: showInfo.description }}
        />
      ) : (
        <div className="py-12 text-center">
          <p className="text-zinc-500 font-medium italic">
            {canManage
              ? "No show information has been published yet. Click Edit to create your first update."
              : "The organiser has not published any specific show information yet. Please check back later."}
          </p>
        </div>
      )}
    </div>
  );
}
