import { vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

/**
 * Stubs for Nuxt auto-imported components/composables
 * so we can mount Vue SFCs outside of a Nuxt runtime.
 */

// Stub components used across tests
export const NuxtLink = defineComponent({
  name: 'NuxtLink',
  props: ['to'],
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})

export const NuxtPage = defineComponent({
  name: 'NuxtPage',
  setup(_, { slots }) {
    return () => h('div', { class: 'nuxt-page-stub' }, slots.default?.())
  },
})

export const NuxtLayout = defineComponent({
  name: 'NuxtLayout',
  setup(_, { slots }) {
    return () => h('div', { class: 'nuxt-layout-stub' }, slots.default?.())
  },
})

export const UApp = defineComponent({
  name: 'UApp',
  setup(_, { slots }) {
    return () => h('div', { class: 'u-app-stub' }, slots.default?.())
  },
})

export const UButton = defineComponent({
  name: 'UButton',
  props: ['to', 'icon', 'color', 'variant', 'size', 'target', 'ariaLabel'],
  inheritAttrs: true,
  setup(props, { slots, attrs }) {
    return () => h('button', {
      'aria-label': attrs['aria-label'] || props.ariaLabel,
      'data-icon': props.icon,
    }, slots.default?.())
  },
})

export const UIcon = defineComponent({
  name: 'UIcon',
  props: ['name'],
  setup(props) {
    return () => h('span', { class: 'u-icon-stub', 'aria-hidden': 'true' }, props.name)
  },
})

export const UColorModeButton = defineComponent({
  name: 'UColorModeButton',
  inheritAttrs: true,
  setup(_, { attrs }) {
    return () => h('button', { 'aria-label': attrs['aria-label'] || 'Toggle color mode' })
  },
})

// Global stubs map for shallowMount
export const globalStubs = {
  NuxtLink,
  NuxtPage,
  NuxtLayout,
  UApp,
  UButton,
  UIcon,
  UColorModeButton,
  FeatureCard: true,
  SiteHeader: true,
  SiteFooter: true,
}

// Mock Nuxt auto-imports
export function mockNuxtImports() {
  const headCalls: Array<Record<string, unknown>> = []

  vi.stubGlobal('ref', ref)
  vi.stubGlobal('useHead', (opts: Record<string, unknown>) => {
    headCalls.push(opts)
  })
  vi.stubGlobal('useRoute', () => ({
    fullPath: '/',
    path: '/',
    params: {},
    query: {},
  }))
  vi.stubGlobal('useSeoMeta', vi.fn())
  vi.stubGlobal('watch', vi.fn())
  vi.stubGlobal('definePageMeta', vi.fn())

  return { headCalls }
}
