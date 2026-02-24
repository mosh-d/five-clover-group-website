import { describe, it, expect } from 'vitest';
import { metadata } from '@/app/layout';

describe('Root Layout Metadata', () => {
  it('should have verification object in metadata', () => {
    expect(metadata.verification).toBeDefined();
    expect(typeof metadata.verification).toBe('object');
  });

  it('should have google verification field that reads from environment variable', () => {
    // The verification.google field should be present and read from env var
    // It will be undefined in test environment if not set, but the structure should exist
    expect(metadata.verification).toHaveProperty('google');
  });

  it('should include all required SEO metadata fields', () => {
    expect(metadata.metadataBase).toBeDefined();
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.twitter).toBeDefined();
    expect(metadata.robots).toBeDefined();
    expect(metadata.alternates).toBeDefined();
    expect(metadata.verification).toBeDefined();
  });

  it('should have proper robots configuration', () => {
    expect(metadata.robots.index).toBe(true);
    expect(metadata.robots.follow).toBe(true);
    expect(metadata.robots.googleBot).toBeDefined();
    expect(metadata.robots.googleBot.index).toBe(true);
    expect(metadata.robots.googleBot.follow).toBe(true);
  });

  it('should have canonical URL configured', () => {
    expect(metadata.alternates.canonical).toBeDefined();
    expect(typeof metadata.alternates.canonical).toBe('string');
  });

  it('should have proper Open Graph configuration', () => {
    expect(metadata.openGraph.type).toBe('website');
    expect(metadata.openGraph.siteName).toBeDefined();
    expect(metadata.openGraph.images).toBeDefined();
    expect(Array.isArray(metadata.openGraph.images)).toBe(true);
  });

  it('should have proper Twitter Card configuration', () => {
    expect(metadata.twitter.card).toBe('summary_large_image');
    expect(metadata.twitter.site).toBeDefined();
    expect(metadata.twitter.creator).toBeDefined();
  });
});
