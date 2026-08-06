import { prisma } from "@/lib/prisma";
import { DOMAIN_ID } from "@/lib/site-config";

/**
 * Project Settings backing store — reuses find_settings, the legacy admin CP's own DOMAIN-
 * scoped EAV settings table (see cp/admin_settings.php), grouped by `grouptitle` into exactly
 * the sections the spec asks for (General/Company/Branding/Theme/SEO/Social Media).
 *
 * find_settings has no unique constraint Prisma recognizes on (varname, DOMAIN) — the real
 * table allows it (the legacy app enforces uniqueness itself in application code, not the DB
 * schema) — so schema.prisma marks it @@ignore and this file talks to it via $queryRaw/
 * $executeRaw instead of a generated model delegate, mirroring admin_settings.php's own
 * SELECT/UPDATE/INSERT-if-missing pattern exactly (see the block comment on each function).
 */

export interface SettingRow {
  varname: string;
  grouptitle: string;
  value: string | null;
  optioncode: string | null;
  optioncode_type: string;
  optioncode_parse_type: string;
  validationcode: string | null;
}

/** All settings in a grouptitle (e.g. "general", "company", "branding", "theme", "seo", "social") for this domain. */
export async function getSettingsGroup(grouptitle: string, domainId: number = DOMAIN_ID): Promise<SettingRow[]> {
  return prisma.$queryRaw<SettingRow[]>`
    SELECT varname, grouptitle, value, optioncode, optioncode_type, optioncode_parse_type, validationcode
    FROM find_settings
    WHERE grouptitle = ${grouptitle} AND DOMAIN = ${domainId}
    ORDER BY varname
  `;
}

export async function getSetting(varname: string, domainId: number = DOMAIN_ID): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ value: string | null }[]>`
    SELECT value FROM find_settings WHERE varname = ${varname} AND DOMAIN = ${domainId} LIMIT 1
  `;
  return rows[0]?.value ?? null;
}

/**
 * Registers a brand-new setting key (metadata + this domain's initial value). Use this once,
 * up front (e.g. from a migration/seed step) for settings the legacy schema never had a
 * varname for yet (this spec's Theme fields, most Branding fields beyond logo/favicon, and
 * most SEO/Social fields) — NOT on every save. Mirrors the shape find_settings rows already
 * have for legacy-known settings like `site_name`.
 */
export async function defineSetting(input: {
  varname: string;
  grouptitle: string;
  value: string;
  optioncodeType?: string;
  domainId?: number;
}): Promise<void> {
  const domainId = input.domainId ?? DOMAIN_ID;
  const optioncodeType = input.optioncodeType ?? "text";
  const existing = await prisma.$queryRaw<{ varname: string }[]>`
    SELECT varname FROM find_settings WHERE varname = ${input.varname} AND DOMAIN = ${domainId} LIMIT 1
  `;
  if (existing.length > 0) return;

  await prisma.$executeRaw`
    INSERT INTO find_settings (varname, grouptitle, value, optioncode, optioncode_type, optioncode_parse_type, validationcode, DOMAIN)
    VALUES (${input.varname}, ${input.grouptitle}, ${input.value}, NULL, ${optioncodeType}, 'static', NULL, ${domainId})
  `;
}

/**
 * Updates a setting's value for this domain. Mirrors admin_settings.php's own save logic
 * (lines ~185-194): UPDATE if a row already exists for (varname, DOMAIN); otherwise copy the
 * varname's metadata (grouptitle/optioncode/optioncode_type/validationcode) from whichever
 * domain already defines it and INSERT a new row for this domain. Throws if the varname has
 * never been defined anywhere — call defineSetting() first for a genuinely new key.
 */
export async function setSetting(varname: string, value: string, domainId: number = DOMAIN_ID): Promise<void> {
  const existing = await prisma.$queryRaw<{ varname: string }[]>`
    SELECT varname FROM find_settings WHERE varname = ${varname} AND DOMAIN = ${domainId} LIMIT 1
  `;

  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE find_settings SET value = ${value} WHERE varname = ${varname} AND DOMAIN = ${domainId}
    `;
    return;
  }

  const parent = await prisma.$queryRaw<SettingRow[]>`
    SELECT varname, grouptitle, value, optioncode, optioncode_type, optioncode_parse_type, validationcode
    FROM find_settings WHERE varname = ${varname} LIMIT 1
  `;
  if (parent.length === 0) {
    throw new Error(
      `Setting "${varname}" has never been defined for any domain — call defineSetting() first.`
    );
  }
  const meta = parent[0];
  await prisma.$executeRaw`
    INSERT INTO find_settings (varname, grouptitle, value, optioncode, optioncode_type, optioncode_parse_type, validationcode, DOMAIN)
    VALUES (${varname}, ${meta.grouptitle}, ${value}, ${meta.optioncode}, ${meta.optioncode_type}, ${meta.optioncode_parse_type}, ${meta.validationcode}, ${domainId})
  `;
}

/** Bulk save — used by each settings sub-page's Server Action (one call per form submit). */
export async function setSettings(values: Record<string, string>, domainId: number = DOMAIN_ID): Promise<void> {
  for (const [varname, value] of Object.entries(values)) {
    await setSetting(varname, value, domainId);
  }
}
