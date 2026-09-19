import type { APIRoute } from 'astro';
import { RULES_2026 } from '../lib/calculations/salary';

/**
 * A small, hand-maintained sitemap works better than a generated one at this
 * site's size (a handful of real pages) — it gives explicit control over
 * priority/changefreq and guarantees only genuinely indexable pages are
 * listed (no error pages, no thin pages). Add a new <url> entry here
 * whenever a new real page is published.
 */
const SITE_URL = 'https://salarioclaro.com';

interface SitemapEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
  lastmod?: string;
}

const entries: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/calculadoras/', changefreq: 'weekly', priority: '0.9' },
  {
    path: '/calculadoras/salario-liquido/',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: RULES_2026.lastVerified,
  },
  {
    path: '/calculadoras/salario-proporcional/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/calculadoras/salario-por-hora/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/calculadoras/dias-trabalhados/',
    changefreq: 'monthly',
    priority: '0.6',
  },
  {
    path: '/calculadoras/inss/',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: RULES_2026.lastVerified,
  },
  {
    path: '/calculadoras/irrf/',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: RULES_2026.lastVerified,
  },
  {
    path: '/calculadoras/ferias/',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: RULES_2026.lastVerified,
  },
  {
    path: '/calculadoras/13-salario/',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: RULES_2026.lastVerified,
  },
  {
    path: '/calculadoras/fgts/',
    changefreq: 'monthly',
    priority: '0.6',
  },
  {
    path: '/calculadoras/rescisao/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/como-calculamos/',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: RULES_2026.lastVerified,
  },
  { path: '/sobre/', changefreq: 'yearly', priority: '0.3' },
  { path: '/contato/', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacidade/', changefreq: 'yearly', priority: '0.2' },
  { path: '/termos/', changefreq: 'yearly', priority: '0.2' },
];

export const GET: APIRoute = () => {
  const urls = entries
    .map((entry) => {
      const loc = `${SITE_URL}${entry.path}`;
      const lastmodTag = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
      return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
