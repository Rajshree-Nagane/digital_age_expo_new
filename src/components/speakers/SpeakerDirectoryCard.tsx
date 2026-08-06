import Link from "next/link";
import { MessageCircle, AtSign, Camera, Video, Briefcase, CalendarClock, Link2, type LucideIcon } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { speakerSlug } from "@/lib/slug";
import { SpeakerAvatar } from "@/components/speakers/SpeakerAvatar";

export interface DirectorySpeaker {
  id: number;
  name: string;
  position: string | null;
  business: string | null;
  title: string | null;
  profile_pic: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  linkedin_user_profile: string | null;
  calendy_url: string | null;
  visitorCount: number;
}

// lucide-react 1.x dropped every trademarked brand icon (Facebook/Twitter/Instagram/Youtube/
// Linkedin all no longer exist as exports — see the "Export Facebook doesn't exist" build
// error) — these are its closest generic stand-ins per platform, not literal brand marks.
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: MessageCircle,
  twitter: AtSign,
  instagram: Camera,
  youtube: Video,
  linkedin: Briefcase,
  calendly: CalendarClock,
};
const FALLBACK_SOCIAL_ICON: LucideIcon = Link2;

const SOCIALS = (s: DirectorySpeaker) =>
  [
    { key: "facebook", href: s.facebook_url, label: "Facebook" },
    { key: "twitter", href: s.twitter_url, label: "Twitter" },
    { key: "instagram", href: s.instagram_url, label: "Instagram" },
    { key: "youtube", href: s.youtube_url, label: "YouTube" },
    { key: "linkedin", href: s.linkedin_user_profile, label: "LinkedIn" },
    { key: "calendly", href: s.calendy_url, label: "Calendly" },
  ].filter((social): social is { key: string; href: string; label: string } => !!social.href);

/**
 * Shared by CurrentSpeakersSection (bg-zinc-950) and PreviousSpeakersSection (also now
 * bg-zinc-950 — see that file) on /view_speaker. Previously a bare, unstyled div (no bg, no
 * radius, near-black indigo-950 text) meant to sit on a light page; now a proper dark card —
 * glass-style border/bg, hover lift + brand-pink glow, real social icons instead of 2-letter
 * text abbreviations ("Fa", "Tw", ...).
 */
export function SpeakerDirectoryCard({ speaker }: { speaker: DirectorySpeaker }) {
  const href = `/speaker/${speakerSlug(speaker.name, speaker.id)}`;
  const socials = SOCIALS(speaker);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-brand-pink/40 hover:shadow-2xl hover:shadow-brand-pink/10">
      <Link href={href} className="block">
        <SpeakerAvatar src={assetUrl(speaker.profile_pic)} name={speaker.name} className="h-64 w-full" />
        <div className="min-h-[10rem] px-4 py-5 text-center">
          <h3 className="font-black uppercase tracking-tight text-white capitalize transition-colors group-hover:text-brand-pink">
            {speaker.name.toLowerCase()}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-zinc-400">
            {speaker.position}
            {speaker.position && speaker.business ? " , " : ""}
            {speaker.business}
          </p>
          {speaker.title && <p className="mt-1 text-xs text-zinc-500">{speaker.title}</p>}
        </div>
      </Link>

      {socials.length > 0 && (
        <div className="flex justify-center gap-2 border-t border-white/5 pb-4 pt-4">
          {socials.map((social) => {
            const Icon = SOCIAL_ICONS[social.key] ?? FALLBACK_SOCIAL_ICON;
            return (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                title={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition hover:border-brand-pink/40 hover:bg-brand-pink/10 hover:text-brand-pink"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            );
          })}
        </div>
      )}

      <div className="px-4 pb-5 text-center">
        {speaker.visitorCount > 0 && (
          <p className="mb-2 text-xs font-bold text-brand-pink">
            {speaker.visitorCount} visitor{speaker.visitorCount === 1 ? "" : "'s"} registered
          </p>
        )}
        <Link
          href={`/free-ticket?speaker_id=${speaker.id}`}
          className="inline-block rounded-full bg-brand-pink px-5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-brand-pink/20 transition hover:scale-105 hover:opacity-90"
        >
          Get A Free Ticket
        </Link>
      </div>
    </div>
  );
}
