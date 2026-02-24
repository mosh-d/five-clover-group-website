import { describe, it, expect } from 'vitest';
import { generatePageMetadata, generateArticleMetadata } from '@/lib/seo/metadata';
import { SITE_CONFIG } from '@/lib/seo/constants';

describe('Canonical URLs', () => {
  describe('generatePageMetadata', () => {
    it('should include canonical URL for homepage', () => {
      const metadata = generatePageMetadata({
        title: 'Home',
        description: 'Homepage description',
        path: '/',
      });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/`);
    });

    it('should include canonical URL for blog listing', () => {
      const metadata = generatePageMetadata({
        title: 'Blog',
        description: 'Blog listing',
        path: '/blog',
      });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/blog`);
    });

    it('should include canonical URL for any page', () => {
      const metadata = generatePageMetadata({
        title: 'About',
        description: 'About page',
        path: '/about',
      });

      expect(metadata.alternates.canonical).toBe(`${SITE_CONFIG.url}/about`);
    });
  });

  describe('generateArticleMetadata', () => {
    it('should include canonical URL pointing to Five Clover website', () => {
      const article = {
        title: 'Test Blog Post',
        brief: 'Test description',
        slug: 'test-blog-post',
        publishedAt: '2024-01-01',
        coverImage: {
          url: 'https://cdn.hashnode.com/res/hashnode/image/test.jpg',
        },
        author: {
          name: 'Test Author',
        },
      };

      const metadata = generateArticleMetadata(article);

      expect(metadata.alternates.canonical).toBe(
        `${SITE_CONFIG.url}/blog/test-blog-post`
      );
      // Ensure it's not pointing to Hashnode
      expect(metadata.alternates.canonical).not.toContain('hashnode.com');
    });

    it('should use Five Clover domain for canonical URL, not Hashnode', () => {
      const article = {
        title: 'Another Post',
        brief: 'Another description',
        slug: 'another-post',
        publishedAt: '2024-01-02',
      };

      const metadata = generateArticleMetadata(article);

      expect(metadata.alternates.canonical).toMatch(/^https:\/\/fivecloverhotels\.com/);
      expect(metadata.alternates.canonical).toBe(
        'https://fivecloverhotels.com/blog/another-post'
      );
    });
  });

  describe('Canonical URL consistency', () => {
    it('should always use HTTPS protocol', () => {
      const metadata = generatePageMetadata({
        title: 'Test',
        description: 'Test',
        path: '/test',
      });

      expect(metadata.alternates.canonical).toMatch(/^https:\/\//);
    });

    it('should use consistent domain from SITE_CONFIG', () => {
      const metadata1 = generatePageMetadata({
        title: 'Page 1',
        description: 'Description 1',
        path: '/page1',
      });

      const metadata2 = generateArticleMetadata({
        title: 'Article',
        brief: 'Brief',
        slug: 'article',
        publishedAt: '2024-01-01',
      });

      const domain = SITE_CONFIG.url;
      expect(metadata1.alternates.canonical).toContain(domain);
      expect(metadata2.alternates.canonical).toContain(domain);
    });
  });
});
