import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface PageMetaProps {
  /** Page-specific title; will be suffixed with the brand. */
  title: string;
  /** Meta description for the current page. */
  description: string;
  /** Optional canonical path (defaults to current pathname). */
  canonicalPath?: string;
  /** Optional Open Graph image (defaults to brand image). */
  ogImage?: string;
}

const SITE_URL = 'https://www.inside-the-box.org';
const BRAND = 'inside-the-box.org';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const PageMeta = ({ title, description, canonicalPath, ogImage }: PageMetaProps) => {
  const { language } = useLanguage();
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPathname(window.location.pathname);
  }, []);

  const path = canonicalPath ?? pathname ?? '/';
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
  const fullTitle = title && title !== BRAND ? `${title} · ${BRAND}` : BRAND;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* hreflang for trilingual content (DE/EN/FR served on the same URL) */}
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="de" href={canonical} />
      <link rel="alternate" hrefLang="fr" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={language === 'de' ? 'de_DE' : language === 'fr' ? 'fr_FR' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
