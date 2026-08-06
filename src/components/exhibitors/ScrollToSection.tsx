"use client";

import { useEffect } from "react";

/**
 * When the exhibitor-registration page is reached via a CTA that already signals intent to
 * register/book a stand (e.g. `/exhibitor-registration?action=buy` from the main nav item, or
 * `?action=register` from the footer), skip the marketing hero and jump straight to the form.
 */
export function ScrollToSection({ targetId, when }: { targetId: string; when: boolean }) {
  useEffect(() => {
    if (!when) return;
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [targetId, when]);

  return null;
}
