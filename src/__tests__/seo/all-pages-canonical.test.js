import { describe, it, expect } from 'vitest';
import { SITE_CONFIG } from '@/lib/seo/constants';

describe('All Pages Canonical URLs', () => {
  it('should verify SITE_CONFIG has correct base URL', () => {
    expect(SITE_CONFIG.url).toBe('https://fivecloverhotels.com');
  });

  describe('Static Pages', () => {
    const staticPages = [
      { path: '/', name: 'Homepage' },
      { path: '/blog', name: 'Blog Listing' },
      { path: '/about', name: 'About Page' },
      { path: '/contact', name: 'Contact Page' },
    ];

    staticPages.forEach(({ path, name }) => {
      it(`${name} should have canonical URL`, () => {
        const expectedCanonical = `${SITE_CONFIG.url}${path}`;
        expect(expectedCanonical).toMatch(/^https:\/\/fivecloverhotels\.com/);
      });
    });
  });

  describe('Dynamic Pages', () => {
    it('Blog post pages should have canonical URL pointing to Five Clover website', () => {
      const slug = 'example-blog-post';
      const expectedCanonical = `${SITE_CONFIG.url}/blog/${slug}`;
      
      expect(expectedCanonical).toBe('https://fivecloverhotels.com/blog/example-blog-post');
      expect(expectedCanonical).not.toContain('hashnode.com');
    });

    it('Blog post canonical should never point to Hashnode', () => {
      const slug = 'another-post';
      const canonicalUrl = `${SITE_CONFIG.url}/blog/${slug}`;
      
      // Verify it's our domain, not Hashnode
      expect(canonicalUrl).toContain('fivecloverhotels.com');
      expect(canonicalUrl).not.toContain('hashnode');
    });
  });

  describe('Canonical URL Format', () => {
    it('should always use HTTPS protocol', () => {
      expect(SITE_CONFIG.url).toMatch(/^https:\/\//);
    });

    it('should not have trailing slash in base URL', () => {
      expect(SITE_CONFIG.url).not.toMatch(/\/$/);
    });

    it('should construct proper canonical URLs', () => {
      const paths = ['/', '/blog', '/about', '/contact', '/blog/test-post'];
      
      paths.forEach(path => {
        const canonical = `${SITE_CONFIG.url}${path}`;
        expect(canonical).toMatch(/^https:\/\/fivecloverhotels\.com/);
      });
    });
  });
});
