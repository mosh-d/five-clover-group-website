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
