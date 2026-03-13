export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  app: {
    head: {
      title: 'a11yscan — Pattern-aware accessibility auditor',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Groups thousands of accessibility violations into actionable patterns. Fix 12 root causes, not 2,745 line items.' },
        { property: 'og:title', content: 'a11yscan — Pattern-aware accessibility auditor' },
        { property: 'og:description', content: 'Groups thousands of accessibility violations into actionable patterns. Fix 12 root causes, not 2,745 line items.' },
        { property: 'og:image', content: 'https://a11yscan.dev/og-image.png' },
        { property: 'og:url', content: 'https://a11yscan.dev' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'a11yscan — Pattern-aware accessibility auditor' },
        { name: 'twitter:description', content: 'Groups thousands of accessibility violations into actionable patterns.' },
        { name: 'twitter:image', content: 'https://a11yscan.dev/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  nitro: {
    preset: 'static',
    prerender: {
      routes: ['/', '/features', '/docs', '/roadmap', '/404.html'],
    },
    devStorage: {
      cache: {
        driver: 'memory',
      },
    },
  },

  compatibilityDate: '2025-03-13',
});
