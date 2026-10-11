# PROJECT_AUDIT.md

Date: 13/09/2026
Project: gfvgo / GFVGO Growth Platform
Production domain: https://gfvgo.com/

## Framework
- Next.js `16.2.7`, React `19.2.4`, TypeScript.
- Uses App Router under `src/app`.
- Global root layout: `src/app/layout.tsx` only injects global font, `PageViewTracker`, and children. It does not impose admin/public chrome.

## Database / ORM
- PostgreSQL via Prisma `7.1.0`.
- Prisma schema: `prisma/schema.prisma`.
- No schema change is required for the public website/legal pages task.

## Authentication
- Login route: `src/app/login/page.tsx`.
- Login API: `src/app/api/auth/login/route.ts`.
- Session cookie: `30nice_session`.
- Cookie is HttpOnly, SameSite=Lax, secure in production.
- Admin layout `src/app/admin/layout.tsx` calls `getSession()` and redirects unauthenticated users to `/login`.
- Middleware/proxy protection exists in `src/proxy.ts` for `/admin` and `/login` in dev/local matching.
- Root `proxy.ts` applies host/path policy for production multi-tenant routing.

## Routes
Existing important routes:
- `/login` auth page.
- `/admin/*` dashboard/admin, protected by layout session check.
- `/api/auth/*`, `/api/integrations/meta/*`, `/api/cron/*`, `/api/contact`, `/api/upload`, `/api/media`, `/api/track`.
- `src/app/[[...slug]]/page.tsx` is a catch-all tenant public renderer. It currently redirects default homepage to `/admin/dashboard` for default theme tenants.

Public route risk found:
- `/` was handled by the catch-all and could redirect to admin depending on tenant theme/settings.
- Legal/static pages were not guaranteed as public 200 routes independent of CMS content.

Safe implementation approach:
- Add explicit App Router pages for `/`, `/gioi-thieu`, `/tinh-nang`, `/giai-phap`, `/lien-he`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/xoa-du-lieu`.
- Add English alias pages `/privacy-policy`, `/terms-of-service`, `/data-deletion` rendering the same content with HTTP 200.
- Keep admin/auth layout untouched.
- Keep API/database/auth logic untouched.

## Existing middleware / host handling
- `root proxy.ts` blocks `/admin`, `/login`, `/api/auth/*` on non-admin hosts unless host equals `ADMIN_HOST`.
- Default env values are `PRIMARY_HOST=30nice.vn`, `ADMIN_HOST=admin.30nice.vn`; production should ensure gfvgo.com policy is intended. This audit did not change proxy behavior.
- `src/proxy.ts` protects admin and redirects logged-in `/login` users in local/dev style matching.

## Meta / Facebook integration audit
Code locations:
- OAuth connect: `src/app/api/integrations/meta/connect/route.ts`
- OAuth callback: `src/app/api/integrations/meta/callback/route.ts`
- Webhook verify/receiver: `src/app/api/integrations/meta/webhook/route.ts`
- Meta client/helpers: `src/server/meta/client.ts`
- Admin UI: `src/app/admin/social/pages/page.tsx`, `src/app/admin/social/pages/connect/page.tsx`
- Social publishing: `src/server/social/publisher.ts`, `src/server/social/publish-rules.ts`

Current Facebook callback route:
- `https://gfvgo.com/api/integrations/meta/callback` by default via `META_REDIRECT_URI` fallback.

Current Meta App ID:
- Environment variable `META_APP_ID` is required. Value intentionally not printed.

Current webhook:
- `https://gfvgo.com/api/integrations/meta/webhook`
- Verify token env: `META_WEBHOOK_VERIFY_TOKEN` required for verification. Value intentionally not printed.

Permissions/scopes requested:
- `pages_show_list`
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_manage_metadata`

Token storage:
- User/page tokens are exchanged server-side.
- Page access tokens are encrypted via `encryptToken` before storage in `SocialConnection` / OAuth session flow.
- `TOKEN_ENCRYPTION_KEY` is required for real connection safety.
- Tokens/secrets are not exposed to frontend by this implementation.

## Contact form
- Existing `/api/contact` supports server-side validation with Zod and stores submissions in `FormSubmission`.
- It requires at least phone or email, stores IP hash, user agent, path/domain, and tenant fallback.
- Public contact page can safely use this API without schema changes.
- No additional outbound email sending is introduced.

## SEO technical
Existing:
- `src/app/robots.txt/route.ts`: disallows `/admin`, `/api`, `/login` and includes sitemap.
- `src/app/sitemap.xml/route.ts`: dynamic sitemap from DB plus base URLs.

Needed in implementation:
- Metadata/canonical/OG/Twitter per public route.
- Explicit public routes with status 200 for Meta crawler.
- Login/admin should remain outside sitemap. Existing robots disallows login/admin.

## Deployment
- Next app deployment files exist under `deploy/`.
- PM2 ecosystem and nginx examples exist.
- No env changes required for the public site implementation.

## Risk summary
Low-risk changes:
- Additive public pages/components.
- Additive docs.
- Metadata/sitemap additions.

Avoided risks:
- No DB schema/migration change.
- No auth/session changes.
- No Meta OAuth/callback/webhook logic changes.
- No existing admin/dashboard route changes.
