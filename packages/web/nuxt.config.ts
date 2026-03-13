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
        { name: 'theme-color', content: '#0a0a0a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'a11yscan',
            description: 'Pattern-aware CLI accessibility auditor that groups thousands of violations into actionable patterns.',
            url: 'https://a11yscan.dev',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'macOS, Linux, Windows (WSL2)',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            license: 'https://opensource.org/licenses/MIT',
            datePublished: '2026-03-12',
            dateModified: '2026-03-13',
            softwareVersion: '1.1.0',
            author: {
              '@type': 'Organization',
              name: 'Illinois Criminal Justice Information Authority',
              url: 'https://icjia.illinois.gov',
            },
          }),
        },
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
