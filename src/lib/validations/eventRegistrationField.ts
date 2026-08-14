import { z } from "zod";

/**
 * Field types offered for a registration field.
 *
 * The legacy `manage_registration.php` dropdown listed
 * text / select / checkbox / date / password, but its `checkFieldType()` JS also
 * built the option editor for `radio` — a type the dropdown never let you pick.
 * That inconsistency is resolved here by offering `radio` too, since everything
 * downstream already handles it.
 */
export const REGISTRATION_FIELD_TYPES = [
  "text",
  "select",
  "checkbox",
  "radio",
  "date",
  "password",
] as const;

export type RegistrationFieldType = (typeof REGISTRATION_FIELD_TYPES)[number];

/** The types whose values come from a fixed option list. */
export const OPTION_BACKED_FIELD_TYPES: RegistrationFieldType[] = ["select", "checkbox", "radio"];

export const eventRegistrationFieldSchema = z
  .object({
    field_name: z
      .string()
      .trim()
      .min(1, "Field name is required.")
      .max(150, "Field name is too long."),

    /**
     * Used as the HTML input name on the public registration form, so it has to
     * be a safe identifier. The legacy screen let you type anything here, which
     * is how rows with spaces got in.
     */
    field_variable: z
      .string()
      .trim()
      .min(1, "Field variable is required.")
      .max(100, "Field variable is too long.")
      .regex(
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        "Use letters, numbers and underscores only, starting with a letter or underscore.",
      ),

    field_type: z.enum(REGISTRATION_FIELD_TYPES),

    is_active: z.boolean().default(false),
    is_required: z.boolean().default(false),
    login: z.boolean().default(false),

    /** Only meaningful for select/checkbox/radio; stored JSON-encoded. */
    options: z.array(z.string().trim().min(1, "Option cannot be empty.")).default([]),
  })
  .superRefine((value, ctx) => {
    if (OPTION_BACKED_FIELD_TYPES.includes(value.field_type) && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: `A "${value.field_type}" field needs at least one option.`,
      });
    }
  });

export type EventRegistrationFieldInput = z.infer<typeof eventRegistrationFieldSchema>;

/** The three per-row switches on the grid — the only columns the toggles may write. */
export const REGISTRATION_FIELD_FLAGS = ["is_active", "is_required", "login"] as const;
export type RegistrationFieldFlag = (typeof REGISTRATION_FIELD_FLAGS)[number];

export const registrationFieldToggleSchema = z.object({
  id: z.coerce.number().int().positive(),
  flag: z.enum(REGISTRATION_FIELD_FLAGS),
  value: z.boolean(),
});

export type RegistrationFieldToggleInput = z.infer<typeof registrationFieldToggleSchema>;
