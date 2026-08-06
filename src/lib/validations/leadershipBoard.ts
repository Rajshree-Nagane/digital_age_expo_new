import { z } from "zod";

/** Mirrors the `type` <select> options in leadership_board.php's add/edit form — a subset of
 * the broader find_feeds_external_type enum used only for this feature. */
export const LEADERSHIP_BOARD_TYPES = ["leadership_board", "people_in_business", "new_recruits"] as const;
export type LeadershipBoardType = (typeof LEADERSHIP_BOARD_TYPES)[number];

export const LEADERSHIP_BOARD_TYPE_LABELS: Record<LeadershipBoardType, string> = {
  leadership_board: "Business Leader",
  people_in_business: "People in Business",
  new_recruits: "New Recruits",
};

export const leadershipBoardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  first_name: z.string().trim().max(150).optional().or(z.literal("")),
  last_name: z.string().trim().max(150).optional().or(z.literal("")),
  business: z.string().trim().max(255).optional().or(z.literal("")),
  position: z.string().trim().max(255).optional().or(z.literal("")),
  type: z.enum(LEADERSHIP_BOARD_TYPES).default("leadership_board"),
  issue_date: z.string().trim().optional().or(z.literal("")),
  expiry_date: z.string().trim().optional().or(z.literal("")),
});

export type LeadershipBoardInput = z.infer<typeof leadershipBoardSchema>;
