<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-cyan-500/5" />
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/5 px-4 py-1.5 text-xs font-medium text-primary-500 dark:text-primary-400 mb-6">
              <span class="h-1.5 w-1.5 rounded-full bg-primary-500 dark:bg-primary-400" aria-hidden="true" />
              Phase 1 complete &mdash; CLI scanner ready
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.1]">
              Fix <span class="text-primary-500 dark:text-primary-400">12 patterns</span>,<br>
              not 4,200 violations
            </h1>
            <p class="mt-6 text-lg text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed">
              a11yscan groups accessibility violations by root cause &mdash; the combination of axe-core rule and CSS selector. One Vuetify component broken on 340 pages is one pattern, not 340 line items.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <UButton to="/docs" size="lg" color="primary">
                Get Started
              </UButton>
              <UButton to="https://github.com/ICJIA/a11yscan" target="_blank" size="lg" color="neutral" variant="outline" icon="i-lucide-github">
                View on GitHub
              </UButton>
            </div>
          </div>
          <div class="relative">
            <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 shadow-2xl overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 bg-neutral-200 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800">
                <span class="h-3 w-3 rounded-full bg-red-500/80" aria-hidden="true" />
                <span class="h-3 w-3 rounded-full bg-yellow-500/80" aria-hidden="true" />
                <span class="h-3 w-3 rounded-full bg-green-500/80" aria-hidden="true" />
                <span class="ml-2 text-xs text-neutral-400 dark:text-neutral-400 font-mono">Terminal</span>
              </div>
              <div class="p-5 font-mono text-sm leading-7">
                <div><span class="text-neutral-400 dark:text-neutral-400">$</span> <span class="text-neutral-900 dark:text-white">a11yscan example.com</span></div>
                <div class="mt-3 text-neutral-500 dark:text-neutral-400">Checking for sitemap at https://example.com/sitemap.xml... <span class="text-green-600 dark:text-green-400">found</span></div>
                <div class="text-neutral-500 dark:text-neutral-400">Fetching sitemap... <span class="text-green-600 dark:text-green-400">1,860 URLs found</span></div>
                <div class="text-neutral-500 dark:text-neutral-400">Scanning 1,860 pages (concurrency: 5)...</div>
                <div class="mt-3 font-semibold text-neutral-900 dark:text-white">Scan complete.</div>
                <div class="mt-2 text-neutral-500 dark:text-neutral-400">  Pages scanned:   <span class="text-green-600 dark:text-green-400 font-semibold">1,860</span></div>
                <div class="text-neutral-500 dark:text-neutral-400">  Total violations: <span class="text-yellow-600 dark:text-yellow-400 font-semibold">4,200</span></div>
                <div class="text-neutral-500 dark:text-neutral-400">  Patterns found:   <span class="text-primary-500 dark:text-primary-400 font-bold">12</span></div>
                <div class="mt-2 text-neutral-400 dark:text-neutral-400">  Reports saved to ./reports/example.com/</div>
                <div class="mt-1 text-neutral-500 dark:text-neutral-400">View HTML report in browser? (y/N) <span class="text-neutral-900 dark:text-white">y</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem / Solution -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">The problem with accessibility scanners</h2>
          <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            Enterprise tools like SiteImprove, WAVE, and Lighthouse report violations per page. A 500-page site with one broken component produces thousands of duplicate findings.
          </p>
        </div>
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div class="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <div class="text-sm font-semibold text-red-500 dark:text-red-400 mb-2">Traditional scanners</div>
            <div class="text-4xl font-extrabold text-red-500 dark:text-red-400">4,200</div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">violations found</div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Not actionable. You can't tell if there are 4,200 unique problems or 5 repeated patterns. Developers give up before they start.</p>
          </div>
          <div class="rounded-xl border border-primary-500/20 bg-primary-500/5 p-6">
            <div class="text-sm font-semibold text-primary-500 dark:text-primary-400 mb-2">a11yscan</div>
            <div class="text-4xl font-extrabold text-primary-500 dark:text-primary-400">12</div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">patterns identified</div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-4">Each pattern shows what's broken, which component causes it, how many pages are affected, and a link to the fix guide. Fix 12 things, ship it.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Built for real audits</h2>
          <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
            Everything you need to audit a multi-page site and turn the results into a remediation plan.
          </p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            v-for="feature in features"
            :key="feature.title"
            :icon="feature.icon"
            :title="feature.title"
            :description="feature.description"
          />
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">How it works</h2>
          <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">Three steps from sitemap to remediation plan.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div v-for="(step, i) in steps" :key="step.title" class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 text-primary-500 dark:text-primary-400 font-bold text-lg mb-4">
              {{ i + 1 }}
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{{ step.title }}</h3>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- LLM-Ready -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-4">
              LLM-ready reports
            </div>
            <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Feed the JSON to an LLM,<br>get fixes back</h2>
            <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400">
              Every pattern includes the HTML snippet, failure summary, raw CSS selector, and fix guide URL. Give it to Claude, GPT, or any code-generation LLM and get actionable diffs.
            </p>
            <ul class="mt-6 space-y-3">
              <li v-for="field in llmFields" :key="field.name" class="flex items-start gap-3">
                <span class="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shrink-0" />
                <div>
                  <span class="font-mono text-sm text-cyan-600 dark:text-cyan-400">{{ field.name }}</span>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400 ml-2">{{ field.description }}</span>
                </div>
              </li>
            </ul>
          </div>
          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 bg-neutral-200 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800">
              <span class="text-xs text-neutral-400 dark:text-neutral-400 font-mono">aria-report.json</span>
            </div>
            <pre class="p-5 text-xs font-mono leading-6 text-neutral-700 dark:text-neutral-300 overflow-x-auto"><span class="text-neutral-400 dark:text-neutral-400">{</span>
  <span class="text-primary-600 dark:text-primary-400">"patternId"</span>: <span class="text-yellow-600 dark:text-yellow-400">"P001"</span>,
  <span class="text-primary-600 dark:text-primary-400">"violationId"</span>: <span class="text-yellow-600 dark:text-yellow-400">"aria-roles"</span>,
  <span class="text-primary-600 dark:text-primary-400">"impact"</span>: <span class="text-red-600 dark:text-red-400">"critical"</span>,
  <span class="text-primary-600 dark:text-primary-400">"affectedPageCount"</span>: <span class="text-cyan-600 dark:text-cyan-400">340</span>,
  <span class="text-primary-600 dark:text-primary-400">"htmlSnippet"</span>: <span class="text-yellow-600 dark:text-yellow-400">"&lt;div class=\"v-autocomplete\" role=\"listbox\"&gt;"</span>,
  <span class="text-primary-600 dark:text-primary-400">"failureSummary"</span>: <span class="text-yellow-600 dark:text-yellow-400">"Role 'listbox' is not allowed"</span>,
  <span class="text-primary-600 dark:text-primary-400">"rootCauseHint"</span>: <span class="text-yellow-600 dark:text-yellow-400">"Likely Vuetify component"</span>,
  <span class="text-primary-600 dark:text-primary-400">"suggestedFix"</span>: <span class="text-yellow-600 dark:text-yellow-400">"https://dequeuniversity.com/..."</span>
<span class="text-neutral-400 dark:text-neutral-400">}</span></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Who is this for?</h2>
        </div>
        <div class="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div v-for="useCase in useCases" :key="useCase.role" class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-6">
            <div class="text-sm font-semibold text-primary-500 dark:text-primary-400 mb-2">{{ useCase.role }}</div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 italic">"{{ useCase.quote }}"</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="border-t border-neutral-200 dark:border-neutral-800/50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">Ready to audit your site?</h2>
        <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
          Install a11yscan, point it at your sitemap, and get a pattern-grouped report in minutes.
        </p>
        <div class="mt-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/80 inline-block px-8 py-4">
          <code class="font-mono text-sm text-neutral-700 dark:text-neutral-300">
            <span class="text-neutral-400 dark:text-neutral-400">$</span> pnpm add -g a11yscan && a11yscan <span class="text-primary-500 dark:text-primary-400">your-site.com</span>
          </code>
        </div>
        <div class="mt-8 flex justify-center gap-3">
          <UButton to="/docs" size="lg" color="primary">Read the docs</UButton>
          <UButton to="https://github.com/ICJIA/a11yscan" target="_blank" size="lg" color="neutral" variant="outline" icon="i-lucide-github">
            Star on GitHub
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'a11yscan — Pattern-aware accessibility auditor',
  link: [{ rel: 'canonical', href: 'https://a11yscan.dev/' }],
});
useSeoMeta({
  description: 'Groups thousands of accessibility violations into actionable patterns. Fix 12 root causes, not 4,200 line items. Built for ADA Title II compliance.',
  ogTitle: 'a11yscan — Pattern-aware accessibility auditor',
  ogDescription: 'Groups thousands of accessibility violations into actionable patterns. Fix 12 root causes, not 4,200 line items.',
  ogImage: 'https://a11yscan.dev/og-image.png',
  ogImageAlt: 'a11yscan — Pattern-aware accessibility auditor',
  ogUrl: 'https://a11yscan.dev/',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://a11yscan.dev/og-image.png',
  twitterImageAlt: 'a11yscan — Pattern-aware accessibility auditor',
});

