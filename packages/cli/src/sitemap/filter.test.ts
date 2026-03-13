import { describe, it, expect } from 'vitest';
import { filterUrls } from './filter.js';

const BASE = 'https://example.com';

function urls(...paths: string[]): string[] {
  return paths.map((p) => `${BASE}${p}`);
}

describe('filterUrls', () => {
  describe('prefix filter (--filter)', () => {
    it('keeps only URLs matching the path prefix', () => {
      const input = urls('/research/a', '/research/b', '/news/c', '/about');
      const result = filterUrls(input, { filter: '/research' });
      expect(result).toEqual(urls('/research/a', '/research/b'));
    });

    it('returns all URLs when no filter is provided', () => {
      const input = urls('/a', '/b', '/c');
      const result = filterUrls(input, {});
      expect(result).toEqual(input);
    });
  });

  describe('glob filter (--filter-glob)', () => {
    it('matches glob patterns on pathnames', () => {
      const input = urls('/en/services/health', '/es/services/edu', '/en/about', '/news');
      const result = filterUrls(input, { filterGlob: '/*/services/**' });
      expect(result).toEqual(urls('/en/services/health', '/es/services/edu'));
    });

    it('supports simple wildcard patterns', () => {
      const input = urls('/research/2024/report', '/research/2023/report', '/research/overview');
      const result = filterUrls(input, { filterGlob: '/research/*/report' });
      expect(result).toEqual(urls('/research/2024/report', '/research/2023/report'));
    });
  });

  describe('combined filter + filterGlob (AND logic)', () => {
    it('requires URL to match BOTH filter and filterGlob', () => {
      const input = urls('/research/2024/report', '/research/overview', '/news/2024/report');
      const result = filterUrls(input, {
        filter: '/research',
        filterGlob: '/research/*/report',
      });
      expect(result).toEqual(urls('/research/2024/report'));
    });
  });

  describe('exclude', () => {
    it('removes URLs matching any exclude prefix', () => {
      const input = urls('/research/a', '/research/archive/x', '/research/old/y');
      const result = filterUrls(input, {
        filter: '/research',
        exclude: ['/research/archive', '/research/old'],
      });
      expect(result).toEqual(urls('/research/a'));
    });

    it('handles whitespace-trimmed exclude values', () => {
      // The CLI layer trims whitespace; filter.ts receives already-trimmed arrays
      const excludeRaw = ' /research/archive , /research/old ';
      const exclude = excludeRaw.split(',').map((e) => e.trim());
      const input = urls('/research/a', '/research/archive/x');
      const result = filterUrls(input, { exclude });
      expect(result).toEqual(urls('/research/a'));
    });
  });

  describe('depth', () => {
    it('excludes URLs deeper than the specified depth', () => {
      const input = urls('/', '/a', '/a/b', '/a/b/c', '/a/b/c/d');
      const result = filterUrls(input, { depth: 2 });
      expect(result).toEqual(urls('/', '/a', '/a/b'));
    });

    it('root path has depth 0', () => {
      const input = urls('/');
      const result = filterUrls(input, { depth: 0 });
      expect(result).toEqual(urls('/'));
    });
  });

  describe('limit', () => {
    it('slices result after all other filters', () => {
      const input = urls('/a', '/b', '/c', '/d', '/e');
      const result = filterUrls(input, { limit: 3 });
      expect(result).toEqual(urls('/a', '/b', '/c'));
    });
  });

  describe('combined filters', () => {
    it('applies all filters in correct order', () => {
      const input = urls(
        '/research/a',
        '/research/archive/x',
        '/research/b',
        '/research/c/d/e/f',
        '/news/a'
      );
      const result = filterUrls(input, {
        filter: '/research',
        exclude: ['/research/archive'],
        depth: 3,
        limit: 2,
      });
      // After filter: /research/a, /research/archive/x, /research/b, /research/c/d/e/f
      // After exclude: /research/a, /research/b, /research/c/d/e/f
      // After depth 3: /research/a, /research/b (c/d/e/f is depth 4)
      // After limit 2: /research/a, /research/b
      expect(result).toEqual(urls('/research/a', '/research/b'));
    });
  });
});
