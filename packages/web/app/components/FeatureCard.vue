<template>
  <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 p-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
    <UIcon :name="icon" class="text-primary-500 dark:text-primary-400 text-xl mb-3" />
    <h3 class="text-base font-semibold text-neutral-900 dark:text-white mb-2">{{ title }}</h3>
    <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
}>();
</script>
