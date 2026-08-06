import { prisma } from "@/lib/prisma";

/**
 * Legacy admin-editable copy (find_language_phrases, languageid = -1, section
 * "custom") — e.g. hero title, counter figures, CTA copy. languageid -1 is the
 * site's custom-override bucket used regardless of visitor language.
 */
export async function getPhrases(
  variableNames: string[]
): Promise<Record<string, string>> {
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
}
