# The blog is paused

Paused on 2026-11-05 for the move to Cloudflare's **free** plan (owner). The
code is all still here; nothing was deleted.

## Why it was paused

On Cloudflare's free plan, any page the server builds on request gets 10 ms
of CPU. Every other page of the site is built once, ahead of time, and is
served as a plain file (no CPU at all). The blog was the exception:

- `/blog/[slug]` was built on each visit (it asked Hashnode for the post);
- `/blog` and `sitemap.xml` rebuilt every hour (`next: { revalidate }` in
  `src/lib/hashnode.js`).

## What was switched off

| Where | What |
|---|---|
| `src/app/(marketing)/_blog/` | the blog pages. The leading `_` makes the folder private, so Next.js serves no route from it. |
| `src/components/shared/TopBar.jsx` | the BLOG link (commented out) |
| `src/components/shared/MobileMenu.jsx` | the BLOG link (commented out) |
| `src/components/shared/Footer.jsx` | the BLOG link (commented out) |
| `src/app/sitemap.js` | `/blog` and the posts (commented out) |

`src/lib/hashnode.js`, the blog components (`components/blog`,
`components/shared/BlogPost.jsx`, `MiniBlogPost.jsx`) and their tests are
unchanged.

## Bringing it back - build it at BUILD time

So it still costs no CPU on Cloudflare:

1. Rename `src/app/(marketing)/_blog` back to `blog`, and uncomment the four
   places above.
2. In `src/lib/hashnode.js`, drop `next: { revalidate: REVALIDATE_TIME }` from
   both fetches (or use `cache: 'force-cache'`), so posts are fetched once,
   when the site is built.
3. In `_blog/[slug]/page.jsx`, add:

   ```js
   export const dynamicParams = false;
   export async function generateStaticParams() {
     const blogs = await fetchHashnodeBlogs(100);
     return blogs.map((b) => ({ slug: b.slug }));
   }
   ```

   so every post is built ahead of time and an unknown slug is a 404.
4. Check the build output: `/blog` and every `/blog/...` must show as `○` or
   `●` (built ahead), never `ƒ` (built on request).
5. A new post then appears at the next deploy. To pick posts up without a
   code change, add a Cloudflare **deploy hook** (Workers & Pages >
   five-clover-site > Settings > Builds > Deploy hooks) and call it from
   Hashnode's webhook on publish, or from a daily scheduled trigger.
