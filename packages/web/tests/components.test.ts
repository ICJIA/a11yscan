import { describe, it, expect } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import { mockNuxtImports, NuxtLink, UButton, UIcon, UColorModeButton } from './helpers'

mockNuxtImports()

const { default: SiteHeader } = await import('../app/components/SiteHeader.vue')
const { default: SiteFooter } = await import('../app/components/SiteFooter.vue')
const { default: FeatureCard } = await import('../app/components/FeatureCard.vue')

const globalConfig = {
  stubs: {
    NuxtLink,
    UButton,
    UIcon,
    UColorModeButton,
  },
}

describe('SiteHeader', () => {
  it('renders logo text "a11yscan"', () => {
    const wrapper = mount(SiteHeader, { global: globalConfig })
    expect(wrapper.text()).toContain('a11yscan')
  })

  it('contains nav links for Features, Docs, Roadmap', () => {
    const wrapper = mount(SiteHeader, { global: globalConfig })
    const navLinks = wrapper.findAll('nav a')
    const linkTexts = navLinks.map((l) => l.text())
    expect(linkTexts).toContain('Features')
    expect(linkTexts).toContain('Docs')
    expect(linkTexts).toContain('Roadmap')
  })

  it('has skip-to-content link', () => {
    const wrapper = mount(SiteHeader, { global: globalConfig })
    const skipLink = wrapper.find('a[href="#main-content"]')
    expect(skipLink.exists()).toBe(true)
    expect(skipLink.text()).toContain('Skip to content')
  })

  it('has aria-label on icon-only buttons', () => {
    const wrapper = mount(SiteHeader, { global: globalConfig })
    const buttons = wrapper.findAll('button')
    buttons.forEach((btn) => {
      // Every button in the header should have an aria-label
      expect(btn.attributes('aria-label')).toBeTruthy()
    })
  })
})

describe('SiteFooter', () => {
  it('renders "MIT License" text', () => {
    const wrapper = mount(SiteFooter, { global: globalConfig })
    expect(wrapper.text()).toContain('MIT License')
  })

  it('has external links with target="_blank"', () => {
    const wrapper = mount(SiteFooter, { global: globalConfig })
    const externalLinks = wrapper.findAll('a[target="_blank"]')
    expect(externalLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders "a11yscan" brand text', () => {
    const wrapper = mount(SiteFooter, { global: globalConfig })
    expect(wrapper.text()).toContain('a11yscan')
  })

  it('contains Product and Resources sections', () => {
    const wrapper = mount(SiteFooter, { global: globalConfig })
    const h4s = wrapper.findAll('h4')
    const headingTexts = h4s.map((h) => h.text())
    expect(headingTexts).toContain('Product')
    expect(headingTexts).toContain('Resources')
  })
})

describe('FeatureCard', () => {
  it('renders title and description props', () => {
    const wrapper = mount(FeatureCard, {
      global: globalConfig,
      props: {
        icon: 'i-lucide-zap',
        title: 'Test Feature',
        description: 'This is a test description.',
      },
    })
    expect(wrapper.find('h3').text()).toBe('Test Feature')
    expect(wrapper.find('p').text()).toBe('This is a test description.')
  })

  it('renders the icon via UIcon stub', () => {
    const wrapper = mount(FeatureCard, {
      global: globalConfig,
      props: {
        icon: 'i-lucide-brain',
        title: 'AI Feature',
        description: 'Smart analysis.',
      },
    })
    const icon = wrapper.find('.u-icon-stub')
    expect(icon.exists()).toBe(true)
  })
})
