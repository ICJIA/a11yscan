import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { mockNuxtImports, NuxtLink, UButton, UIcon, UColorModeButton } from './helpers'

// Must mock Nuxt auto-imports before importing components
const { headCalls } = mockNuxtImports()

// Use dynamic imports so the stubbed globals are in place
const { default: IndexPage } = await import('../app/pages/index.vue')
const { default: FeaturesPage } = await import('../app/pages/features.vue')
const { default: DocsPage } = await import('../app/pages/docs.vue')
const { default: RoadmapPage } = await import('../app/pages/roadmap.vue')

const globalConfig = {
  stubs: {
    NuxtLink,
    UButton,
    UIcon,
    UColorModeButton,
    FeatureCard: {
      template: '<div class="feature-card-stub"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
      props: ['icon', 'title', 'description'],
    },
  },
}

describe('index page', () => {
  it('renders hero heading with "Fix 12 patterns"', () => {
    const wrapper = shallowMount(IndexPage, { global: globalConfig })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toContain('Fix')
    expect(h1.text()).toContain('12 patterns')
  })

  it('renders multiple sections with h2 headings', () => {
    const wrapper = shallowMount(IndexPage, { global: globalConfig })
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(4)
  })

  it('renders feature cards', () => {
    const wrapper = shallowMount(IndexPage, { global: globalConfig })
    const cards = wrapper.findAll('.feature-card-stub')
    expect(cards.length).toBeGreaterThanOrEqual(6)
  })
})

describe('features page', () => {
  beforeEach(() => {
    headCalls.length = 0
  })

  it('renders "Features" heading', () => {
    const wrapper = shallowMount(FeaturesPage, { global: globalConfig })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Features')
  })

  it('calls useHead with correct title', () => {
    shallowMount(FeaturesPage, { global: globalConfig })
    expect(headCalls.some((c) => c.title === 'Features — a11yscan')).toBe(true)
  })
})

describe('docs page', () => {
  beforeEach(() => {
    headCalls.length = 0
  })

  it('renders "Documentation" heading', () => {
    const wrapper = shallowMount(DocsPage, { global: globalConfig })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Documentation')
  })

  it('calls useHead with correct title', () => {
    shallowMount(DocsPage, { global: globalConfig })
    expect(headCalls.some((c) => c.title === 'Documentation — a11yscan')).toBe(true)
  })

  it('renders CLI reference table', () => {
    const wrapper = shallowMount(DocsPage, { global: globalConfig })
    const tables = wrapper.findAll('table')
    expect(tables.length).toBeGreaterThanOrEqual(1)
  })
})

describe('roadmap page', () => {
  beforeEach(() => {
    headCalls.length = 0
  })

  it('renders "Roadmap" heading', () => {
    const wrapper = shallowMount(RoadmapPage, { global: globalConfig })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Roadmap')
  })

  it('calls useHead with correct title', () => {
    shallowMount(RoadmapPage, { global: globalConfig })
    expect(headCalls.some((c) => c.title === 'Roadmap — a11yscan')).toBe(true)
  })

  it('renders phase timeline items', () => {
    const wrapper = shallowMount(RoadmapPage, { global: globalConfig })
    const h2s = wrapper.findAll('h2')
    expect(h2s.length).toBeGreaterThanOrEqual(3)
    expect(h2s[0].text()).toContain('Phase 1')
  })
})
