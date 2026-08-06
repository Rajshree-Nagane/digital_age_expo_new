"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { isAxiosError } from "axios";
import { eventDetailsSchema, type EventDetailsInput } from "@/lib/validations/eventDetails";
import type { EventDetails } from "@/lib/services/eventDetails";

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none transition-colors backdrop-blur-md";

const LABEL_CLASS = "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6 border-t border-white/5 pt-8 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-pink">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

interface Props {
  eventId: number;
  details: EventDetails;
}

export function EventDetailsManager({ eventId, details }: Props) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EventDetailsInput>({
    resolver: zodResolver(eventDetailsSchema) as any,
    defaultValues: {
      title: details.title,
      date_start: details.date_start,
      date_end: details.date_end,
      venue: details.venue,
      location: details.location,
      website: details.website,
      email: details.email,
      phone: details.phone,
      contact_name: details.contact_name,
      contact_address: details.contact_address,
      description_short: details.description_short,
      description: details.description,
      category_description: details.category_description,
      friendly_url: details.friendly_url,
      meta_title: details.meta_title,
      meta_keywords: details.meta_keywords,
      meta_description: details.meta_description,
      keywords: details.keywords,
      facebook_url: details.facebook_url,
      facebook_group_url: details.facebook_group_url,
      twitter_url: details.twitter_url,
      linkedin_url: details.linkedin_url,
      linkedin_group_url: details.linkedin_group_url,
      instagram_url: details.instagram_url,
      youtube_channel_url: details.youtube_channel_url,
      zoom_url: details.zoom_url,
      hide_home: details.hide_home,
      hide_exhibitor: details.hide_exhibitor,
      hide_sponsor: details.hide_sponsor,
      hide_speaker: details.hide_speaker,
      hide_visitor: details.hide_visitor,
      hide_speaker_home: details.hide_speaker_home,
      hide_eventimage: details.hide_eventimage,
      hide_eventvideo: details.hide_eventvideo,
      expected_no_of_exhibitor: details.expected_no_of_exhibitor ?? undefined,
      expected_no_of_exhibitor_display_text: details.expected_no_of_exhibitor_display_text,
      expected_no_of_investor: details.expected_no_of_investor ?? undefined,
      expected_no_of_investor_display_text: details.expected_no_of_investor_display_text,
      expected_no_of_workshop_panel: details.expected_no_of_workshop_panel ?? undefined,
      expected_no_of_workshop_panel_display_text: details.expected_no_of_workshop_panel_display_text,
      expected_no_of_countries: details.expected_no_of_countries ?? undefined,
      expected_no_of_countries_display_text: details.expected_no_of_countries_display_text,
    },
  });

  async function onSubmit(data: EventDetailsInput) {
    setErrorMessage(null);
    setSaved(false);
    try {
      await axios.put(`/api/members/event-details?event_id=${eventId}`, data);
      setSaved(true);
      // Mirrors the legacy `froms=event` redirect back to the event summary page after saving.
      router.push(`/members/user_event_summary?event_id=${eventId}`);
    } catch (err) {
      setErrorMessage(
        isAxiosError(err) && err.response?.data?.error
          ? typeof err.response.data.error === "string"
            ? err.response.data.error
            : "Please fix the highlighted fields and try again."
          : "Could not save event details. Please try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 glass-panel rounded-3xl p-8 border-white/10 shadow-2xl backdrop-blur-md">
      <Section title="Core Details">
        <Field label="Title *" full>
          <input {...register("title")} className={FIELD_CLASS} />
        </Field>
        <Field label="Start Date *">
          <input type="date" {...register("date_start")} className={FIELD_CLASS} />
        </Field>
        <Field label="End Date">
          <input type="date" {...register("date_end")} className={FIELD_CLASS} />
        </Field>
        <Field label="Venue">
          <input {...register("venue")} className={FIELD_CLASS} />
        </Field>
        <Field label="Location">
          <input {...register("location")} className={FIELD_CLASS} />
        </Field>
        <Field label="Website">
          <input {...register("website")} className={FIELD_CLASS} placeholder="https://" />
        </Field>
        <Field label="Email">
          <input type="email" {...register("email")} className={FIELD_CLASS} />
        </Field>
        <Field label="Phone">
          <input {...register("phone")} className={FIELD_CLASS} />
        </Field>
        <Field label="Contact Name">
          <input {...register("contact_name")} className={FIELD_CLASS} />
        </Field>
        <Field label="Contact Address" full>
          <input {...register("contact_address")} className={FIELD_CLASS} />
        </Field>
      </Section>

      <Section title="Descriptions">
        <Field label="Short Description" full>
          <textarea rows={3} {...register("description_short")} className={FIELD_CLASS} />
        </Field>
        <Field label="Full Description" full>
          <textarea rows={8} {...register("description")} className={FIELD_CLASS} />
        </Field>
        <Field label="Category Description" full>
          <textarea rows={3} {...register("category_description")} className={FIELD_CLASS} />
        </Field>
        <p className="sm:col-span-2 text-xs text-zinc-500 italic">
          Event image and location image uploads aren&apos;t wired up yet in this form &mdash; ask if you&apos;d like that added next.
        </p>
      </Section>

      <Section title="SEO & Social Links">
        <Field label="Friendly URL (slug)">
          <input {...register("friendly_url")} className={FIELD_CLASS} placeholder="digital-age-expo" />
        </Field>
        <Field label="Keywords">
          <input {...register("keywords")} className={FIELD_CLASS} />
        </Field>
        <Field label="Meta Title">
          <input {...register("meta_title")} className={FIELD_CLASS} />
        </Field>
        <Field label="Meta Keywords">
          <input {...register("meta_keywords")} className={FIELD_CLASS} />
        </Field>
        <Field label="Meta Description" full>
          <textarea rows={2} {...register("meta_description")} className={FIELD_CLASS} />
        </Field>
        <Field label="Facebook URL">
          <input {...register("facebook_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="Facebook Group URL">
          <input {...register("facebook_group_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="Twitter / X URL">
          <input {...register("twitter_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="LinkedIn URL">
          <input {...register("linkedin_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="LinkedIn Group URL">
          <input {...register("linkedin_group_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="Instagram URL">
          <input {...register("instagram_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="YouTube Channel URL">
          <input {...register("youtube_channel_url")} className={FIELD_CLASS} />
        </Field>
        <Field label="Zoom URL">
          <input {...register("zoom_url")} className={FIELD_CLASS} />
        </Field>
      </Section>

      <Section title="Visibility Toggles">
        {([
          ["hide_home", "Hide Home Section"],
          ["hide_exhibitor", "Hide Exhibitor Section"],
          ["hide_sponsor", "Hide Sponsor Section"],
          ["hide_speaker", "Hide Speaker Section"],
          ["hide_visitor", "Hide Visitor Section"],
          ["hide_speaker_home", "Hide Speakers on Homepage"],
          ["hide_eventimage", "Hide Event Image"],
          ["hide_eventvideo", "Hide Event Video"],
        ] as const).map(([name, label]) => (
          <label key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
            <input type="checkbox" {...register(name)} className="h-5 w-5 rounded-lg border-white/10 bg-white/5 text-brand-pink focus:ring-brand-pink" />
            <span className="text-sm font-bold text-zinc-300 select-none">{label}</span>
          </label>
        ))}
      </Section>

      <Section title="Expected Stats (shown on marketing pages)">
        <Field label="Expected Exhibitors">
          <input type="number" {...register("expected_no_of_exhibitor")} className={FIELD_CLASS} />
        </Field>
        <Field label="Exhibitors Display Text">
          <input {...register("expected_no_of_exhibitor_display_text")} className={FIELD_CLASS} placeholder="e.g. 50+" />
        </Field>
        <Field label="Expected Investors">
          <input type="number" {...register("expected_no_of_investor")} className={FIELD_CLASS} />
        </Field>
        <Field label="Investors Display Text">
          <input {...register("expected_no_of_investor_display_text")} className={FIELD_CLASS} />
        </Field>
        <Field label="Expected Workshops/Panels">
          <input type="number" {...register("expected_no_of_workshop_panel")} className={FIELD_CLASS} />
        </Field>
        <Field label="Workshops Display Text">
          <input {...register("expected_no_of_workshop_panel_display_text")} className={FIELD_CLASS} />
        </Field>
        <Field label="Expected Countries">
          <input type="number" {...register("expected_no_of_countries")} className={FIELD_CLASS} />
        </Field>
        <Field label="Countries Display Text">
          <input {...register("expected_no_of_countries_display_text")} className={FIELD_CLASS} />
        </Field>
      </Section>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
          {errorMessage}
        </div>
      )}
      {saved && !errorMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          Event details saved.
        </div>
      )}

      <div className="flex gap-4 border-t border-white/5 pt-6 sticky bottom-0 bg-zinc-950/80 backdrop-blur-md -mx-8 -mb-8 px-8 py-6 rounded-b-3xl">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-pink px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand-pink/20 transition hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Event Details"}
        </button>
      </div>
    </form>
  );
}
