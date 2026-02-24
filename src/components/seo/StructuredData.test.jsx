import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StructuredData from './StructuredData';

describe('StructuredData', () => {
  it('renders a single JSON-LD script tag with valid structured data', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Five Clover Hotels Group',
      url: 'https://fivecloverhotels.com',
    };

    const { container } = render(<StructuredData data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeTruthy();
    expect(JSON.parse(script.textContent)).toEqual(data);
  });

  it('renders multiple JSON-LD script tags when given an array', () => {
    const dataArray = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Five Clover Hotels Group',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Hotel',
        name: 'Five Clover Hotel',
      },
    ];

    const { container } = render(<StructuredData data={dataArray} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');

    expect(scripts).toHaveLength(2);
    expect(JSON.parse(scripts[0].textContent)).toEqual(dataArray[0]);
    expect(JSON.parse(scripts[1].textContent)).toEqual(dataArray[1]);
  });

  it('renders valid JSON-LD for Organization schema', () => {
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Five Clover Hotels Group',
      url: 'https://fivecloverhotels.com',
      logo: 'https://fivecloverhotels.com/logo.png',
      description: 'Premium hotel group in Lagos, Nigeria',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'NG',
        addressLocality: 'Lagos',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+234-XXX-XXX-XXXX',
        contactType: 'customer service',
      },
    };

    const { container } = render(<StructuredData data={organizationData} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData['@context']).toBe('https://schema.org');
    expect(parsedData['@type']).toBe('Organization');
    expect(parsedData.name).toBe('Five Clover Hotels Group');
    expect(parsedData.address['@type']).toBe('PostalAddress');
  });

  it('renders valid JSON-LD for Hotel schema', () => {
    const hotelData = {
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: 'Five Clover Hotel',
      description: 'Luxury accommodation in Lagos',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Lagos',
        addressCountry: 'NG',
      },
      telephone: '+234-XXX-XXX-XXXX',
      priceRange: '$$',
    };

    const { container } = render(<StructuredData data={hotelData} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData['@type']).toBe('Hotel');
    expect(parsedData.name).toBe('Five Clover Hotel');
    expect(parsedData.address.addressLocality).toBe('Lagos');
  });

  it('renders valid JSON-LD for Article schema', () => {
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Test Blog Post',
      description: 'Test description',
      image: 'https://example.com/image.jpg',
      datePublished: '2024-01-01',
      dateModified: '2024-01-02',
      author: {
        '@type': 'Organization',
        name: 'Five Clover Hotels Group',
      },
    };

    const { container } = render(<StructuredData data={articleData} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData['@type']).toBe('BlogPosting');
    expect(parsedData.headline).toBe('Test Blog Post');
    expect(parsedData.author['@type']).toBe('Organization');
  });

  it('renders valid JSON-LD for BreadcrumbList schema', () => {
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://fivecloverhotels.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://fivecloverhotels.com/blog',
        },
      ],
    };

    const { container } = render(<StructuredData data={breadcrumbData} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData['@type']).toBe('BreadcrumbList');
    expect(parsedData.itemListElement).toHaveLength(2);
    expect(parsedData.itemListElement[0].position).toBe(1);
  });

  it('returns null when data is null or undefined', () => {
    const { container: container1 } = render(<StructuredData data={null} />);
    const { container: container2 } = render(<StructuredData data={undefined} />);

    expect(container1.querySelector('script')).toBeNull();
    expect(container2.querySelector('script')).toBeNull();
  });

  it('properly escapes special characters in JSON', () => {
    const dataWithSpecialChars = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Test & Company "Quotes"',
      description: "It's a test with <html> tags",
    };

    const { container } = render(<StructuredData data={dataWithSpecialChars} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData.name).toBe('Test & Company "Quotes"');
    expect(parsedData.description).toBe("It's a test with <html> tags");
  });

  it('handles nested objects correctly', () => {
    const complexData = {
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: 'Test Hotel',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Lagos',
      },
      starRating: {
        '@type': 'Rating',
        ratingValue: 4.5,
      },
    };

    const { container } = render(<StructuredData data={complexData} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsedData = JSON.parse(script.textContent);

    expect(parsedData.address.streetAddress).toBe('123 Main St');
    expect(parsedData.starRating.ratingValue).toBe(4.5);
  });
});
