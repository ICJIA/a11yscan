<template>
  <footer class="border-t border-neutral-200 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-950">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white mb-3">
            <span class="text-primary-500 dark:text-primary-400 font-mono text-sm">&lt;/&gt;</span>
            a11yscan
          </div>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
            Pattern-aware accessibility auditor. Groups thousands of violations into actionable patterns for ARIA roles, accessible names, and color contrast.
          </p>
        </div>
        <nav aria-label="Product">
          <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Product</p>
          <ul class="space-y-2">
            <li><NuxtLink to="/features" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Features</NuxtLink></li>
            <li><NuxtLink to="/docs" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Documentation</NuxtLink></li>
            <li><NuxtLink to="/roadmap" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Roadmap</NuxtLink></li>
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Resources</p>
          <ul class="space-y-2">
            <li><a href="https://github.com/ICJIA/a11yscan" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">GitHub</a></li>
            <li><a href="https://github.com/ICJIA/a11yscan/issues" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Issues</a></li>
            <li><a href="https://github.com/dequelabs/axe-core" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">axe-core</a></li>
          </ul>
        </nav>
      </div>
      <div class="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-xs text-neutral-400 dark:text-neutral-400">MIT License. Built with Nuxt, Playwright, and axe-core.</p>
        <div class="flex items-center gap-3">
          <a href="https://github.com/ICJIA/a11yscan/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" class="text-xs text-neutral-400 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors font-mono">v1.1.1</a>
          <span class="text-neutral-300 dark:text-neutral-700">|</span>
          <a href="https://github.com/ICJIA/a11yscan/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" class="text-xs text-neutral-400 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">Changelog</a>
          <span class="text-neutral-300 dark:text-neutral-700">|</span>
          <span class="text-xs text-neutral-400 dark:text-neutral-400">Illinois Criminal Justice Information Authority</span>
        </div>
      </div>
    </div>
  </footer>
</template>
