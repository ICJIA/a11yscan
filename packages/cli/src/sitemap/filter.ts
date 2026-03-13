/**
 * URL filter engine — prefix, glob, exclude, depth, and limit filtering.
 */

import picomatch from 'picomatch';

export interface FilterOptions {
  filter?: string;
  filterGlob?: string;
  exclude?: string[];
  depth?: number;
  limit?: number;
}

/**
 * Count the path depth (number of non-empty segments).
 * "/" = 0, "/a" = 1, "/a/b" = 2, "/a/b/c" = 3
 */
function getPathDepth(pathname: string): number {
  return pathname.split('/').filter((s) => s.length > 0).length;
}

/**
 * Filter a list of URLs based on the provided options.
 *
 * Filter order:
 * 1. Prefix filter (--filter): pathname must startsWith
 * 2. Glob filter (--filter-glob): pathname must match glob via picomatch
 * 3. Exclude (--exclude): drop URLs where pathname startsWith any exclude item
 * 4. Depth (--depth): drop URLs with more path segments than depth
 * 5. Limit (--limit): slice to max count after all other filters
 *
 * If both filter and filterGlob are provided, URL must match BOTH (AND logic).
 */
export function filterUrls(urls: string[], options: FilterOptions): string[] {
  let result = [...urls];

  // 1. Prefix filter
  if (options.filter) {
    const prefix = options.filter;
    result = result.filter((url) => {
      try {
        const pathname = new URL(url).pathname;
        return pathname.startsWith(prefix);
      } catch {
        return false;
      }
    });
  }

  // 2. Glob filter
  if (options.filterGlob) {
    const isMatch = picomatch(options.filterGlob);
    result = result.filter((url) => {
      try {
        const pathname = new URL(url).pathname;
        return isMatch(pathname);
      } catch {
        return false;
      }
    });
  }

  // 3. Exclude
  if (options.exclude && options.exclude.length > 0) {
    result = result.filter((url) => {
      try {
        const pathname = new URL(url).pathname;
        return !options.exclude!.some((exc) => pathname.startsWith(exc));
      } catch {
        return false;
      }
    });
  }

  // 4. Depth
  if (options.depth !== undefined) {
    result = result.filter((url) => {
      try {
        const pathname = new URL(url).pathname;
        return getPathDepth(pathname) <= options.depth!;
      } catch {
        return false;
      }
    });
  }

  // 5. Limit
  if (options.limit !== undefined && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}
