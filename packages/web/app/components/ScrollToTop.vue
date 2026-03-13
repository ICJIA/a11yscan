<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <button
      v-if="visible"
      type="button"
      aria-label="Scroll to top"
      class="fixed bottom-6 right-6 z-40 flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors"
      @click="scrollToTop"
    >
      <UIcon name="i-lucide-arrow-up" class="text-lg" aria-hidden="true" />
    </button>
  </Transition>
</template>

<script setup lang="ts">
const visible = ref(false);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onScroll() {
  visible.value = window.scrollY > 300;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>
