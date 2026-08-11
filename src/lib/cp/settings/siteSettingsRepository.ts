import { cache } from "react";
import { getSettingsGroup } from "@/lib/cp/settings/settingsRepository";
import { getDomainSettings } from "@/lib/cp/settings/domainRepository";

/**
 * The single source of truth for every CP → Settings value, aggregated across find_domains
 * (Company/legacy Branding/legacy Social columns) and every find_settings grouptitle this
 * module introduced (general/contact/branding/theme/typography/social/seo/website/footer).
 *
 * This is a READ-ONLY aggregator for the public site to consume (getGeneralSettings() below) —
 * CP pages still read/write their own section directly via settingsRepository.ts /
 * domainRepository.ts, since each page only needs its own slice and re-fetching everything on
 * every settings sub-page would be wasteful. This file exists for Phase 2 (wiring the public
 * site's header/footer/theme/meta tags to these values), and is wrapped in React's cache() so a
 * single request that touches multiple public components (e.g. layout + footer + a page's own
 * <head> metadata) only ever queries the database once.
 *
 * Every field has a hard-coded fallback so a freshly-provisioned domain with no rows yet (see
 * "DEFAULT SETTINGS" — a new site should never see undefined/crash, only sensible empty values)
 * renders identically to one where the CP simply hasn't saved that section yet.
 */

async function settingsMap(grouptitle: string): Promise<Record<string, string>> {
  const rows = await getSettingsGroup(grouptitle);
  return Object.fromEntries(rows.map((r) => [r.varname, r.value ?? ""]));
}

const SOCIAL_KEYS = ["facebook", "instagram", "linkedin", "twitter", "youtube", "tiktok", "whatsapp", "pinterest"] as const;
const DOMAIN_BACKED_SOCIAL = new Set(["facebook", "instagram", "linkedin", "twitter", "youtube"]);

export interface SocialLink {
  platform: (typeof SOCIAL_KEYS)[number];
  url: string;
  enabled: boolean;
  order: number;
}

export interface GeneralSiteSettings {
  site: {
    name: string;
    organisationName: string;
    shortDescription: string;
    siteTitle: string;
    tagline: string;
    fullDescription: string;
    organisationType: string;
    registrationNumber: string;
    foundedYear: string;
    url: string;
    timezone: string;
    currency: string;
    language: string;
  };
  contact: {
    primaryEmail: string;
    supportEmail: string;
    salesEmail: string;
    phone: string;
    whatsapp: string;
    alternatePhone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
    googleMapsUrl: string;
    // Legacy find_domains fallbacks, used only if the structured Contact tab is still blank.
    legacyEmail: string;
    legacyPhone: string;
    legacyAddress: string;
  };
  branding: {
    faviconUrl: string;
    primaryLogoUrl: string;
    secondaryLogoUrl: string;
    mobileLogoUrl: string;
    footerLogoUrl: string;
    loginLogoUrl: string;
    showHeaderBrandLogo: boolean;
    hidePricing: boolean;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingColor: string;
    buttonColor: string;
    buttonHoverColor: string;
    linkColor: string;
    darkMode: boolean;
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
    headingScale: string;
  };
  social: SocialLink[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    robots: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
  };
  website: {
    websiteEnabled: boolean;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    registrationEnabled: boolean;
    nominationEnabled: boolean;
    contactFormEnabled: boolean;
    newsletterEnabled: boolean;
    showSocialLinks: boolean;
    showFooter: boolean;
    showCookieBanner: boolean;
    showWhatsappButton: boolean;
  };
  footer: {
    description: string;
    copyrightText: string;
    email: string;
    phone: string;
    address: string;
    privacyPolicyUrl: string;
    termsUrl: string;
    cookiePolicyUrl: string;
    copyrightYear: number;
  };
}

const on = (v: string | undefined, fallback: boolean): boolean => (v === undefined || v === "" ? fallback : v === "on");

