import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import nextConfig from '../../next.config.mjs';

// The site is exported as plain files for Cloudflare's free plan (owner,
// 2026-11-05): nothing runs per request, so picture resizing, compression and
// redirects are no longer Next.js's job - Cloudflare (and, while it still
// serves the site, Vercel via vercel.json) does them.
describe('Next.js configuration', () => {
  it('exports every page as a plain file', () => {
    expect(nextConfig.output).toBe('export');
  });

  it('serves pictures as built, with no per-visitor resizing', () => {
    expect(nextConfig.images?.unoptimized).toBe(true);
  });

  it('has the powered-by header disabled for security', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('has no server-side redirects or headers (they would be ignored by an export)', () => {
    expect(nextConfig.redirects).toBeUndefined();
    expect(nextConfig.headers).toBeUndefined();
  });

  it('bakes in a version for the PMS Update button', () => {
    expect(nextConfig.env?.NEXT_PUBLIC_APP_VERSION).toBeTruthy();
  });
});

// Head Office moved into the PMS (2026-10-01): /hq and, before it, /admin.
// Those redirects now live in vercel.json (and as Cloudflare Redirect Rules,
// backend docs/OWNER-SETUP.md part 1 step 4).
describe('Old Head Office addresses (vercel.json)', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '../../vercel.json'), 'utf8'));
  // The first rule that matches, as Vercel applies them (in order).
  const destinationOf = (p) => {
    for (const rule of vercel.redirects) {
      const pattern = new RegExp(`^${rule.source.replace(':path*', '(.*)')}$`);
      const match = p.match(pattern);
      if (match) return rule.destination.replace(':path*', match[1] ?? '');
    }
    return null;
  };

  it('land on the same page in the PMS, renamed pages included', () => {
    for (const from of ['/hq', '/admin']) {
      expect(destinationOf(from)).toBe('/pms');
      expect(destinationOf(`${from}/critical`)).toBe('/pms/critical');
      expect(destinationOf(`${from}/decision-support`)).toBe('/pms/decision-support');
      expect(destinationOf(`${from}/metrics`)).toBe('/pms/metrics');
      expect(destinationOf(`${from}/staff`)).toBe('/pms/staff-accounts');
      expect(destinationOf(`${from}/audit-logs`)).toBe('/pms/audit-trail');
      expect(destinationOf(`${from}/account`)).toBe('/pms/account');
    }
  });

  it('are never permanent, so the old paths stay free for later', () => {
    expect(vercel.redirects.every((rule) => rule.permanent === false)).toBe(true);
  });
});
