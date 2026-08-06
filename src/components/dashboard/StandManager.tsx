"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { UserPlus, Store } from "lucide-react";
import { standProfileSchema, standSpotSchema, type StandProfileInput, type StandSpotInput } from "@/lib/validations/eventStand";
import type { StandProfile, StandSpot } from "@/lib/services/eventStand";

const FIELD_CLASS =
  "w-full rounded-md border border-indigo-950/20 bg-white px-3.5 py-2.5 text-sm text-indigo-950 placeholder:text-indigo-950/40 focus:border-fuchsia-500 focus:outline-none";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-900",
  pending: "bg-amber-50 text-amber-900",
  excluded: "bg-red-50 text-red-900",
};

function ProfileForm({ profile }: { profile: StandProfile }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<StandProfileInput>({
    resolver: zodResolver(standProfileSchema) as any,
    defaultValues: {
      business: profile.business ?? "",
      website: profile.website ?? "",
      about_us: profile.aboutUs ?? "",
      keynote_speech_topic: profile.keynoteSpeechTopic ?? "",
      facebook: profile.facebook ?? "",
      twitter: profile.twitter ?? "",
      instagram: profile.instagram ?? "",
      whatsapp_no: profile.whatsappNo ?? "",
      zoom: profile.zoom ?? "",
      calendly: profile.calendly ?? "",
      youtube: profile.youtube ?? "",
      logo: profile.logo ?? "",
    },
  });

  async function onSubmit(data: StandProfileInput) {
    setStatus("idle");
    try {
      await axios.patch("/api/members/stand", data);
      setStatus("success");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save your stand profile."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Business Name*</label>
        <input {...register("business")} className={FIELD_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Website</label>
        <input {...register("website")} className={FIELD_CLASS} placeholder="https://" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">About Us</label>
        <textarea {...register("about_us")} rows={4} className={FIELD_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Keynote Speech Topic</label>
        <input {...register("keynote_speech_topic")} className={FIELD_CLASS} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Facebook</label>
          <input {...register("facebook")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Twitter</label>
          <input {...register("twitter")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Instagram</label>
          <input {...register("instagram")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">YouTube</label>
          <input {...register("youtube")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">WhatsApp Number</label>
          <input {...register("whatsapp_no")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Zoom</label>
          <input {...register("zoom")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Calendly</label>
          <input {...register("calendly")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Logo URL</label>
          <input {...register("logo")} className={FIELD_CLASS} />
        </div>
      </div>

      {errorMessage && status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
      {status === "success" && <p className="text-sm text-emerald-700">Your stand profile has been updated.</p>}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-fuchsia-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Stand Profile"}
        </button>
      </div>
    </form>
  );
}

function SpotForm({ spot }: { spot: StandSpot }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<StandSpotInput>({
    resolver: zodResolver(standSpotSchema) as any,
    defaultValues: {
      title: spot.title ?? "",
      help_text: spot.helpText ?? "",
      video_url: spot.videoUrl ?? "",
      is_video: spot.isVideo,
      chat_script: spot.chatScript ?? "",
      meeting_id: spot.meetingId ?? "",
      meeting_password: spot.meetingPassword ?? "",
    },
  });

  async function onSubmit(data: StandSpotInput) {
    setStatus("idle");
    try {
      await axios.patch("/api/members/stand/spot", data);
      setStatus("success");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save your virtual booth."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Spot Title</label>
        <input {...register("title")} className={FIELD_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Help Text</label>
        <input {...register("help_text")} className={FIELD_CLASS} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Video URL</label>
        <input {...register("video_url")} className={FIELD_CLASS} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-indigo-950">
        <input type="checkbox" {...register("is_video")} className="h-4 w-4 rounded border-indigo-950/30" />
        Play a video on this spot
      </label>
      <div>
        <label className="mb-1 block text-sm font-semibold text-indigo-950">Live Chat Script</label>
        <input {...register("chat_script")} className={FIELD_CLASS} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Meeting ID</label>
          <input {...register("meeting_id")} className={FIELD_CLASS} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-indigo-950">Meeting Password</label>
          <input {...register("meeting_password")} className={FIELD_CLASS} />
        </div>
      </div>

      {errorMessage && status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
      {status === "success" && <p className="text-sm text-emerald-700">Your virtual booth has been updated.</p>}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-indigo-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-900 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save Virtual Booth"}
        </button>
      </div>
    </form>
  );
}

interface Props {
  profile: StandProfile | null;
  spot: StandSpot | null;
}

export function StandManager({ profile, spot }: Props) {
  if (!profile) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-950/15 bg-white p-10 text-center text-indigo-950/60">
        We couldn&apos;t find an exhibitor registration linked to your account for this event.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-950/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-fuchsia-50 p-2.5 text-fuchsia-600">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-indigo-950">{profile.business || "Your Stand"}</p>
            <p className="text-sm text-indigo-950/60">
              Stand no. {profile.standNumber || "Not allocated yet"}
              <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[profile.status] || "bg-indigo-950/5 text-indigo-950"}`}>
                {profile.status}
              </span>
            </p>
          </div>
        </div>
        <Link
          href="/members/event_member"
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/5 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-950/10"
        >
          <UserPlus className="h-4 w-4" /> Manage My Team
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-950/10 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950">Stand Profile</h3>
          <div className="mt-4">
            <ProfileForm profile={profile} />
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-950/10 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-indigo-950">Virtual Booth</h3>
          <div className="mt-4">
            {spot ? (
              <SpotForm spot={spot} />
            ) : (
              <p className="text-sm text-indigo-950/60">
                The organiser hasn&apos;t allocated a virtual lobby spot to your booth yet, so there&apos;s nothing to
                configure here just yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
