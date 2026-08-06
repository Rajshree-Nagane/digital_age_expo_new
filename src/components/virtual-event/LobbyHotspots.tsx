"use client";

import { useState } from "react";
import Link from "next/link";

interface HotspotChild {
  id: number;
  title: string;
  href: string | null;
}

export interface HotspotWithMenu {
  id: number;
  title: string;
  xPct: number;
  yPct: number;
  color: string | null;
  children: HotspotChild[];
}

const HOTSPOT_POSITIONS = [
  { left: 19, top: 39 }, // Auditorium Left 1
  { left: 24.5, top: 39 }, // Auditorium Left 2
  { left: 30, top: 39 }, // Auditorium Left 3

  { left: 69, top: 39 }, // Auditorium Right 1
  { left: 74, top: 39 }, // Auditorium Right 2
  { left: 80, top: 39 }, // Auditorium Right 3

  { left: 27, top: 58 }, // Exhibition Hall

  { left: 71, top: 58 }, // Networking Lounge

  { left: 50, top: 72 }, // Reception

  { left: 63, top: 67 }, // Highlights (optional)
];

export function LobbyHotspots({
  hotspots,
}: {
  hotspots: HotspotWithMenu[];
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (!hotspots.length) return null;

  const visibleHotspots = hotspots.slice(0, HOTSPOT_POSITIONS.length);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {visibleHotspots.map((spot, index) => {
        const position = HOTSPOT_POSITIONS[index];

        return (
          <div
            key={spot.id}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${position.left}%`,
              top: `${position.top}%`,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setOpenId(openId === spot.id ? null : spot.id)
              }
              title={spot.title}
              aria-label={spot.title}
              className="group relative flex h-4 w-4 items-center justify-center"
            >
              {/* Pulse */}
              <span
                className="absolute h-4 w-4 rounded-full animate-ping opacity-30"
                style={{
                  background: spot.color || "var(--color-marker-default)",
                  animationDuration: "2s",
                }}
              />

              {/* Dot */}
              <span
                className="relative h-3 w-3 rounded-full border border-white shadow-lg group-hover:scale-125 transition"
                style={{
                  background: spot.color || "var(--color-marker-default)",
                }}
              />
            </button>

            {openId === spot.id && (
              <div className="submenu-dropdown absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl p-2">
                <p className="sticky top-0 rounded-t-xl bg-[inherit] px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-wide text-brand-pink">
                  {spot.title}
                  {spot.children.length > 0 ? ` (${spot.children.length})` : ""}
                </p>

                {spot.children.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-400">Not configured yet.</p>
                ) : (
                  <ul className="max-h-72 space-y-0.5 overflow-y-auto">
                    {spot.children.map((child) => (
                      <li key={child.id}>
                        {child.href ? (
                          <Link
                            href={child.href}
                            onClick={() => setOpenId(null)}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-pink/15 hover:text-brand-pink"
                          >
                            {child.title}
                          </Link>
                        ) : (
                          <span
                            title="Coming soon"
                            className="block cursor-default rounded-lg px-3 py-2 text-sm font-medium text-zinc-500"
                          >
                            {child.title}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}