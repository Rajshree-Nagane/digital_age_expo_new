/** Mirrors class_strings.php::rewrite() for URL-parity with legacy /speaker/{slug}-{id} links. */
export function slugify(value: string): string {
  return value
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/[^0-9A-Za-z\-]/g, "")
    .toLowerCase();
}

export function speakerSlug(name: string, id: number): string {
  return `${slugify(name)}-${id}`;
}

/** Extracts the trailing numeric id from a "some-name-123" slug. */
export function idFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}
