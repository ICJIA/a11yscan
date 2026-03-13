import { describe, it, expect } from 'vitest';
import { isSafeUrl } from './fetcher.js';

describe('isSafeUrl', () => {
  // Should block
  it('blocks localhost', () => {
    expect(isSafeUrl('http://localhost/page')).toBe(false);
    expect(isSafeUrl('https://localhost:3000/')).toBe(false);
  });

  it('blocks 127.0.0.1', () => {
    expect(isSafeUrl('http://127.0.0.1/')).toBe(false);
    expect(isSafeUrl('https://127.0.0.1:8080/path')).toBe(false);
  });

  it('blocks 0.0.0.0', () => {
    expect(isSafeUrl('http://0.0.0.0/')).toBe(false);
  });

  it('blocks ::1 (IPv6 loopback)', () => {
    expect(isSafeUrl('http://[::1]/')).toBe(false);
  });

  it('blocks 10.x.x.x (RFC1918)', () => {
    expect(isSafeUrl('http://10.0.0.1/')).toBe(false);
    expect(isSafeUrl('http://10.255.255.255/')).toBe(false);
  });

  it('blocks 172.16-31.x.x (RFC1918)', () => {
    expect(isSafeUrl('http://172.16.0.1/')).toBe(false);
    expect(isSafeUrl('http://172.31.255.255/')).toBe(false);
  });

  it('does not block 172.15.x.x or 172.32.x.x', () => {
    expect(isSafeUrl('http://172.15.0.1/')).toBe(true);
    expect(isSafeUrl('http://172.32.0.1/')).toBe(true);
  });

  it('blocks 192.168.x.x (RFC1918)', () => {
    expect(isSafeUrl('http://192.168.1.1/')).toBe(false);
    expect(isSafeUrl('http://192.168.0.100/')).toBe(false);
  });

  it('blocks 169.254.x.x (link-local)', () => {
    expect(isSafeUrl('http://169.254.1.1/')).toBe(false);
  });

  it('blocks non-http/https protocols', () => {
    expect(isSafeUrl('ftp://example.com/')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
  });

  it('blocks invalid URLs', () => {
    expect(isSafeUrl('not-a-url')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });

  // Should allow
  it('allows valid public https URLs', () => {
    expect(isSafeUrl('https://example.com/')).toBe(true);
    expect(isSafeUrl('https://www.w3.org/WAI/demos/')).toBe(true);
  });

  it('allows valid public http URLs', () => {
    expect(isSafeUrl('http://example.com/page')).toBe(true);
  });

  it('allows public IP addresses', () => {
    expect(isSafeUrl('http://93.184.216.34/')).toBe(true);
  });
});
