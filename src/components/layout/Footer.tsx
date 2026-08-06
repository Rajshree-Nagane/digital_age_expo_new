import Image from "next/image";
import Link from "next/link";
import { getDomain } from "@/lib/services/domain";
import { NewsletterForm } from "@/components/layout/NewsletterForm";

const QUICK_LINKS = [
  { href: "/free-ticket", label: "Visitor Registration" },
  { href: "/exhibitor-registration?action=register", label: "Exhibitor Registration" },
  { href: "/speaker_registration", label: "Speakers Registration" },
  { href: "/speaker-questionaire", label: "Speaker Questionnaire" },
  { href: "/why-sponsor", label: "Sponsorship Registration" },
  { href: "/why_join_exhibit", label: "Why Join Exhibit" },
  { href: "/articles", label: "Knowledge Center" },
  { href: "/marketing-toolkit", label: "Marketing Toolkit" },
  { href: "/business_club", label: "Business Club Membership" },
  { href: "/frequently-asked-questions", label: "FAQs" },
  { href: "/charity-partnership", label: "Charity Partnership" },
  { href: "/event-services", label: "Addon Services" },
];

const SOCIAL = (domain: Awaited<ReturnType<typeof getDomain>>) =>
  [
    { label: "Facebook", href: domain.facebook },
    { label: "Twitter", href: domain.twitter },
    { label: "Instagram", href: domain.instagram },
    { label: "YouTube", href: domain.youtube },
    { label: "LinkedIn", href: domain.linkedin },
  ].filter((s): s is { label: string; href: string } => !!s.href);

export async function Footer() {
  const domain = await getDomain();
  const socialLinks = SOCIAL(domain);

  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
        <div>
          <Image
            src="/images/logo-footer.jpg"
            alt={domain.name}
            width={180}
            height={32}
            className="h-8 w-auto"
          />
          <div className="mt-4 space-y-1 text-white/70">
            {domain.email && <p>Email: {domain.email}</p>}
            {domain.phone && <p>Call: {domain.phone}</p>}
          </div>
          {socialLinks.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80 transition hover:border-brand-pink hover:text-brand-pink"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="brand-gradient-text text-lg font-bold">Quick Links</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            {domain.partner_url && (
              <li>
                <a href={domain.partner_url} target="_blank" rel="noreferrer" className="hover:text-white">
                  Franchise Opportunity
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="brand-gradient-text text-lg font-bold">Newsletter</h3>
          <p className="mt-4 text-sm text-white/70">
            Don&apos;t miss a thing! Sign up for free to receive your copy of the monthly {domain.name}{" "}
            newsletter and keep up to date with all the latest show and industry news.
          </p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} {domain.name}. 71-75 Shelton Street, London, Greater London,
        United Kingdom, WC2H 9JQ
      </div>
    </footer>
  );
}
