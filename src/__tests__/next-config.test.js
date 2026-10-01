import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config.mjs';

describe('Next.js Configuration for SEO', () => {
  it('should have image optimization configured', () => {
    expect(nextConfig.images).toBeDefined();
    expect(nextConfig.images.formats).toContain('image/avif');
    expect(nextConfig.images.formats).toContain('image/webp');
  });

  it('should have proper device sizes for responsive images', () => {
    expect(nextConfig.images.deviceSizes).toBeDefined();
    expect(nextConfig.images.deviceSizes.length).toBeGreaterThan(0);
  });

  it('should have compression enabled', () => {
    expect(nextConfig.compress).toBe(true);
  });

  it('should have ETags generation enabled', () => {
    expect(nextConfig.generateEtags).toBe(true);
  });

  it('should have powered by header disabled for security', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('should have minimum cache TTL configured', () => {
    expect(nextConfig.images.minimumCacheTTL).toBeDefined();
    expect(nextConfig.images.minimumCacheTTL).toBeGreaterThan(0);
  });
});

// Head Office moved into the PMS (2026-10-01): /hq and, before it, /admin.
describe('Old Head Office addresses', () => {
  // The first rule that matches, as Next.js applies them (in order).
  const destinationOf = async (path) => {
    for (const rule of await nextConfig.redirects()) {
      const pattern = new RegExp(`^${rule.source.replace(':path*', '(.*)')}$`);
      const match = path.match(pattern);
      if (match) return rule.destination.replace(':path*', match[1] ?? '');
    }
    return null;
  };

  it('land on the same page in the PMS, renamed pages included', async () => {
    for (const from of ['/hq', '/admin']) {
      expect(await destinationOf(from)).toBe('/pms');
      expect(await destinationOf(`${from}/critical`)).toBe('/pms/critical');
      expect(await destinationOf(`${from}/decision-support`)).toBe('/pms/decision-support');
      expect(await destinationOf(`${from}/metrics`)).toBe('/pms/metrics');
      expect(await destinationOf(`${from}/staff`)).toBe('/pms/staff-accounts');
      expect(await destinationOf(`${from}/audit-logs`)).toBe('/pms/audit-trail');
      expect(await destinationOf(`${from}/account`)).toBe('/pms/account');
    }
  });

  it('are never permanent, so the old paths stay free for later', async () => {
    expect((await nextConfig.redirects()).every((rule) => rule.permanent === false)).toBe(true);
  });
});
