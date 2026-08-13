import { assetUrl, staticAssetUrl } from "@/lib/assets";

interface Props {
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  additionalInfo?: string | null;
  primaryImage?: string | null;
  secondaryImage?: string | null;
  buttonLink?: string | null;
  buttonText?: string | null;
}

export function JoinFacebookGroup({
  sectionTitle,
  sectionDescription,
  additionalInfo,
  primaryImage,
  secondaryImage,
  buttonLink,
  buttonText,
}: Props) {
  const title = sectionTitle || "Join The Private Facebook Group!";
  const desc1 =
    sectionDescription ||
    "Click here to access our incredible Facebook Group. This is the most important step because it’s where you’ll access the entire immersive learning and sharing experience plus special bonus leading up to the event. This step is a MUST so do it first.";
  const desc2 =
    additionalInfo ||
    "Once you join, go live inside the Facebook group to tell the community your name, where you’re from, what you’re passionate about and your #1 reason for joining this amazing live experience!";
  const link = buttonLink || "https://www.facebook.com/groups/digitalageexpo";
  const btnTxt = buttonText || "Click here to Join Our Facebook Group Now!";

  const img1 = assetUrl(primaryImage) || staticAssetUrl("https://digitalageexpo.com/files/listing_pages/817601-fb_grp_1.png");
  const img2 = assetUrl(secondaryImage) || staticAssetUrl("https://digitalageexpo.com/files/listing_pages/817601-fb_grp_2.png");

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-20 text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgb(var(--color-slate-900-rgb) / 0.92), rgb(var(--color-violet-900-rgb) / 0.90)), url('${staticAssetUrl("https://digitalageexpo.com/files/listing_pages/818073-dae_index_top_banner.jpg")}')`,
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-black uppercase tracking-tight text-white sm:text-5xl drop-shadow-md">
          {title}
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 items-center">
          <div className="flex flex-col gap-4">
            <p
              className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed drop-shadow-sm"
              dangerouslySetInnerHTML={{ __html: desc1 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img1}
              alt={title}
              className="mt-2 w-full rounded-2xl shadow-xl border border-white/20 hover:scale-[1.02] transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img2}
              alt={title}
              className="w-full rounded-2xl shadow-xl border border-white/20 hover:scale-[1.02] transition-transform duration-300"
            />
            <p
              className="mt-2 text-slate-100 text-sm sm:text-base font-medium leading-relaxed drop-shadow-sm"
              dangerouslySetInnerHTML={{ __html: desc2 }}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="btn-brand-gradient inline-block rounded-full px-10 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
          >
            {btnTxt}
          </a>
        </div>
      </div>
    </section>
  );
}