const features = [
  { icon: 'i-lucide-scan-search', title: 'Pattern Grouping', description: 'Violations grouped by axe-core rule + CSS selector. One broken component = one pattern, regardless of how many pages it appears on.' },
  { icon: 'i-lucide-zap', title: 'Concurrent Scanning', description: 'Scans up to 5 pages in parallel with Playwright. A 500-page site takes minutes, not hours.' },
  { icon: 'i-lucide-file-text', title: 'CSV + JSON + HTML Reports', description: 'Three output formats by default. The HTML report is self-contained and opens directly in your browser.' },
  { icon: 'i-lucide-brain', title: 'LLM-Ready JSON', description: 'Each pattern includes the HTML snippet, failure summary, and raw selector. Feed it to an LLM for automated fix suggestions.' },
  { icon: 'i-lucide-terminal', title: 'Zero Config', description: 'Just give it a URL. a11yscan auto-discovers the sitemap, auto-prepends https://, and uses sensible defaults.' },
  { icon: 'i-lucide-git-branch', title: 'CI/CD Mode', description: 'Machine-readable JSON output, exit code 0 for clean or 1 for violations. Drop it into GitHub Actions in two lines.' },
  { icon: 'i-lucide-filter', title: 'Flexible Filtering', description: 'Scan specific sections with --filter, glob patterns with --filter-glob, or exclude paths. Combine them with AND logic.' },
  { icon: 'i-lucide-shield-check', title: 'SSRF Protection', description: 'Blocks scanning of localhost, private IPs, and non-HTTP protocols. Safe to run against untrusted sitemaps.' },
  { icon: 'i-lucide-component', title: 'Root Cause Hints', description: 'Identifies which framework likely causes the violation — Vuetify, Nuxt, WordPress, Material UI, Shopify, and more.' },
];

