<template>
  <header class="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-primary-500 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
      Skip to content
    </a>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors" @click="scrollToTop">
            <span class="text-primary-500 dark:text-primary-400 font-mono text-sm">&lt;/&gt;</span>
            a11yscan
          </NuxtLink>
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink to="/features" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Features</NuxtLink>
            <NuxtLink to="/docs" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Docs</NuxtLink>
            <NuxtLink to="/roadmap" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Roadmap</NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <UColorModeButton aria-label="Toggle dark mode" />
          <UButton
            to="https://github.com/ICJIA/a11yscan"
            target="_blank"
            icon="i-lucide-github"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="View source on GitHub"
          />
          <UButton
            class="md:hidden"
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Open navigation menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>
      </div>
    </div>

    <!-- Mobile navigation drawer -->
    <nav v-if="mobileMenuOpen" class="md:hidden border-t border-neutral-200 dark:border-neutral-800/50 bg-white dark:bg-neutral-950" aria-label="Mobile navigation">
      <div class="px-4 py-4 space-y-2">
        <NuxtLink to="/features" class="block rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="mobileMenuOpen = false">Features</NuxtLink>
        <NuxtLink to="/docs" class="block rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="mobileMenuOpen = false">Docs</NuxtLink>
        <NuxtLink to="/roadmap" class="block rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" @click="mobileMenuOpen = false">Roadmap</NuxtLink>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const mobileMenuOpen = ref(false);
const route = useRoute();

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
