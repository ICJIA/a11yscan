<template>
  <div>
    <section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <h1 class="text-4xl sm:text-5xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Roadmap</h1>
      <p class="mt-4 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl">
        a11yscan is built in phases. Each phase ships independently and is fully usable on its own.
      </p>

      <div class="mt-16 space-y-0">
        <div v-for="(phase, i) in phases" :key="phase.name" class="relative pl-10">
          <!-- Timeline line -->
          <div v-if="i < phases.length - 1" class="absolute left-[15px] top-10 bottom-0 w-px" :class="phase.status === 'complete' ? 'bg-primary-500/40' : 'bg-neutral-300 dark:bg-neutral-800'" />

          <!-- Timeline dot -->
          <div class="absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full border-2"
            :class="{
              'border-primary-500 bg-primary-500/20': phase.status === 'complete',
              'border-neutral-400 dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-800': phase.status === 'planned',
            }"
          >
            <UIcon v-if="phase.status === 'complete'" name="i-lucide-check" class="text-primary-500 dark:text-primary-400 text-sm" />
            <span v-else class="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
          </div>

          <!-- Content -->
          <div class="pb-12">
            <div class="flex items-center gap-3 mb-2">
              <h2 class="text-xl font-bold text-neutral-900 dark:text-white">{{ phase.name }}</h2>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="{
                  'bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20': phase.status === 'complete',
                  'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700': phase.status === 'planned',
                }"
              >
                {{ phase.status === 'complete' ? 'Complete' : 'Planned' }}
              </span>
            </div>
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ phase.description }}</p>
            <ul class="space-y-2">
              <li v-for="item in phase.items" :key="item" class="flex items-start gap-2 text-sm">
                <UIcon
                  :name="phase.status === 'complete' ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                  class="mt-0.5 shrink-0"
                  :class="phase.status === 'complete' ? 'text-primary-500 dark:text-primary-400' : 'text-neutral-400 dark:text-neutral-700'"
                />
                <span :class="phase.status === 'complete' ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'">{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Roadmap — a11yscan' });

const phases = [
  {
    name: 'Phase 1 — CLI Scanner',
    status: 'complete',
    description: 'The core scanning engine. Everything needed to audit a site from the command line.',
    items: [
      'Sitemap fetching with SSRF protection and retry logic',
      'URL filtering: prefix, glob (picomatch), exclude, depth, limit',
      'Bare URL mode with auto-sitemap discovery',
      'Playwright scanner with AxeBuilder API, concurrency (p-limit)',
      'Browser crash recovery with automatic relaunch',
      'Pattern analysis: violations grouped by rule + normalized CSS selector',
      'Root cause hints (Vuetify, Nuxt, WordPress, Material UI, etc.)',
      'CSV, JSON, and HTML reporters',
      'LLM-ready JSON with htmlSnippet, failureSummary, rawSelector',
      'Per-site report subfolders with auto-cleanup',
      'SIGINT handling with partial report writing',
      'CI/CD mode with machine-readable JSON output',
      'a11y.config.ts single source of truth',
      '54 unit tests across all modules',
    ],
  },
  {
    name: 'Phase 2 — Extended Reporters',
    status: 'planned',
    description: 'Additional output formats and reporting enhancements.',
    items: [
      'Markdown reporter for GitHub issues and PRs',
      'Report diffing: compare two scans to show new/resolved patterns',
      'Trend tracking across multiple scan runs',
      'Summary email digest for scheduled server scans',
    ],
  },
  {
    name: 'Phase 3 — Interactive Wizard',
    status: 'planned',
    description: 'Guided mode for users who don\'t want to memorize CLI flags.',
    items: [
      'Interactive wizard via inquirer',
      'Saved scan profiles (re-run common scans with one command)',
      'Profile management: create, list, edit, delete',
      'a11yscan --profile production shorthand',
    ],
  },
  {
    name: 'Phase 4 — Puppeteer Fallback',
    status: 'planned',
    description: 'Alternative browser engine for environments where Playwright is unavailable.',
    items: [
      'Puppeteer scanner as drop-in alternative',
      '--engine puppeteer flag',
      'Shared ScannerManager interface between engines',
    ],
  },
  {
    name: 'Phase 5 — Marketing Site',
    status: 'planned',
    description: 'Public-facing site at a11yscan.dev for documentation and demos.',
    items: [
      'Nuxt 4 + Nuxt UI static site',
      'Deployed to Netlify via pnpm generate',
      'Interactive demo and pattern gallery',
      'SEO and OpenGraph metadata',
    ],
  },
];
</script>
