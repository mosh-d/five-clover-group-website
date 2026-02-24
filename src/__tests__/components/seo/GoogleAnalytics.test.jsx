import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';

// Mock Next.js Script component
vi.mock('next/script', () => ({
  default: ({ src, id, strategy, children }) => {
    if (src) {
      return <script data-testid="ga-script" data-src={src} data-strategy={strategy} />;
    }
    return <script data-testid="ga-inline-script" data-id={id} data-strategy={strategy}>{children}</script>;
  },
}));

describe('GoogleAnalytics', () => {
  const originalEnv = process.env.NEXT_PUBLIC_GA_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_GA_ID = originalEnv;
  });

  it('should not render when GA ID is not configured', () => {
    delete process.env.NEXT_PUBLIC_GA_ID;
    const { container } = render(<GoogleAnalytics />);
    expect(container.firstChild).toBeNull();
  });

  it('should render Script components when GA ID is configured', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123456';
    const { getAllByTestId } = render(<GoogleAnalytics />);
    
    // Check that both external and inline scripts are rendered
    const gaScript = getAllByTestId('ga-script');
    const inlineScript = getAllByTestId('ga-inline-script');
    
    expect(gaScript.length).toBeGreaterThan(0);
    expect(inlineScript.length).toBeGreaterThan(0);
  });

  it('should include correct GA tracking ID in script source', () => {
    const testGaId = 'G-TEST123456';
    process.env.NEXT_PUBLIC_GA_ID = testGaId;
    const { getByTestId } = render(<GoogleAnalytics />);
    
    // Check that the GA ID is included in the script src
    const gaScript = getByTestId('ga-script');
    expect(gaScript.getAttribute('data-src')).toContain(testGaId);
  });

  it('should include GA configuration in inline script', () => {
    const testGaId = 'G-TEST123456';
    process.env.NEXT_PUBLIC_GA_ID = testGaId;
    const { getByTestId } = render(<GoogleAnalytics />);
    
    // Check that the inline script contains the GA configuration
    const inlineScript = getByTestId('ga-inline-script');
    expect(inlineScript.textContent).toContain(testGaId);
    expect(inlineScript.textContent).toContain('gtag');
  });

  it('should use afterInteractive strategy for performance optimization', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123456';
    const { getByTestId, getAllByTestId } = render(<GoogleAnalytics />);
    
    // Verify both scripts use afterInteractive strategy
    const gaScript = getByTestId('ga-script');
    const inlineScript = getByTestId('ga-inline-script');
    
    expect(gaScript.getAttribute('data-strategy')).toBe('afterInteractive');
    expect(inlineScript.getAttribute('data-strategy')).toBe('afterInteractive');
  });
});
