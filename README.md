This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Documentation

- [SEO Guide](docs/SEO_GUIDE.md) - Comprehensive guide for maintaining and extending SEO
- [SEO Implementation](docs/SEO_IMPLEMENTATION.md) - Technical implementation details
- [SEO Testing](docs/SEO_TESTING.md) - Testing procedures and validation
- [Canonical URLs](docs/CANONICAL_URLS.md) - Canonical URL configuration

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://fivecloverhotels.com

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code-here

# Hashnode Blog Configuration
NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST=fivecloverhotels.hashnode.dev
```

See the [SEO Guide](docs/SEO_GUIDE.md) for detailed information about environment variables.

## SEO Features

This website includes comprehensive SEO optimization:

- Dynamic metadata for all pages
- Structured data (JSON-LD) for rich snippets
- Automatic sitemap generation at `/sitemap.xml`
- Robots.txt configuration at `/robots.txt`
- Open Graph and Twitter Card support
- Canonical URLs
- Google Analytics and Search Console integration

For detailed SEO documentation, see the [SEO Guide](docs/SEO_GUIDE.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
