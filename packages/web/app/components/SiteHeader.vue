<template>
  <header class="sticky top-0 z-50 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-white hover:text-primary-400 transition-colors">
            <span class="text-primary-400 font-mono text-sm">&lt;/&gt;</span>
            a11yscan
          </NuxtLink>
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink to="/features" class="text-sm text-neutral-400 hover:text-white transition-colors">Features</NuxtLink>
            <NuxtLink to="/docs" class="text-sm text-neutral-400 hover:text-white transition-colors">Docs</NuxtLink>
            <NuxtLink to="/roadmap" class="text-sm text-neutral-400 hover:text-white transition-colors">Roadmap</NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <UColorModeButton />
          <UButton
            to="https://github.com/ICJIA/a11yscan"
            target="_blank"
            icon="i-lucide-github"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </div>
  </header>
</template>
