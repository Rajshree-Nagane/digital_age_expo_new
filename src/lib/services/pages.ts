import { prisma } from "@/lib/prisma";

export interface CMSPage {
  id: number;
  title: string;
  content: string | null;
  friendly_url: string;
  meta_title: string;
  meta_description: string | null;
}

export async function getPageByUrl(url: string): Promise<CMSPage | null> {
  try {
    const cleanUrl = url.replace(/^\//, "").replace(/\.php$/, "");
    const page = await prisma.find_pages.findFirst({
      where: {
        active: 1,
        OR: [
          { friendly_url: cleanUrl },
          { friendly_url: url },
          { friendly_url: `/${cleanUrl}` },
        ],
      },
    });

    if (!page) return null;

    return {
      id: page.id,
      title: page.title,
      content: page.content,
      friendly_url: page.friendly_url,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
    };
  } catch {
    return null;
  }
}