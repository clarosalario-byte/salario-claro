/**
 * Centralized structured-data (JSON-LD) builders.
 *
 * Design: the full Organization/WebSite objects are only defined ONCE (on
 * the homepage). Every other page that needs to reference the organization
 * (About, Contact, the methodology article's publisher, etc.) uses the
 * lightweight stub from `organizationRef()`, which carries the same @id —
 * this avoids duplicating logo/contactPoint/foundingDate on every page
 * while still letting search engines connect the entities across the site.
 */

export const SITE_URL = 'https://salarioclaro.com';
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Full Organization definition — use only on the homepage. */
export function organizationFull() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Salário Claro',
    url: SITE_URL,
    description: 'Calculadoras gratuitas de salário e folha de pagamento para o Brasil.',
    foundingDate: '2026-09-14',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icon-512.png`,
      width: '512',
      height: '512',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@salarioclaro.com',
      contactType: 'customer support',
      areaServed: 'BR',
      availableLanguage: ['Portuguese'],
    },
  };
}

/** Lightweight reference to the same Organization node — use everywhere else. */
export function organizationRef() {
  return { '@id': ORG_ID, '@type': 'Organization', name: 'Salário Claro' };
}

/** Full WebSite definition — use only on the homepage. */
export function websiteFull() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Salário Claro',
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: organizationRef(),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
