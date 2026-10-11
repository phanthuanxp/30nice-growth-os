# PUBLIC_SITE_IMPLEMENTATION.md

Date: 13/09/2026
Project: gfvgo / GFVGO Growth Platform

## Summary
Implemented a separated public SaaS/product website for `https://gfvgo.com/` without changing existing admin/auth/CMS/database/social integration logic.

## Added public routes
- `/`
- `/gioi-thieu`
- `/tinh-nang`
- `/giai-phap`
- `/lien-he`
- `/chinh-sach-bao-mat`
- `/dieu-khoan-su-dung`
- `/xoa-du-lieu`

## Meta/legal aliases
- `/privacy-policy`
- `/terms-of-service`
- `/data-deletion`

These routes are explicit App Router pages under `src/app/*/page.tsx`, so they take precedence over the existing tenant catch-all route `src/app/[[...slug]]/page.tsx`.

## Public layout separation
Added:
- `src/components/marketing/site.ts`
- `src/components/marketing/seo.ts`
- `src/components/marketing/public-layout.tsx`
- `src/components/marketing/legal-pages.tsx`

The public header/footer are used only by the new public pages through `PublicLayout`.

Not changed:
- `src/app/login/page.tsx`
- `src/app/admin/layout.tsx`
- auth APIs
- database schema/migrations
- Meta/Facebook OAuth callback/webhook/connect handlers
- existing admin/social modules

## SEO / metadata
Each public page has route-level metadata via `publicMetadata()`:
- title
- description
- canonical URL
- Open Graph metadata
- Twitter metadata

The homepage also includes JSON-LD for:
- Organization
- WebSite
- SoftwareApplication

## Sitemap
Updated `src/app/sitemap.xml/route.ts` to include the public SaaS/legal URLs while keeping `/login`, `/admin`, and `/api` out of the sitemap.

`src/app/robots.txt/route.ts` already disallows:
- `/admin`
- `/api`
- `/login`

## Contact page
`/lien-he` includes a standard HTML form posting to existing `/api/contact`.
No new backend endpoint was added.
No outbound email or external message sending was introduced.

## Safety notes
This implementation is additive. It does not rewrite the CMS, tenant rendering, authentication, social integrations, Prisma schema, or deployment configuration.

## Verification checklist
Run before deployment:

```bash
npm run lint
npm run typecheck
npm run build
```

After starting the app, verify:

```bash
curl -I https://gfvgo.com/
curl -I https://gfvgo.com/privacy-policy
curl -I https://gfvgo.com/terms-of-service
curl -I https://gfvgo.com/data-deletion
curl -I https://gfvgo.com/login
curl -I https://gfvgo.com/admin
```

Expected:
- Public and legal pages return HTTP 200.
- `/login` still renders existing login page and has no public marketing header/footer.
- `/admin` remains protected and redirects unauthenticated users to login.
