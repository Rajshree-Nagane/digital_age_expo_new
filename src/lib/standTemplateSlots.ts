/**
 * Fixed upload slots overlaid on the generic fallback stand background
 * (`/images/stand_img.png`, see DEFAULT_STAND_TEMPLATE in StandCanvas.tsx / StandAssetsManager.tsx).
 *
 * Unlike the DB-driven `find_event_lobby_spots` hotspots (which only exist for exhibitors with a
 * real seeded `ex_stand_layout_id` template), these six positions are hand-measured directly off
 * the pixels of stand_img.png itself, so they only make sense to render while that exact fallback
 * image is the one showing. Recommended dimensions come from the legacy artwork spec at
 * /Standartworktemplates ("Booth Dimension Requirements").
 *
 * Each is persisted as its own `find_event_lobby_layout_type_assets` row per exhibitor, keyed by
 * `title = slot.key` (see the `update_template_asset` action in
 * /api/members/stand-assets/route.ts) — independent of any real spot record.
 */
export interface StandTemplateSlot {
  key: string;
  label: string;
  helpText: string;
  /** Percentage-based box, measured against the 1940x1091 stand_img.png canvas. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export const STAND_TEMPLATE_SLOTS: StandTemplateSlot[] = [
  {
    key: "top_banner",
    label: "Stand Header Image",
    helpText: "Recommended: 678 x 188px",
    left: 19.5,
    top: 8.4,
    width: 35.1,
    height: 17.1,
  },
  {
    key: "top_banner_left",
    label: "Top Banner Image (Left)",
    helpText: "Recommended: 325 x 395px",
    left: 74.3,
    top: 9.2,
    width: 7.6,
    height: 16.2,
  },
  {
    key: "top_banner_right",
    label: "Top Banner Image (Right)",
    helpText: "Recommended: 325 x 395px",
    left: 85.0,
    top: 9.2,
    width: 7.6,
    height: 16.2,
  },
  {
    key: "bottom_banner_left",
    label: "Bottom Banner Image (Left)",
    helpText: "Recommended: 335 x 727px",
    left: 7.7,
    top: 55.9,
    width: 7.2,
    height: 30.2,
  },
  {
    key: "bottom_banner_right",
    label: "Bottom Banner Image (Right)",
    helpText: "Recommended: 335 x 727px",
    left: 84.8,
    top: 55.9,
    width: 7.5,
    height: 30.2,
  },
  {
    key: "tabletop_banner",
    label: "Tabletop Image",
    helpText: "Recommended: 232 x 94px",
    left: 63.7,
    top: 77.7,
    width: 12.0,
    height: 8.5,
  },
];

export const STAND_TEMPLATE_SLOT_KEYS = STAND_TEMPLATE_SLOTS.map((s) => s.key);
