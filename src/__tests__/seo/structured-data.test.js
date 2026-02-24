import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateHotelSchema,
  generateAllHotelsSchema,
  generateArticleSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/structured-data';
import { HOTELS } from '@/lib/seo/constants';

describe('Structured Data Generation', () => {
  describe('Organization Schema', () => {
    it('should generate valid Organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBeDefined();
      expect(schema.url).toBeDefined();
      expect(schema.logo).toBeDefined();
      expect(schema.description).toBeDefined();
    });

    it('should include contact information', () => {
      const schema = generateOrganizationSchema();

      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.telephone).toBeDefined();
      expect(schema.contactPoint.contactType).toBeDefined();
    });

    it('should include address information', () => {
      const schema = generateOrganizationSchema();

      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.addressCountry).toBe('NG');
      expect(schema.address.addressLocality).toBeDefined();
    });

    it('should include social media profiles', () => {
      const schema = generateOrganizationSchema();

      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.sameAs)).toBe(true);
      expect(schema.sameAs.length).toBeGreaterThan(0);
    });
  });

  describe('Hotel Schema', () => {
    it('should generate valid Hotel schema for a single hotel', () => {
      const hotel = HOTELS[0];
      const schema = generateHotelSchema(hotel);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Hotel');
      expect(schema.name).toBe(hotel.name);
      expect(schema.description).toBeDefined();
    });

    it('should include address information', () => {
      const hotel = HOTELS[0];
      const schema = generateHotelSchema(hotel);

      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.streetAddress).toBeDefined();
      expect(schema.address.addressLocality).toBe('Lagos');
      expect(schema.address.addressCountry).toBe('NG');
    });

    it('should include contact and pricing information', () => {
      const hotel = HOTELS[0];
      const schema = generateHotelSchema(hotel);

      expect(schema.telephone).toBeDefined();
      expect(schema.priceRange).toBeDefined();
    });

    it('should include rating if available', () => {
      const hotel = HOTELS[0];
      const schema = generateHotelSchema(hotel);

      if (hotel.rating) {
        expect(schema.starRating).toBeDefined();
        expect(schema.starRating['@type']).toBe('Rating');
        expect(schema.starRating.ratingValue).toBeDefined();
      }
    });
  });

  describe('All Hotels Schema', () => {
    it('should generate schema for all hotels', () => {
      const schemas = generateAllHotelsSchema();

      expect(Array.isArray(schemas)).toBe(true);
      expect(schemas.length).toBe(HOTELS.length);
    });

    it('should have valid schema for each hotel', () => {
      const schemas = generateAllHotelsSchema();

      schemas.forEach((schema) => {
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBe('Hotel');
        expect(schema.name).toBeDefined();
        expect(schema.address).toBeDefined();
      });
    });
  });

  describe('Article Schema', () => {
    const mockArticle = {
      title: 'Test Blog Post',
      brief: 'This is a test blog post description',
      coverImage: { url: 'https://example.com/image.jpg' },
      publishedAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T12:00:00Z',
      author: { name: 'Test Author' },
    };

    it('should generate valid Article schema', () => {
      const schema = generateArticleSchema(mockArticle);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe(mockArticle.title);
      expect(schema.description).toBe(mockArticle.brief);
    });

    it('should include publication dates', () => {
      const schema = generateArticleSchema(mockArticle);

      expect(schema.datePublished).toBe(mockArticle.publishedAt);
      expect(schema.dateModified).toBe(mockArticle.updatedAt);
    });

    it('should use publishedAt as dateModified if updatedAt is missing', () => {
      const articleWithoutUpdate = { ...mockArticle, updatedAt: null };
      const schema = generateArticleSchema(articleWithoutUpdate);

      expect(schema.dateModified).toBe(mockArticle.publishedAt);
    });

    it('should include author information', () => {
      const schema = generateArticleSchema(mockArticle);

      expect(schema.author).toBeDefined();
      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBe(mockArticle.author.name);
    });

    it('should include publisher information', () => {
      const schema = generateArticleSchema(mockArticle);

      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.name).toBeDefined();
      expect(schema.publisher.logo).toBeDefined();
      expect(schema.publisher.logo['@type']).toBe('ImageObject');
    });

    it('should include image if available', () => {
      const schema = generateArticleSchema(mockArticle);

      expect(schema.image).toBe(mockArticle.coverImage.url);
    });
  });

  describe('Breadcrumb Schema', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
      ];
      const schema = generateBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toBeDefined();
      expect(Array.isArray(schema.itemListElement)).toBe(true);
    });

    it('should have correct position for each item', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: 'Post', url: '/blog/post' },
      ];
      const schema = generateBreadcrumbSchema(items);

      schema.itemListElement.forEach((item, index) => {
        expect(item['@type']).toBe('ListItem');
        expect(item.position).toBe(index + 1);
        expect(item.name).toBe(items[index].name);
        // URLs are converted to absolute URLs
        expect(item.item).toContain(items[index].url);
        expect(item.item).toMatch(/^https:\/\//);
      });
    });

    it('should handle single item breadcrumb', () => {
      const items = [{ name: 'Home', url: '/' }];
      const schema = generateBreadcrumbSchema(items);

      expect(schema.itemListElement).toHaveLength(1);
      expect(schema.itemListElement[0].position).toBe(1);
    });
  });

  describe('Schema Validation', () => {
    it('should generate valid JSON-LD that can be stringified', () => {
      const orgSchema = generateOrganizationSchema();
      const hotelSchema = generateHotelSchema(HOTELS[0]);
      const breadcrumbSchema = generateBreadcrumbSchema([{ name: 'Home', url: '/' }]);

      expect(() => JSON.stringify(orgSchema)).not.toThrow();
      expect(() => JSON.stringify(hotelSchema)).not.toThrow();
      expect(() => JSON.stringify(breadcrumbSchema)).not.toThrow();
    });

    it('should not have undefined values in required fields', () => {
      const orgSchema = generateOrganizationSchema();

      expect(orgSchema.name).not.toBeUndefined();
      expect(orgSchema.url).not.toBeUndefined();
      expect(orgSchema['@context']).not.toBeUndefined();
      expect(orgSchema['@type']).not.toBeUndefined();
    });
  });
});