export const getGeneralSettings = cache(async function getGeneralSettings(): Promise<GeneralSiteSettings> {
  const [domain, general, contact, branding, theme, typography, social, seo, website, footer] = await Promise.all([
    getDomainSettings(),
    settingsMap("general"),
    settingsMap("contact"),
    settingsMap("branding"),
    settingsMap("theme"),
    settingsMap("typography"),
    settingsMap("social"),
    settingsMap("seo"),
    settingsMap("website"),
    settingsMap("footer"),
  ]);

  const socialLinks: SocialLink[] = SOCIAL_KEYS.map((platform) => {
    const url = DOMAIN_BACKED_SOCIAL.has(platform)
      ? ((domain as unknown as Record<string, string | null>)[platform] ?? "")
      : social[`cp_social_${platform}_url`] ?? "";
    return {
      platform,
      url,
      enabled: on(social[`cp_social_${platform}_enabled`], true) && url !== "",
      order: Number(social[`cp_social_${platform}_order`] ?? "0") || 0,
    };
  }).sort((a, b) => a.order - b.order);

  return {
    site: {
      name: domain.name || "",
      organisationName: domain.brand || "",
      shortDescription: domain.short_description || "",
      siteTitle: general.cp_site_title || domain.name || "",
      tagline: general.cp_site_tagline || "",
      fullDescription: general.cp_full_description || "",
      organisationType: general.cp_organisation_type || "",
      registrationNumber: general.cp_registration_number || "",
      foundedYear: general.cp_founded_year || "",
      url: general.cp_site_url || "",
      timezone: general.cp_default_timezone || "Europe/London",
      currency: general.cp_default_currency || "GBP",
      language: general.cp_default_language || "en",
    },
    contact: {
      primaryEmail: contact.cp_contact_primary_email || domain.email || "",
      supportEmail: contact.cp_contact_support_email || "",
      salesEmail: contact.cp_contact_sales_email || "",
      phone: contact.cp_contact_phone || domain.phone || "",
      whatsapp: contact.cp_contact_whatsapp || "",
      alternatePhone: contact.cp_contact_alternate_phone || "",
      addressLine1: contact.cp_contact_address_line1 || "",
      addressLine2: contact.cp_contact_address_line2 || "",
      city: contact.cp_contact_city || "",
      state: contact.cp_contact_state || "",
      country: contact.cp_contact_country || "",
      postcode: contact.cp_contact_postcode || "",
      googleMapsUrl: contact.cp_contact_google_maps_url || "",
      legacyEmail: domain.email || "",
      legacyPhone: domain.phone || "",
      legacyAddress: domain.address || "",
    },
    branding: {
      faviconUrl: domain.fav || "",
      primaryLogoUrl: branding.cp_branding_primary_logo || "",
      secondaryLogoUrl: branding.cp_branding_secondary_logo || "",
      mobileLogoUrl: branding.cp_branding_mobile_logo || "",
      footerLogoUrl: branding.cp_branding_footer_logo || "",
      loginLogoUrl: branding.cp_branding_login_logo || "",
      showHeaderBrandLogo: domain.show_header_brand_logo === 1,
      hidePricing: domain.hide_pricing ?? false,
    },
    theme: {
      primaryColor: theme.cp_theme_primary_color || "#ec4899",
      secondaryColor: theme.cp_theme_secondary_color || "#18181b",
      accentColor: theme.cp_theme_accent_color || "#f472b6",
      backgroundColor: theme.cp_theme_background_color || "#09090b",
      textColor: theme.cp_theme_text_color || "#e4e4e7",
      headingColor: theme.cp_theme_heading_color || "#ffffff",
      buttonColor: theme.cp_theme_button_color || "#ec4899",
      buttonHoverColor: theme.cp_theme_button_hover_color || "#db2777",
      linkColor: theme.cp_theme_link_color || "#f472b6",
      darkMode: on(theme.cp_theme_dark_mode, true),
    },
    typography: {
      primaryFont: typography.cp_typography_primary_font || "Plus Jakarta Sans",
      secondaryFont: typography.cp_typography_secondary_font || "Inter",
      headingFont: typography.cp_typography_heading_font || "Outfit",
      bodyFont: typography.cp_typography_body_font || "Plus Jakarta Sans",
      baseFontSize: typography.cp_typography_base_font_size || "16",
      headingScale: typography.cp_typography_heading_scale || "1.25",
    },
    social: socialLinks,
    seo: {
      metaTitle: seo.cp_seo_meta_title || "",
      metaDescription: seo.cp_seo_meta_description || "",
      metaKeywords: seo.cp_seo_meta_keywords || "",
      canonicalUrl: seo.cp_seo_canonical_url || "",
      robots: seo.cp_seo_robots || "index, follow",
      ogTitle: seo.cp_seo_og_title || "",
      ogDescription: seo.cp_seo_og_description || "",
      ogImage: seo.cp_seo_og_image || "",
      twitterTitle: seo.cp_seo_twitter_title || "",
      twitterDescription: seo.cp_seo_twitter_description || "",
      twitterImage: seo.cp_seo_twitter_image || "",
    },
    website: {
      websiteEnabled: on(website.cp_website_enabled, true),
      maintenanceMode: on(website.cp_website_maintenance_mode, false),
      maintenanceMessage: website.cp_website_maintenance_message || "",
      registrationEnabled: on(website.cp_website_registration_enabled, true),
      nominationEnabled: on(website.cp_website_nomination_enabled, true),
      contactFormEnabled: on(website.cp_website_contact_form_enabled, true),
      newsletterEnabled: on(website.cp_website_newsletter_enabled, true),
      showSocialLinks: on(website.cp_website_show_social_links, true),
      showFooter: on(website.cp_website_show_footer, true),
      showCookieBanner: on(website.cp_website_show_cookie_banner, true),
      showWhatsappButton: on(website.cp_website_show_whatsapp_button, false),
    },
    footer: {
      description: footer.cp_footer_description || "",
      copyrightText: footer.cp_footer_copyright_text || "",
      email: footer.cp_footer_email || "",
      phone: footer.cp_footer_phone || "",
      address: footer.cp_footer_address || "",
      privacyPolicyUrl: footer.cp_footer_privacy_policy_url || "",
      termsUrl: footer.cp_footer_terms_url || "",
      cookiePolicyUrl: footer.cp_footer_cookie_policy_url || "",
      copyrightYear: new Date().getFullYear(),
    },
  };
});
