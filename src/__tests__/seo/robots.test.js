import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

describe('Robots.txt Configuration', () => {
  it('should return valid robots configuration', () => {
    const config = robots();

    expect(config).toBeDefined();
    expect(config.rules).toBeDefined();
    expect(config.sitemap).toBeDefined();
  });

  it('should allow all user agents', () => {
    const config = robots();

    expect(config.rules.userAgent).toBe('*');
  });

  it('should allow crawling of main site', () => {
    const config = robots();

    expect(config.rules.allow).toBe('/');
  });

  it('should disallow crawling of API routes', () => {
    const config = robots();

    expect(config.rules.disallow).toBeDefined();
    expect(Array.isArray(config.rules.disallow)).toBe(true);
    expect(config.rules.disallow).toContain('/api/');
  });

  it('should include sitemap URL', () => {
    const config = robots();

    expect(config.sitemap).toBeDefined();
    expect(config.sitemap).toMatch(/^https:\/\//);
    expect(config.sitemap).toContain('sitemap.xml');
  });

  it('should use correct domain in sitemap URL', () => {
    const config = robots();

    expect(config.sitemap).toBe('https://fivecloverhotels.com/sitemap.xml');
  });

  it('should have proper structure for Next.js robots.txt generation', () => {
    const config = robots();

    // Next.js expects this specific structure
    expect(config).toHaveProperty('rules');
    expect(config).toHaveProperty('sitemap');
    expect(config.rules).toHaveProperty('userAgent');
    expect(config.rules).toHaveProperty('allow');
    expect(config.rules).toHaveProperty('disallow');
  });
});
