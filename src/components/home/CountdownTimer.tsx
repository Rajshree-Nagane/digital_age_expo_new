"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
  className?: string;
}

function getRemaining(targetDate: string) {
  const distance = new Date(targetDate).getTime() - Date.now();
  if (distance <= 0) return { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const weeks = Math.floor(distance / (1000 * 60 * 60 * 24 * 7));
  const days = Math.floor(distance / (1000 * 60 * 60 * 24)) - weeks * 7;
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  return { weeks, days, hours, minutes, seconds };
}

const ZERO_REMAINING = { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

export function CountdownTimer({ targetDate, className }: Props) {
  // Start with a static value so the server-rendered markup and the client's first
  // render match exactly (Date.now() differs between server render time and client
  // hydration time, which was causing a hydration mismatch). The real countdown is
  // computed after mount, once we're safely past hydration.
  const [remaining, setRemaining] = useState(ZERO_REMAINING);

  useEffect(() => {
    setRemaining(getRemaining(targetDate));
    const interval = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    remaining.weeks > 0 ? { label: "weeks", value: remaining.weeks } : null,
    { label: "days", value: remaining.days },
    { label: "hours", value: remaining.hours },
    { label: "minutes", value: remaining.minutes },
    { label: "seconds", value: remaining.seconds },
  ].filter((u): u is { label: string; value: number } => u !== null);

  return (
    <div className={`flex flex-wrap justify-center gap-3 sm:gap-4 ${className ?? ""}`}>
      {units.map((unit) => (
        <div
          key={unit.label}
          className="min-w-[4.5rem] rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm"
        >
          <div className="text-3xl font-extrabold text-white sm:text-4xl">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wide text-white/70">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
