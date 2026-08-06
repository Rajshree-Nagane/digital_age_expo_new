'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { assetUrl } from '@/lib/assets';
import { speakerSlug } from '@/lib/slug';

interface Speaker {
  id: number;
  name: string;
  position: string | null;
  business: string | null;
  profile_pic: string | null;
}

interface Props {
  speakers: Speaker[];
  eyebrow?: string;
  speakerTypeTitle?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar with graceful fallback: missing src, blank src, AND a failed load all land on initials. */
function SpeakerAvatar({ speaker }: { speaker: Speaker }) {
  const [errored, setErrored] = useState(false);
  const hasSrc = Boolean(speaker.profile_pic && speaker.profile_pic.trim());
  const src = hasSrc ? assetUrl(speaker.profile_pic) : null;
  const showImage = Boolean(src) && !errored;

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 transition-all duration-300 group-hover:ring-brand-pink/50">
     
        <div className="flex h-full w-full items-center justify-center bg-surface-2">
          <span className="bg-gradient-to-br from-brand-pink to-fuchsia-400 bg-clip-text text-2xl font-black tracking-wide text-transparent">
            {getInitials(speaker.name)}
          </span>
        </div>
     
    </div>
  );
}

export function SpeakersGrid({ speakers, eyebrow, speakerTypeTitle = 'Event' }: Props) {
  const displayEyebrow = eyebrow || 'Your story. Your vision. Our stage.';

  return (
    <section className="mx-auto max-w-6xl space-y-12 px-6 py-20">
      <div className="space-y-4 text-center">
        <span className="block font-mono text-xs font-bold uppercase tracking-widest text-fuchsia-400">
          {displayEyebrow}
        </span>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
          {speakerTypeTitle} Speakers
        </h2>
      </div>

      {speakers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((speaker, index) => (
            <Link
              href={`/speaker/${speakerSlug(speaker.name, speaker.id)}`}
              key={speaker.id}
              id={`featured-speaker-${speaker.id}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group flex flex-col items-center gap-3 rounded-2xl glass-panel px-4 py-6 text-center transition-all duration-300 animate-fade-in hover:border-brand-pink/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-pink/10"
            >
              <SpeakerAvatar speaker={speaker} />

              <div className="flex flex-1 flex-col items-center gap-1">
                <h4 className="line-clamp-1 text-sm font-extrabold uppercase tracking-wider text-white transition-colors group-hover:text-fuchsia-300">
                  {speaker.name}
                </h4>
                <p className="line-clamp-2 font-mono text-[11px] leading-snug tracking-wide text-slate-400">
                  {speaker.position}
                  {speaker.position && speaker.business ? ' • ' : ''}
                  {speaker.business}
                </p>
              </div>

              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-pink opacity-0 transition-all duration-300 group-hover:opacity-100">
                View Profile
                <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-surface-1/40 p-12 text-center glass-panel">
          <p className="font-medium text-zinc-400">
            Be the first one to register for {speakerTypeTitle} Speaker
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/view_speaker"
          className="btn-brand-gradient rounded-full px-8 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
        >
          View All Speakers
        </Link>
        <Link
          href="/speaker_registration"
          className="btn-outline-animated rounded-full bg-slate-900 px-8 py-3.5 font-bold text-white shadow-md transition-all duration-300 hover:bg-slate-800 hover:scale-105 active:scale-95"
        >
          Enroll as {speakerTypeTitle} Speaker
        </Link>
      </div>
    </section>
  );
}