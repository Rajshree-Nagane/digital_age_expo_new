"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The virtual-event lobby (/virtual-event/[slug]) is a full-bleed, app-like screen with its own
 * top bar (LobbyTopBar) and sticky bottom icon nav (LobbyFooterNav) — mirroring the legacy
 * lobby.tpl, which never renders the marketing site's footer either (its .footer-nav is the
 * *only* footer on that screen, `position: fixed`, always visible). Hides the site's <Footer />
 * (Quick Links / Newsletter / social) there so it doesn't stack underneath the lobby's own fixed
 * nav and force a scroll to reach it.
 *
 * Matched by exact "/virtual-event/<slug>" (no further segments) so the visitor login screen one
 * level down (/virtual-event/<slug>/login) keeps the normal site header/footer chrome — it's a
 * regular centered auth form, not the immersive lobby.
 */
const LOBBY_PATH = /^\/virtual-event\/[^/]+\/?$/;

export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (LOBBY_PATH.test(pathname)) return null;
  return <>{children}</>;
}
