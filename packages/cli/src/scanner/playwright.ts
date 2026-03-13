/**
 * Playwright scanner — manages browser lifecycle and runs axe-core via AxeBuilder.
 */

import { chromium, type Browser, type BrowserContext } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';
import type { AxeRunConfig } from './axe.js';

export class ScannerManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private timeout: number;

  constructor(timeout = 30000) {
    this.timeout = timeout;
  }

  /**
   * Launch a headless Chromium browser instance with a browser context.
   */
  async launch(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext();
  }

  /**
   * Scan a single page for accessibility violations using axe-core.
   * Creates a new page per URL from the shared browser context.
   *
   * @returns AxeResults on success, null on failure (timeout, navigation error, etc.)
   */
  async scanPage(url: string, axeConfig: AxeRunConfig): Promise<AxeResults | null> {
    if (!this.browser || !this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const page = await this.context.newPage();

    try {
      // Navigate and wait for load event first (more reliable than networkidle alone)
      await page.goto(url, {
        waitUntil: 'load',
        timeout: this.timeout,
      });

      // Then try to wait for networkidle with a shorter timeout (best-effort for SPAs)
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch {
        // networkidle timeout is acceptable — page may have long-polling or analytics
      }

      // Safety buffer
      await page.waitForTimeout(500);

      // Run axe-core via AxeBuilder
      const results = await new AxeBuilder({ page })
        .options(axeConfig)
        .analyze();

      return results;
    } catch (err) {
      // Log scan errors for debugging (will be replaced by structured logging later)
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('timeout') || msg.includes('Timeout')) {
        // Expected timeout — skip silently
      } else {
        console.error(`  [scan error] ${url}: ${msg}`);
      }
      return null;
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * Close the browser instance.
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  /**
   * Attempt to recover from a browser crash by closing and relaunching.
   *
   * @returns true if relaunch succeeded, false otherwise
   */
  async relaunch(): Promise<boolean> {
    try {
      await this.close();
      await this.launch();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if the browser is still connected.
   */
  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }
}
