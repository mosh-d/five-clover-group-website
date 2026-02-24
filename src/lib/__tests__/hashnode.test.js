import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHashnodeBlogs, fetchBlogPost } from '../hashnode';

// Mock global fetch
global.fetch = vi.fn();

describe('Hashnode API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchHashnodeBlogs', () => {
    it('should fetch and return blog posts successfully', async () => {
      const mockResponse = {
        data: {
          publication: {
            title: 'Five Clover Hotels Blog',
            posts: {
              totalDocuments: 2,
              edges: [
                {
                  node: {
                    title: 'Test Blog 1',
                    brief: 'This is a test blog',
                    slug: 'test-blog-1',
                    publishedAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-02T00:00:00Z',
                    coverImage: {
                      url: 'https://example.com/image1.jpg',
                    },
                    author: {
                      name: 'John Doe',
                    },
                  },
                },
                {
                  node: {
                    title: 'Test Blog 2',
                    brief: 'Another test blog',
                    slug: 'test-blog-2',
                    publishedAt: '2024-01-03T00:00:00Z',
                    updatedAt: '2024-01-04T00:00:00Z',
                    coverImage: {
                      url: 'https://example.com/image2.jpg',
                    },
                    author: {
                      name: 'Jane Smith',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchHashnodeBlogs();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        title: 'Test Blog 1',
        brief: 'This is a test blog',
        caption: 'This is a test blog',
        slug: 'test-blog-1',
        publishedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        coverImage: {
          url: 'https://example.com/image1.jpg',
        },
        image: 'https://example.com/image1.jpg',
        author: {
          name: 'John Doe',
        },
      });
    });

    it('should handle missing cover image gracefully', async () => {
      const mockResponse = {
        data: {
          publication: {
            posts: {
              edges: [
                {
                  node: {
                    title: 'Test Blog',
                    brief: 'Test',
                    slug: 'test',
                    publishedAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                    coverImage: null,
                    author: {
                      name: 'Author',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchHashnodeBlogs();

      expect(result[0].image).toBeNull();
      expect(result[0].coverImage).toBeNull();
    });

    it('should return empty array when API request fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await fetchHashnodeBlogs();

      expect(result).toEqual([]);
    });

    it('should return empty array when GraphQL returns errors', async () => {
      const mockResponse = {
        errors: [
          {
            message: 'GraphQL error',
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchHashnodeBlogs();

      expect(result).toEqual([]);
    });

    it('should return empty array when publication data is missing', async () => {
      const mockResponse = {
        data: {},
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchHashnodeBlogs();

      expect(result).toEqual([]);
    });

    it('should return empty array when fetch throws an error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchHashnodeBlogs();

      expect(result).toEqual([]);
    });

    it('should accept custom number of posts to fetch', async () => {
      const mockResponse = {
        data: {
          publication: {
            posts: {
              edges: [],
            },
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchHashnodeBlogs(20);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"first":20'),
        })
      );
    });
  });

  describe('fetchBlogPost', () => {
    it('should fetch and return a single blog post successfully', async () => {
      const mockResponse = {
        data: {
          publication: {
            post: {
              title: 'Test Blog Post',
              brief: 'This is a test',
              slug: 'test-blog-post',
              publishedAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
              content: {
                html: '<p>Test content</p>',
                markdown: 'Test content',
              },
              coverImage: {
                url: 'https://example.com/image.jpg',
              },
              author: {
                name: 'John Doe',
                profilePicture: 'https://example.com/avatar.jpg',
              },
              tags: [
                {
                  name: 'Travel',
                  slug: 'travel',
                },
              ],
            },
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchBlogPost('test-blog-post');

      expect(result).toEqual(mockResponse.data.publication.post);
      expect(result.title).toBe('Test Blog Post');
      expect(result.content.html).toBe('<p>Test content</p>');
    });

    it('should return null when slug is not provided', async () => {
      const result = await fetchBlogPost('');

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null when API request fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchBlogPost('non-existent-slug');

      expect(result).toBeNull();
    });

    it('should return null when GraphQL returns errors', async () => {
      const mockResponse = {
        errors: [
          {
            message: 'Post not found',
          },
        ],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchBlogPost('test-slug');

      expect(result).toBeNull();
    });

    it('should return null when post is not found', async () => {
      const mockResponse = {
        data: {
          publication: {
            post: null,
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchBlogPost('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when fetch throws an error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchBlogPost('test-slug');

      expect(result).toBeNull();
    });

    it('should include revalidation in fetch options', async () => {
      const mockResponse = {
        data: {
          publication: {
            post: {
              title: 'Test',
              slug: 'test',
            },
          },
        },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await fetchBlogPost('test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://gql.hashnode.com',
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
    });
  });
});
