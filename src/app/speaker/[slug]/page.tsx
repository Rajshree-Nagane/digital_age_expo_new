import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSpeakerById } from "@/lib/services/speakers";
import { getSpeakerScheduleSlots } from "@/lib/services/schedule";
import { idFromSlug, speakerSlug } from "@/lib/slug";
import { SpeakerProfileHeader } from "@/components/speakers/SpeakerProfileHeader";
import { SpeakerVideos } from "@/components/speakers/SpeakerVideos";
import { ScheduleDaySection } from "@/components/schedule/ScheduleDaySection";

interface Props {
  params: Promise<{ slug: string }>;
}

const SOCIAL_LINKS = (speaker: NonNullable<Awaited<ReturnType<typeof getSpeakerById>>>) =>
  [
    { key: "linkedin", href: speaker.linkedin_user_profile, label: "LinkedIn" },
    { key: "facebook", href: speaker.facebook_url, label: "Facebook" },
    { key: "twitter", href: speaker.twitter_url, label: "Twitter" },
    { key: "instagram", href: speaker.instagram_url, label: "Instagram" },
    { key: "youtube", href: speaker.youtube_url, label: "YouTube" },
    { key: "calendly", href: speaker.calendy_url, label: "Calendly" },
  ].filter((link): link is { key: string; href: string; label: string } => !!link.href);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const speaker = id ? await getSpeakerById(id) : null;
  if (!speaker) return { title: "Speaker" };
  return { title: `${speaker.name} - Speaker` };
}

export default async function SpeakerDetailPage({ params }: Props) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  if (!id) notFound();

  const speaker = await getSpeakerById(id);
  if (!speaker) notFound();

  const canonicalSlug = speakerSlug(speaker.name, speaker.id);
  if (slug !== canonicalSlug) {
    redirect(`/speaker/${canonicalSlug}`);
  }

  const positionBusiness = [speaker.position, speaker.business].filter(Boolean).join(", ");
  const socials = SOCIAL_LINKS(speaker);
  const scheduleDays = speaker.event_id ? await getSpeakerScheduleSlots(speaker.id, speaker.event_id) : [];

  return (
    <>
      <SpeakerProfileHeader
        name={speaker.name}
        positionBusiness={positionBusiness}
        profilePic={speaker.profile_pic}
        linkedinUrl={speaker.linkedin_user_profile}
      />

    <div className="mx-auto max-w-6xl px-6 py-16">

  {/* Status */}
  {speaker.status !== "active" && (
    <div className="glass-panel mb-10 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-5">
      <p className="font-semibold text-yellow-300">
        ⚠️ This speaker profile is currently not activated.
      </p>
    </div>
  )}

  {/* About Speaker */}
  {speaker.description && (
    <div className="glass-panel hover-tilt-3d rounded-3xl p-8 lg:p-10">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-12 w-1 rounded-full bg-gradient-to-b from-brand-purple to-brand-pink" />

        <div>
          <h2 className="font-display text-3xl font-black sophisticated-gradient-text">
            About Speaker
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Learn more about our featured speaker.
          </p>
        </div>
      </div>

      <p className="whitespace-pre-line text-lg leading-9 text-zinc-300">
        {speaker.description}
      </p>
    </div>
  )}

  {/* Social Profiles */}
  {socials.length > 0 && (
    <div className="glass-panel mt-10 rounded-3xl p-8">
      <h2 className="font-display text-3xl font-black sophisticated-gradient-text">
        Connect With Speaker
      </h2>

      <p className="mt-2 text-zinc-400">
        Follow on social media and stay connected.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        {socials.map((social) => (
          <a
            key={social.key}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            title={social.label}
            className="btn-brand-gradient flex min-w-[140px] items-center justify-center rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-300 hover:-translate-y-1"
          >
            {social.label}
          </a>
        ))}
      </div>
    </div>
  )}
</div>

{/* Schedule */}
{scheduleDays.length > 0 && (
  <section className="main-glow-bg py-20">

    <div className="mx-auto max-w-6xl px-6">

      <div className="mb-14 text-center">
        <h2 className="font-display text-5xl font-black sophisticated-gradient-text animate-text-glow">
          Speaking Schedule
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Explore all sessions, keynotes, and presentations by this speaker.
        </p>
      </div>

      <div className="space-y-8">
        {scheduleDays.map((day) => (
          <div
            key={day.date}
            className="glass-panel hover-tilt-3d rounded-3xl p-6"
          >
            <ScheduleDaySection day={day} />
          </div>
        ))}
      </div>

    </div>

  </section>
)}
      <SpeakerVideos title="Speakeer Video" urls={speaker.event_youtube_url} />
      <SpeakerVideos title="Past Speaker Video" urls={speaker.past_event_youtube_urls} />
    </>
  );
}
