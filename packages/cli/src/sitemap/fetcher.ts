/**
 * Sitemap fetcher — fetches and parses sitemap.xml, validates URLs for safety.
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sitemapper = require('sitemapper') as typeof import('sitemapper').default;

const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];

/**
 * Check if a hostname is a private/reserved IP address.
 */
function isPrivateIP(hostname: string): boolean {
  // Check for IPv4 private ranges
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const octets = parts.map(Number);
    // 10.0.0.0/8
    if (octets[0] === 10) return true;
    // 172.16.0.0/12 (172.16.x.x – 172.31.x.x)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (octets[0] === 169 && octets[1] === 254) return true;
  }
  return false;
}

/**
 * Returns true if the URL is safe to scan (not localhost or private network).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTS.includes(hostname)) {
      return false;
    }
    if (isPrivateIP(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch and parse a sitemap URL. Handles nested sitemaps automatically.
 * Retries once on failure after a 5-second delay.
 * Filters out unsafe URLs and warns about them.
 */
export async function fetchSitemap(sitemapUrl: string): Promise<{
  urls: string[];
  unsafeSkipped: string[];
}> {
  const sitemap = new Sitemapper({
    url: sitemapUrl,
    timeout: 15000,
  });

  let sites: string[];

  try {
    const result = await sitemap.fetch();
    sites = result.sites;
  } catch (firstError) {
    // Retry once after 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const result = await sitemap.fetch();
      sites = result.sites;
    } catch {
      throw new Error(
        `Failed to fetch sitemap from ${sitemapUrl} after retry. ` +
          `Please verify the URL is correct and the sitemap is accessible. ` +
          `Original error: ${firstError instanceof Error ? firstError.message : String(firstError)}`
      );
    }
  }

  const urls: string[] = [];
  const unsafeSkipped: string[] = [];

  for (const url of sites) {
    if (isSafeUrl(url)) {
      urls.push(url);
    } else {
      unsafeSkipped.push(url);
    }
  }

  return { urls, unsafeSkipped };
}
