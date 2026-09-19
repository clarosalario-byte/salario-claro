// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://salarioclaro.com',
  // The main calculator moved from /calculadora-salario-liquido/ to
  // /calculadoras/salario-liquido/ when the unified calculator hub was
  // introduced. This redirect preserves the old URL's SEO equity — Astro
  // emits a real <meta http-equiv="refresh"> + rel=canonical redirect page
  // at build time for static output.
  redirects: {
    '/calculadora-salario-liquido/': '/calculadoras/salario-liquido/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
