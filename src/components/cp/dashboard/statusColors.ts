/**
 * Deterministic label -> color mapping for the dashboard's donut charts, per the dataviz
 * skill's rules: categorical hues are assigned in a fixed order (never cycled/re-rolled), and
 * a status color is reserved for actual state semantics rather than reused as "series N".
 *
 * Known status words (active/paid/enabled vs pending vs excluded/canceled/...) map onto the
 * skill's fixed status palette (good/warning/critical) so "Active" reads the same green on
 * every card. Anything outside that vocabulary (the exhibitor CRM pipeline states — Interested,
 * Reserved, Call Back, ...) falls back to the categorical palette, picked by a stable hash of
 * the label so the same label always gets the same slot — no shared mutable state, so this is
 * safe to call from multiple concurrent server requests.
 */

const STATUS_PALETTE = {
  good: "var(--color-chart-good)",
  warning: "var(--color-chart-warning)",
  critical: "var(--color-chart-critical)",
};

/** The rolled-up "Other" bucket's color — deliberately NOT a categorical or status hue (a
 * generated Nth hue is indistinguishable from an existing one under CVD, and "Other" isn't a
 * real state anyway). A flat de-emphasis gray, same spirit as marks-and-anatomy.md's
 * emphasis/de-emphasis pairing. */
export const OTHER_SLICE_COLOR = "var(--color-chart-other)";

// Dark-mode categorical slots, in the fixed order from the dataviz skill's reference palette
// (references/palette.md) — blue, orange, aqua, yellow, magenta, green, violet, red.
const CATEGORICAL_SLOTS = [
  "var(--color-chart-series-1)",
  "var(--color-chart-series-2)",
  "var(--color-chart-series-3)",
  "var(--color-chart-series-4)",
  "var(--color-chart-series-5)",
  "var(--color-chart-series-6)",
  "var(--color-chart-series-7)",
  "var(--color-chart-series-8)",
];

const GOOD_WORDS = ["active", "approved", "paid", "enabled", "registered", "confirmed", "meeting scheduled"];
const CRITICAL_WORDS = [
  "excluded",
  "cancel",
  "suspend",
  "disabled",
  "unapproved",
  "reject",
  "missing",
  "deactive",
  "not interested",
  "invalid",
  "no answer",
  "not set",
];
const WARNING_WORDS = ["pending", "unpaid", "reserved", "interested", "call back", "voice mail"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForLabel(label: string): string {
  const key = label.trim().toLowerCase();
  if (GOOD_WORDS.some((word) => key.includes(word))) return STATUS_PALETTE.good;
  if (CRITICAL_WORDS.some((word) => key.includes(word))) return STATUS_PALETTE.critical;
  if (WARNING_WORDS.some((word) => key.includes(word))) return STATUS_PALETTE.warning;
  return CATEGORICAL_SLOTS[hashString(key) % CATEGORICAL_SLOTS.length];
}
