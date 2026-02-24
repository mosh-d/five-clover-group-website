import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from './sitemap';
import * as hashnodeModule from '@/lib/hashnode';

// Mock the hashnode module
vi.mock('@/lib/hashnode', () => ({
  fetchHashnodeBlogs: vi.fn(),
}));

describe('Sitemap Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include static pages with correct properties', async () => {
    // Mock empty blog response
    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockResolvedValue([]);

    const result = await sitemap();

    // Should have 4 static pages
    expect(result).toHaveLength(4);

    // Check homepage
    const homepage = result.find(entry => entry.url === 'https://fivecloverhotels.com');
    expect(homepage).toBeDefined();
    expect(homepage.changeFrequency).toBe('daily');
    expect(homepage.priority).toBe(1.0);
    expect(homepage.lastModified).toBeInstanceOf(Date);

    // Check about page
    const aboutPage = result.find(entry => entry.url === 'https://fivecloverhotels.com/about');
    expect(aboutPage).toBeDefined();
    expect(aboutPage.changeFrequency).toBe('monthly');
    expect(aboutPage.priority).toBe(0.7);
    expect(aboutPage.lastModified).toBeInstanceOf(Date);

    // Check contact page
    const contactPage = result.find(entry => entry.url === 'https://fivecloverhotels.com/contact');
    expect(contactPage).toBeDefined();
    expect(contactPage.changeFrequency).toBe('monthly');
    expect(contactPage.priority).toBe(0.7);
    expect(contactPage.lastModified).toBeInstanceOf(Date);

    // Check blog listing page
    const blogPage = result.find(entry => entry.url === 'https://fivecloverhotels.com/blog');
    expect(blogPage).toBeDefined();
    expect(blogPage.changeFrequency).toBe('daily');
    expect(blogPage.priority).toBe(0.8);
    expect(blogPage.lastModified).toBeInstanceOf(Date);
  });

  it('should include blog posts from Hashnode', async () => {
    const mockBlogs = [
      {
        slug: 'test-blog-1',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T12:00:00Z',
      },
      {
        slug: 'test-blog-2',
        publishedAt: '2024-01-20T10:00:00Z',
        updatedAt: null,
      },
    ];

    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockResolvedValue(mockBlogs);

    const result = await sitemap();

    // Should have 4 static pages + 2 blog posts
    expect(result).toHaveLength(6);

    // Check first blog post
    const blog1 = result.find(entry => entry.url === 'https://fivecloverhotels.com/blog/test-blog-1');
    expect(blog1).toBeDefined();
    expect(blog1.changeFrequency).toBe('weekly');
    expect(blog1.priority).toBe(0.6);
    expect(blog1.lastModified).toEqual(new Date('2024-01-16T12:00:00Z'));

    // Check second blog post (uses publishedAt when updatedAt is null)
    const blog2 = result.find(entry => entry.url === 'https://fivecloverhotels.com/blog/test-blog-2');
    expect(blog2).toBeDefined();
    expect(blog2.lastModified).toEqual(new Date('2024-01-20T10:00:00Z'));
  });

  it('should handle API errors gracefully and return static pages', async () => {
    // Mock API error
    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockRejectedValue(new Error('API Error'));

    const result = await sitemap();

    // Should still return static pages
    expect(result).toHaveLength(4);
    expect(result.find(entry => entry.url === 'https://fivecloverhotels.com')).toBeDefined();
    expect(result.find(entry => entry.url === 'https://fivecloverhotels.com/about')).toBeDefined();
    expect(result.find(entry => entry.url === 'https://fivecloverhotels.com/contact')).toBeDefined();
    expect(result.find(entry => entry.url === 'https://fivecloverhotels.com/blog')).toBeDefined();
  });

  it('should have correct URL structure for all entries', async () => {
    const mockBlogs = [
      {
        slug: 'sample-blog',
        publishedAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockResolvedValue(mockBlogs);

    const result = await sitemap();

    // All URLs should start with base URL
    result.forEach(entry => {
      expect(entry.url).toMatch(/^https:\/\/fivecloverhotels\.com/);
    });

    // Blog post URLs should have correct format
    const blogEntry = result.find(entry => entry.url.includes('/blog/sample-blog'));
    expect(blogEntry).toBeDefined();
    expect(blogEntry.url).toBe('https://fivecloverhotels.com/blog/sample-blog');
  });

  it('should have required sitemap properties for all entries', async () => {
    const mockBlogs = [
      {
        slug: 'test-blog',
        publishedAt: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockResolvedValue(mockBlogs);

    const result = await sitemap();

    // Every entry should have required properties
    result.forEach(entry => {
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('lastModified');
      expect(entry).toHaveProperty('changeFrequency');
      expect(entry).toHaveProperty('priority');
      
      // Validate types
      expect(typeof entry.url).toBe('string');
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(typeof entry.changeFrequency).toBe('string');
      expect(typeof entry.priority).toBe('number');
    });
  });

  it('should fetch up to 100 blog posts', async () => {
    vi.mocked(hashnodeModule.fetchHashnodeBlogs).mockResolvedValue([]);

    await sitemap();

    expect(hashnodeModule.fetchHashnodeBlogs).toHaveBeenCalledWith(100);
  });
});
