import { getDomain } from "@/lib/services/domain";
import { getMagazinePublicationById, getLatestMagazinePublication } from "@/lib/services/magazine";
import { BookOpen, Download, Eye, Sparkles } from "lucide-react";

export const metadata = {
  title: "Exhibitor Guide & Event Magazine | Digital Age Expo",
  description: "Read and download the official Digital Age Expo show guide, magazine edition, and exhibitor catalog.",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function MagazinePage({ searchParams }: Props) {
  const { id } = await searchParams;
  const domain = await getDomain();

  const requestedId = id ? Number(id) : NaN;
  const publication = Number.isFinite(requestedId)
    ? await getMagazinePublicationById(requestedId)
    : domain.event_id
      ? await getLatestMagazinePublication(domain.event_id)
      : null;

  const readOnlineHref = publication?.issueLink || publication?.pdfUrl || undefined;
  const downloadHref = publication?.pdfUrl || undefined;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-indigo-950 text-white py-16 px-6 text-center">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
          Show Guide & <span className="text-pink-500">Magazine</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          Explore the official Digital Age Expo guide featuring speaker interviews, event schedules, and exhibitor showcases.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 rounded-xl overflow-hidden aspect-[3/4] shadow-inner relative bg-gradient-to-br from-indigo-900 to-pink-900">
            {publication?.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publication.thumbnailUrl}
                alt="Digital Age Expo Magazine cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-8 text-white h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <BookOpen className="w-8 h-8 text-pink-400" />
                  <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                    Edition 2026
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-pink-300">Official Publication</div>
                  <h2 className="text-2xl font-black mt-1">Digital Age Expo Magazine</h2>
                  <p className="text-xs text-slate-300 mt-2">
                    Special Feature: The Future of AI in Business & E-Commerce
                  </p>
                </div>
                <div className="text-[10px] text-slate-400">Digital Age Publishing</div>
              </div>
            )}
          </div>

          <div className="md:col-span-7 space-y-6">
            <h3 className="text-2xl font-bold text-indigo-950">In This Issue:</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> Full Exhibitor Directory & Stand Map
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> Exclusive Keynote Speaker Questionnaires
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> Sector Spotlights: AI, Fintech & Growth Marketing
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" /> Full Seminar & Workshop Schedules
              </li>
            </ul>

            {!publication && (
              <p className="text-sm text-slate-500 italic">
                No published show guide is available yet. Check back closer to the event for the digital edition.
              </p>
            )}

            <div className="pt-4 flex flex-wrap gap-4">
              <a
                href={readOnlineHref || "#"}
                target={readOnlineHref ? "_blank" : undefined}
                rel={readOnlineHref ? "noopener noreferrer" : undefined}
                aria-disabled={!readOnlineHref}
                className={`px-6 py-3 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                  readOnlineHref ? "bg-pink-600 hover:bg-pink-700" : "bg-slate-300 cursor-not-allowed pointer-events-none"
                }`}
              >
                <Eye className="w-4 h-4" /> Read Online
              </a>
              <a
                href={downloadHref || "#"}
                download={!!downloadHref}
                aria-disabled={!downloadHref}
                className={`px-6 py-3 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition ${
                  downloadHref ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed pointer-events-none"
                }`}
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
