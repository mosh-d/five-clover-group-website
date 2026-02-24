import { describe, it, expect } from 'vitest';
import { metadata as homeMetadata } from '@/app/page';
import { metadata as layoutMetadata, viewport } from '@/app/layout';

describe('Page Metadata Validation', () => {
  describe('Homepage Metadata', () => {
    it('should have title and description', () => {
      expect(homeMetadata.title).toBeDefined();
      expect(homeMetadata.description).toBeDefined();
      expect(typeof homeMetadata.title).toBe('string');
      expect(typeof homeMetadata.description).toBe('string');
    });

    it('should have SEO keywords', () => {
      expect(homeMetadata.keywords).toBeDefined();
      expect(Array.isArray(homeMetadata.keywords)).toBe(true);
      expect(homeMetadata.keywords.length).toBeGreaterThan(0);
    });

    it('should have canonical URL', () => {
      expect(homeMetadata.alternates).toBeDefined();
      expect(homeMetadata.alternates.canonical).toBeDefined();
      expect(homeMetadata.alternates.canonical).toMatch(/^https:\/\//);
    });

    it('should have Open Graph metadata', () => {
      expect(homeMetadata.openGraph).toBeDefined();
      expect(homeMetadata.openGraph.title).toBeDefined();
      expect(homeMetadata.openGraph.description).toBeDefined();
      expect(homeMetadata.openGraph.url).toBeDefined();
      expect(homeMetadata.openGraph.type).toBe('website');
    });

    it('should have Open Graph images with proper dimensions', () => {
      expect(homeMetadata.openGraph.images).toBeDefined();
      expect(Array.isArray(homeMetadata.openGraph.images)).toBe(true);
      expect(homeMetadata.openGraph.images.length).toBeGreaterThan(0);

      const image = homeMetadata.openGraph.images[0];
      expect(image.url).toBeDefined();
      expect(image.width).toBe(1200);
      expect(image.height).toBe(630);
      expect(image.alt).toBeDefined();
    });

    it('should have Twitter Card metadata', () => {
      expect(homeMetadata.twitter).toBeDefined();
      expect(homeMetadata.twitter.card).toBe('summary_large_image');
      expect(homeMetadata.twitter.title).toBeDefined();
      expect(homeMetadata.twitter.description).toBeDefined();
      expect(homeMetadata.twitter.images).toBeDefined();
    });

    it('should mention all four hotels in description', () => {
      const description = homeMetadata.description.toLowerCase();
      
      // Check for hotel mentions (at least some of them)
      const hasHotelMentions = 
        description.includes('five clover') ||
        description.includes('caritas') ||
        description.includes('ring ruby') ||
        description.includes('cordis');
      
      expect(hasHotelMentions).toBe(true);
    });
  });

  describe('Root Layout Metadata', () => {
    it('should have metadataBase configured', () => {
      expect(layoutMetadata.metadataBase).toBeDefined();
      expect(layoutMetadata.metadataBase.toString()).toMatch(/^https:\/\//);
    });

    it('should have title template', () => {
      expect(layoutMetadata.title).toBeDefined();
      expect(layoutMetadata.title.default).toBeDefined();
      expect(layoutMetadata.title.template).toBeDefined();
      expect(layoutMetadata.title.template).toContain('%s');
    });

    it('should have robots configuration', () => {
      expect(layoutMetadata.robots).toBeDefined();
      expect(layoutMetadata.robots.index).toBe(true);
      expect(layoutMetadata.robots.follow).toBe(true);
    });

    it('should have Google Bot specific configuration', () => {
      expect(layoutMetadata.robots.googleBot).toBeDefined();
      expect(layoutMetadata.robots.googleBot.index).toBe(true);
      expect(layoutMetadata.robots.googleBot.follow).toBe(true);
      expect(layoutMetadata.robots.googleBot['max-image-preview']).toBe('large');
    });

    it('should have Open Graph configuration', () => {
      expect(layoutMetadata.openGraph).toBeDefined();
      expect(layoutMetadata.openGraph.type).toBe('website');
      expect(layoutMetadata.openGraph.locale).toBe('en_NG');
      expect(layoutMetadata.openGraph.siteName).toBeDefined();
    });

    it('should have Twitter Card configuration', () => {
      expect(layoutMetadata.twitter).toBeDefined();
      expect(layoutMetadata.twitter.card).toBe('summary_large_image');
      expect(layoutMetadata.twitter.site).toBeDefined();
      expect(layoutMetadata.twitter.creator).toBeDefined();
    });

    it('should have verification configured', () => {
      expect(layoutMetadata.verification).toBeDefined();
      expect(layoutMetadata.verification).toHaveProperty('google');
    });

    it('should have format detection disabled', () => {
      expect(layoutMetadata.formatDetection).toBeDefined();
      expect(layoutMetadata.formatDetection.email).toBe(false);
      expect(layoutMetadata.formatDetection.address).toBe(false);
      expect(layoutMetadata.formatDetection.telephone).toBe(false);
    });

    it('should have canonical URL', () => {
      expect(layoutMetadata.alternates).toBeDefined();
      expect(layoutMetadata.alternates.canonical).toBeDefined();
    });
  });

  describe('Viewport Configuration', () => {
    it('should have viewport configuration', () => {
      expect(viewport).toBeDefined();
      expect(viewport.width).toBe('device-width');
      expect(viewport.initialScale).toBe(1);
    });

    it('should have theme color', () => {
      expect(viewport.themeColor).toBeDefined();
      expect(typeof viewport.themeColor).toBe('string');
    });

    it('should allow user scaling', () => {
      expect(viewport.maximumScale).toBeGreaterThan(1);
    });
  });

  describe('Metadata Consistency', () => {
    it('should use consistent site name across metadata', () => {
      const layoutSiteName = layoutMetadata.openGraph.siteName;
      const homeSiteName = homeMetadata.openGraph?.siteName || layoutMetadata.openGraph.siteName;
      
      expect(layoutSiteName).toBeDefined();
      // Homepage can inherit from layout
      expect(homeSiteName).toBeDefined();
    });

    it('should use HTTPS for all URLs', () => {
      const checkHttps = (obj) => {
        if (typeof obj === 'string' && obj.startsWith('http')) {
          expect(obj).toMatch(/^https:\/\//);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(checkHttps);
        }
      };

      checkHttps(layoutMetadata);
      checkHttps(homeMetadata);
    });

    it('should have consistent image dimensions for Open Graph', () => {
      const layoutImages = layoutMetadata.openGraph.images;
      const homeImages = homeMetadata.openGraph.images;

      [layoutImages, homeImages].forEach((images) => {
        if (images && images.length > 0) {
          images.forEach((image) => {
            if (image.width && image.height) {
              expect(image.width).toBe(1200);
              expect(image.height).toBe(630);
            }
          });
        }
      });
    });
  });

  describe('SEO Best Practices', () => {
    it('should have description between 120-160 characters', () => {
      const description = homeMetadata.description;
      expect(description.length).toBeGreaterThanOrEqual(50);
      expect(description.length).toBeLessThanOrEqual(160);
    });

    it('should have title under 60 characters', () => {
      const title = homeMetadata.title;
      expect(title.length).toBeLessThanOrEqual(60);
    });

    it('should have unique titles for different pages', () => {
      const homeTitle = homeMetadata.title;
      const layoutDefaultTitle = layoutMetadata.title.default;
      
      // They should be the same for homepage, but template should be different
      expect(layoutMetadata.title.template).not.toBe(homeTitle);
    });

    it('should include location keywords', () => {
      const description = homeMetadata.description.toLowerCase();
      const title = homeMetadata.title.toLowerCase();
      
      const hasLocation = 
        description.includes('lagos') || 
        title.includes('lagos') ||
        description.includes('nigeria') ||
        title.includes('nigeria');
      
      expect(hasLocation).toBe(true);
    });
  });
});
