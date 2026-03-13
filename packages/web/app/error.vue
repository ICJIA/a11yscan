<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
    <SiteHeader />
    <main>
      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
        <p class="text-6xl font-extrabold text-primary-500 dark:text-primary-400 mb-4">{{ error?.statusCode || 404 }}</p>
        <h1 class="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
          {{ error?.statusCode === 500 ? 'Server error' : 'Page not found' }}
        </h1>
        <p class="text-lg text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8">
          {{ error?.statusCode === 500 ? 'Something went wrong. Please try again.' : "The page you're looking for doesn't exist or has been moved." }}
        </p>
        <UButton to="/" size="lg" color="primary" @click="clearError({ redirect: '/' })">Back to home</UButton>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps<{
  error: NuxtError;
}>();

useHead({ title: '404 — a11yscan' });
</script>
