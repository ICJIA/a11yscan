<template>
  <div>
    <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div class="max-w-3xl">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Features</h1>
        <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
          Everything a11yscan does in Phase 1, and what's coming next.
        </p>
      </div>

      <div class="mt-16 space-y-16">
        <div v-for="section in sections" :key="section.title">
          <h2 class="text-2xl font-bold text-neutral-900 dark:text-white mb-6">{{ section.title }}</h2>
          <div class="grid sm:grid-cols-2 gap-6">
            <div v-for="item in section.items" :key="item.title" class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-6">
              <div class="flex items-center gap-3 mb-3">
                <UIcon :name="item.icon" class="text-primary-500 dark:text-primary-400 text-lg" aria-hidden="true" />
                <h3 class="text-base font-semibold text-neutral-900 dark:text-white">{{ item.title }}</h3>
              </div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Features — a11yscan',
  link: [{ rel: 'canonical', href: 'https://a11yscan.dev/features' }],
});
useSeoMeta({
  description: 'Auto sitemap discovery, concurrent scanning, pattern grouping, root cause hints, and four report formats. Everything a11yscan does in Phase 1.',
  ogTitle: 'Features — a11yscan',
  ogDescription: 'Auto sitemap discovery, concurrent scanning, pattern grouping, root cause hints, and four report formats.',
  ogImage: 'https://a11yscan.dev/og-image.png',
  ogImageAlt: 'a11yscan — Pattern-aware accessibility auditor',
  ogUrl: 'https://a11yscan.dev/features',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://a11yscan.dev/og-image.png',
  twitterImageAlt: 'a11yscan — Pattern-aware accessibility auditor',
});

const sections = [
  {
    title: 'Scanning',
    items: [
      { icon: 'i-lucide-globe', title: 'Auto Sitemap Discovery', description: 'Just give it a URL like "example.com". a11yscan auto-prepends https:// and checks for /sitemap.xml. No flags needed.' },
      { icon: 'i-lucide-zap', title: 'Concurrent Scanning', description: 'Scans up to 5 pages in parallel using Playwright with p-limit concurrency control. Default: 4 parallel pages.' },
      { icon: 'i-lucide-refresh-cw', title: 'Crash Recovery', description: 'If Chromium crashes mid-scan, the browser automatically relaunches and scanning continues. No lost progress.' },
      { icon: 'i-lucide-shield-check', title: 'SSRF Protection', description: 'Blocks localhost, private IPs (10.x, 172.16-31.x, 192.168.x), link-local, and non-HTTP protocols.' },
    ],
  },
  {
    title: 'Filtering',
    items: [
      { icon: 'i-lucide-filter', title: 'Prefix Filter', description: 'Scan only pages under a specific path: --filter "/research". Fast way to audit one section of a large site.' },
      { icon: 'i-lucide-regex', title: 'Glob Patterns', description: 'Flexible picomatch-powered matching: --filter-glob "/*/services/**". Combine with prefix filter using AND logic.' },
      { icon: 'i-lucide-minus-circle', title: 'Exclude Paths', description: 'Skip sections with comma-separated prefixes: --exclude "/blog,/archive".' },
      { icon: 'i-lucide-layers', title: 'Depth & Limit', description: 'Control scan scope with --depth (URL path depth) and --limit (max pages to scan).' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { icon: 'i-lucide-scan-search', title: 'Pattern Grouping', description: 'Groups violations by axe-core rule ID + normalized CSS selector. Strips positional pseudo-classes and inline styles for cleaner grouping.' },
      { icon: 'i-lucide-component', title: 'Root Cause Hints', description: 'Auto-detects which framework causes the violation: Vuetify, Nuxt, WordPress, Material UI, Shopify, Elementor, and more.' },
      { icon: 'i-lucide-brain', title: 'LLM-Ready Output', description: 'Every pattern includes htmlSnippet, failureSummary, rawSelector, and suggestedFix URL. Ready for automated code generation.' },
      { icon: 'i-lucide-arrow-down-up', title: 'Impact Sorting', description: 'Patterns sorted by affected page count descending. Critical issues affecting the most pages appear first.' },
    ],
  },
  {
    title: 'Reporting',
    items: [
      { icon: 'i-lucide-file-json', title: 'JSON Reports', description: 'Structured report with patternGroups and flat patterns array. Grouped by violation type for easy consumption by LLMs and CI/CD pipelines.' },
      { icon: 'i-lucide-table', title: 'CSV Reports', description: '11-column spreadsheet grouped by violation type. Includes HTML snippet, failure summary, and pipe-separated affected URLs.' },
      { icon: 'i-lucide-globe', title: 'HTML Reports', description: 'Self-contained styled HTML grouped by violation type with impact badges, HTML snippets, and expandable URL lists. Opens directly in your browser.' },
      { icon: 'i-lucide-file-text', title: 'Markdown Reports', description: 'GitHub-flavored Markdown with summary table, violation sections, and collapsible URL lists. Paste directly into GitHub issues or PRs.' },
      { icon: 'i-lucide-folder', title: 'Scan History', description: 'Reports saved to ./reports/{hostname}/{timestamp}/. Every scan is preserved in a timestamped folder for diffing and trend analysis.' },
    ],
  },
];
</script>
