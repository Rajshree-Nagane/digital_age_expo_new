import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, cachedRead } from "@/lib/cache";

/**
 * Legacy admin-editable copy (find_language_phrases, languageid = -1, section
 * "custom") — e.g. hero title, counter figures, CTA copy. languageid -1 is the
 * site's custom-override bucket used regardless of visitor language.
 *
 * Cached across requests (see src/lib/cache.ts). `variableNames` is an argument, so it forms part
 * of the cache key — each distinct set of phrases a page asks for gets its own entry. Callers
 * should therefore keep their phrase lists stable rather than building them conditionally, or they
 * fragment the cache into one entry per combination.
 */
export const getPhrases = cachedRead(
  ["language", "getPhrases"],
  async function getPhrases(variableNames: string[]): Promise<Record<string, string>> {
    const rows = await prisma.find_language_phrases.findMany({
      where: {
        languageid: -1,
        section: "custom",
        variablename: { in: variableNames },
      },
      select: { variablename: true, content: true },
    });

    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.variablename] = row.content ?? "";
    }
    return result;
  },
  { tags: [CACHE_TAGS.phrases] }
);
