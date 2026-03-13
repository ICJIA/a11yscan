<template>
  <div>
    <section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Documentation</h1>
      <p class="mt-4 text-lg text-neutral-400 max-w-2xl">
        Install, configure, and run a11yscan in minutes.
      </p>

      <!-- Install -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-4">Installation</h2>
        <div class="rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
          <div class="px-4 py-2 border-b border-neutral-800 text-xs text-neutral-500 font-mono">macOS / Linux</div>
          <pre class="p-5 text-sm font-mono text-neutral-300 overflow-x-auto">pnpm add -g a11yscan
npx playwright install chromium</pre>
        </div>
        <p class="mt-4 text-sm text-neutral-500">Windows requires WSL2 with Ubuntu. See the <a href="https://github.com/ICJIA/a11yscan#windows-wsl2-required" target="_blank" class="text-primary-400 hover:underline">README</a> for details.</p>
      </div>

      <!-- Quick Start -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-4">Quick start</h2>
        <p class="text-neutral-400 mb-4">Just give it a URL. Protocol and /sitemap.xml are optional:</p>
        <div class="rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
          <pre class="p-5 text-sm font-mono text-neutral-300 overflow-x-auto"><span class="text-neutral-600"># These are all equivalent:</span>
a11yscan example.com
a11yscan https://example.com
a11yscan --sitemap https://example.com/sitemap.xml</pre>
        </div>
      </div>

      <!-- CLI Reference -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-6">CLI reference</h2>
        <div class="overflow-x-auto rounded-xl border border-neutral-800">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-900 text-neutral-400">
                <th class="text-left px-4 py-3 font-semibold">Flag</th>
                <th class="text-left px-4 py-3 font-semibold">Default</th>
                <th class="text-left px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="flag in flags" :key="flag.name" class="border-t border-neutral-800/50">
                <td class="px-4 py-3 font-mono text-primary-400 whitespace-nowrap">{{ flag.name }}</td>
                <td class="px-4 py-3 text-neutral-500 whitespace-nowrap">{{ flag.default }}</td>
                <td class="px-4 py-3 text-neutral-400">{{ flag.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Examples -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-6">Examples</h2>
        <div class="space-y-6">
          <div v-for="example in examples" :key="example.title">
            <h3 class="text-base font-semibold text-neutral-300 mb-2">{{ example.title }}</h3>
            <div class="rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
              <pre class="p-5 text-sm font-mono text-neutral-300 overflow-x-auto">{{ example.code }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Exit Codes -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-6">Exit codes</h2>
        <div class="overflow-x-auto rounded-xl border border-neutral-800">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-neutral-900 text-neutral-400">
                <th class="text-left px-4 py-3 font-semibold">Code</th>
                <th class="text-left px-4 py-3 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-neutral-800/50"><td class="px-4 py-3 font-mono text-green-400">0</td><td class="px-4 py-3 text-neutral-400">Scan complete, no violations found</td></tr>
              <tr class="border-t border-neutral-800/50"><td class="px-4 py-3 font-mono text-yellow-400">1</td><td class="px-4 py-3 text-neutral-400">Scan complete, violations found</td></tr>
              <tr class="border-t border-neutral-800/50"><td class="px-4 py-3 font-mono text-red-400">2</td><td class="px-4 py-3 text-neutral-400">Configuration or fetch error</td></tr>
              <tr class="border-t border-neutral-800/50"><td class="px-4 py-3 font-mono text-red-400">3</td><td class="px-4 py-3 text-neutral-400">Scan interrupted (partial results written)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Deployment -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-white mb-4">Deployment</h2>
        <div class="space-y-8">
          <div>
            <h3 class="text-lg font-semibold text-neutral-300 mb-2">Digital Ocean / Laravel Forge</h3>
            <p class="text-sm text-neutral-400 mb-3">The CLI needs headless Chromium, so it runs on a real server (not serverless). Recommended: 2 vCPU / 4 GB RAM droplet with Ubuntu 22.04+.</p>
            <div class="rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
              <pre class="p-5 text-sm font-mono text-neutral-300 overflow-x-auto">cd /home/forge/a11yscan
pnpm install --frozen-lockfile
pnpm --filter a11yscan build
npx playwright install --with-deps chromium</pre>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral-300 mb-2">CI/CD (GitHub Actions)</h3>
            <div class="rounded-xl border border-neutral-800 bg-neutral-900/80 overflow-hidden">
              <div class="px-4 py-2 border-b border-neutral-800 text-xs text-neutral-500 font-mono">.github/workflows/a11y.yml</div>
              <pre class="p-5 text-sm font-mono text-neutral-300 overflow-x-auto">- name: Accessibility audit
  run: |
    npx playwright install chromium
    a11yscan $&#123;&#123; env.SITE_URL &#125;&#125; --ci --output json</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Documentation — a11yscan' });

const flags = [
  { name: '[url]', default: '—', description: 'Site URL — auto-appends /sitemap.xml' },
  { name: '--sitemap <url>', default: '—', description: 'Explicit URL to sitemap.xml' },
  { name: '--filter <path>', default: 'all', description: 'Path prefix to include (e.g., /research)' },
  { name: '--filter-glob <pattern>', default: '—', description: 'Glob pattern for URL pathname matching' },
  { name: '--exclude <paths>', default: '—', description: 'Comma-separated path prefixes to exclude' },
  { name: '--depth <n>', default: '—', description: 'Max URL path depth to include' },
  { name: '--limit <n>', default: '—', description: 'Max number of pages to scan' },
  { name: '--output <formats>', default: 'csv,json,html', description: 'Comma-separated output formats' },
  { name: '--filename <name>', default: 'auto', description: 'Base filename for reports' },
  { name: '--concurrency <n>', default: '4', description: 'Parallel pages to scan (1-5)' },
  { name: '--ci', default: 'false', description: 'CI mode: JSON to stdout, exit codes' },
];

const examples = [
  { title: 'Scan a section', code: 'a11yscan example.com --filter "/about"' },
  { title: 'Exclude sections', code: 'a11yscan example.com --exclude "/blog,/archive"' },
  { title: 'Glob pattern matching', code: 'a11yscan example.com --filter-glob "/*/services/**"' },
  { title: 'Limit scan scope', code: 'a11yscan example.com --filter "/news" --limit 20' },
  { title: 'Custom report name', code: 'a11yscan example.com --filename "q1-audit"' },
  { title: 'CI/CD mode', code: 'a11yscan example.com --ci --output json' },
];
</script>