const steps = [
  { title: 'Point', description: 'Give a11yscan a URL. It finds the sitemap, fetches every page, and runs axe-core in a headless browser.' },
  { title: 'Analyze', description: 'Violations are grouped by root cause. Duplicate findings across hundreds of pages collapse into a single pattern.' },
  { title: 'Fix', description: 'Get CSV, JSON, and HTML reports. Each pattern links to a fix guide. Feed the JSON to an LLM for automated code fixes.' },
];

const llmFields = [
  { name: 'htmlSnippet', description: '— the exact DOM element that failed' },
  { name: 'failureSummary', description: '— plain-English fix instructions from axe-core' },
  { name: 'rawSelector', description: '— full CSS path to the element' },
  { name: 'suggestedFix', description: '— link to Deque University fix guide' },
  { name: 'rootCauseHint', description: '— which framework component is responsible' },
];

const useCases = [
  { role: 'State agency webmaster', quote: 'SiteImprove told us we had 4,200 violations. a11yscan showed us it was actually 15 patterns. We fixed all 15 in two sprints.' },
  { role: 'University web team', quote: 'We run a11yscan --filter /admissions before every release. It catches ARIA issues before they multiply across 200 pages.' },
  { role: 'DevOps engineer', quote: 'We use --ci mode in GitHub Actions. If the scan finds violations, the build fails with a machine-readable JSON summary.' },
  { role: 'Freelance developer', quote: 'The root cause hints told me which violations came from the theme vs. plugins. I gave the client a clear, prioritized fix list.' },
];
</script>
