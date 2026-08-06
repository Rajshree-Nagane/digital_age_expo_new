"use client";

import { useState } from "react";
import { User } from "lucide-react";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Renders a speaker's profile photo, falling back to their initials (or a generic user icon if
 * the name is blank) whenever there's no photo on file or the stored image URL fails to load —
 * instead of a broken-image icon.
 *
 * Colors here match the site's actual dark theme (bg-zinc-950 / text-white, set globally in
 * app/layout.tsx) — this used to be near-black text (text-indigo-950/25) on a near-white
 * placeholder (bg-indigo-950/5), which is effectively invisible against the dark sections both
 * CurrentSpeakersSection and PreviousSpeakersSection actually render on (that's the "barely
 * visible AS/CC lettering" bug on /view_speaker).
 */
export function SpeakerAvatar({
  src,
  name,
  className = "",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src!} alt={name} onError={() => setFailed(true)} className={`object-cover ${className}`} />
    );
  }

  const label = initials(name);

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand-pink/10 via-white/5 to-transparent ${className}`}>
      {label ? (
        <span className="text-4xl font-black uppercase tracking-tight text-zinc-600">{label}</span>
      ) : (
        <User className="h-16 w-16 text-zinc-600" strokeWidth={1.5} />
      )}
    </div>
  );
}
