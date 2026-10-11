# META Integration Audit — GFVGO Growth Platform

Date: 2026-09-13
Scope: Phase A audit before changing Meta/Facebook production integration.

## Safety Constraints Confirmed

- Active project: `gfvgo` / `gfvgo.com`.
- Canonical workspace: `/root/.openclaw/workspace/projects/gfvgo`.
- Project guard result: `OK: gfvgo`.
- Production path exists separately at `/var/www/gfvgo`; this audit was performed in the canonical workspace first.
- Do not change App ID.
- Do not change the working Meta callback without an alias/compatibility plan.
- Do not hardcode Page `Pet Suphub - Daily Cute Pets` / `541436539349001` in production logic.
- Do not print or commit App Secret, access tokens, verify tokens, encryption keys, or `.env` values.

## Framework / Runtime

- Next.js: `16.2.7`.
- React: `19.2.4`.
- TypeScript project with App Router under `src/app`.
- Scripts:
  - `npm run typecheck` → `tsc --noEmit`.
  - `npm run build` → `next build`.
  - `npm test` → Node test runner for `tests/**/*.test.ts`.

## Routing Architecture

### Public Routes

- Homepage: `src/app/page.tsx` → `src/components/marketing/home-page.tsx`.
- Required CMS catch-all: `src/app/[...slug]/page.tsx`.
- Legal/public routes exist and are public:
  - `/chinh-sach-bao-mat`
  - `/dieu-khoan-su-dung`
  - `/xoa-du-lieu`
  - aliases `/privacy-policy`, `/terms-of-service`, `/data-deletion`
- `robots.txt` and `sitemap.xml` routes exist.

### Auth/Admin Routes

- Login route: `src/app/login/page.tsx`.
- Admin layout: `src/app/admin/layout.tsx`.
- Admin social pages:
  - `src/app/admin/social/pages/page.tsx`
  - `src/app/admin/social/pages/connect/page.tsx`
  - social analytics/calendar/planner/publishing/groups modules exist.

### Existing Meta API Routes

Existing routes are under `/api/integrations/meta/*`:

- `GET /api/integrations/meta/connect`
  - Starts Meta OAuth for an existing internal `SocialPage` via `pageId` query param.
  - Requires authenticated user.
  - Checks tenant admin access.
  - Creates strong nonce and signed HttpOnly cookie state.
  - Redirects to Meta OAuth authorization URL.

- `GET /api/integrations/meta/callback`
  - Requires authenticated user.
  - Validates code/state against signed cookie and current user.
  - Exchanges code for long-lived user token.
  - Calls `/me/accounts`.
  - Stores available Page metadata and encrypted Page tokens in `MetaOAuthSession`.
  - Redirects to `/admin/social/pages/connect?sessionId=...`.

- `GET /api/integrations/meta/webhook`
  - Verifies `hub.mode`, `hub.verify_token`, and `hub.challenge` using `META_WEBHOOK_VERIFY_TOKEN`.

- `POST /api/integrations/meta/webhook`
  - Reads raw body.
  - Rejects body > 1MB.
  - Verifies `x-hub-signature-256` using `META_APP_SECRET`.
  - Validates Page webhook payload shape.
  - Stores each change in `SocialWebhookEvent` with a SHA-256 `eventHash` and `skipDuplicates`.

### Missing Prompt-Named Routes

The master prompt says Meta has confirmed callback:

- `https://gfvgo.com/api/meta/callback`

Current code default/env example points to:

- `https://gfvgo.com/api/integrations/meta/callback`

No `/api/meta/*` routes currently exist. This is the largest compatibility gap. Safe approach: add `/api/meta/login`, `/api/meta/callback`, `/api/meta/webhook` aliases that delegate to the existing implementation, without removing or breaking `/api/integrations/meta/*` and without changing env/app id.

## Database / ORM

- ORM: Prisma `^7.1.0`.
- Main schema: `prisma/schema.prisma`.
- Relevant migrations already exist:
  - `20260824150000_add_social_growth_os`
  - `20260825112000_add_meta_page_publishing`
  - `20260905090000_add_social_comments`

Relevant models already exist:

- `SocialWorkspace`
- `SocialPage`
- `SocialConnection`
- `MetaOAuthSession`
- `SocialPublishTarget`
- `SocialPostInsight`
- `SocialWebhookEvent`
- `SocialComment`

`SocialConnection` stores:

- `encryptedToken`
- `tokenExpiresAt`
- `grantedScopes`
- `connectionStatus`
- `lastValidatedAt`

`SocialWebhookEvent` stores:

- `eventHash` unique
- `externalPageId`
- `field`
- `payload`
- `processedAt`
- `attempts`
- `errorMessage`

No immediate schema migration is required for Phase B/C unless adding optional metadata like webhook status/avatar/last sync. Existing schema is sufficient for safe OAuth/page connection/webhook storage.

## Auth / Session

- Session cookie: `30nice_session`.
- Session helper: `src/server/auth/session.ts`.
- Session token signed with `SESSION_SECRET`.
- Cookie is HttpOnly, Secure in production, SameSite=Lax, path `/`.
- `requireAuth()` throws if not logged in.
- Admin pages and server actions use auth checks.

## Tenant / Access Control

- Tenant guard: `src/server/permissions/guard.ts`.
- `requireTenantAccess(tenantId, minRole)` enforces:
  - `SUPER_ADMIN`: full access.
  - `AGENCY_ADMIN`: only organization tenants.
  - tenant members: membership required.
- Social queries use accessible tenant filters.
- Existing Meta connect flow maps internal `SocialPage` → workspace → tenant and requires `TENANT_ADMIN`.
- Existing selector only allows connecting Pages returned by the OAuth `/me/accounts` session.

## Environment Variables

Current env example contains:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_GRAPH_VERSION="v25.0"`
- `META_REDIRECT_URI="https://gfvgo.com/api/integrations/meta/callback"`
- `META_WEBHOOK_VERIFY_TOKEN`
- `TOKEN_ENCRYPTION_KEY`

Master prompt states:

- App ID: `1063914386374901`
- Graph API test version: `v26.0`
- Valid callback: `https://gfvgo.com/api/meta/callback`

Gap: env naming/version/callback differs from prompt. Do not change production values blindly. Recommended safe work:

1. Support both `META_GRAPH_VERSION` and optional `META_GRAPH_API_VERSION` in config.
2. Add `/api/meta/*` route aliases.
3. Update `.env.example`/docs only, without secrets.
4. Do not change real production `.env` or App ID unless explicitly requested after alias is deployed.

## Encryption / Token Storage

- Token vault: `src/server/crypto/token-vault.ts`.
- Uses AES-256-GCM with random 12-byte IV.
- Key is SHA-256 of `TOKEN_ENCRYPTION_KEY`.
- Refuses missing or <32-character key.
- Tokens are encrypted server-side.
- Tokens are not returned to client in current UI.
- `MetaOAuthSession.encryptedPageTokens` temporarily stores encrypted Page tokens and is nulled after consumption.

## Meta Graph Service Layer

File: `src/server/meta/client.ts`.

Existing functions:

- `getMetaConfig()`
- `getMetaConfigurationStatus()`
- `buildMetaAuthorizeUrl()`
- `exchangeMetaCode()`
- `listMetaManagedPages()`
- `debugMetaToken()`
- `getMetaPage()`
- `publishMetaPagePost()`
- `subscribeMetaPageWebhooks()`
- `getMetaPostMetrics()`
- group helper functions

Security/resilience present:

- centralized Graph version.
- appsecret_proof for user/page tokens.
- timeout via `AbortController`.
- normalized `MetaApiError`.

Gaps:

- Required scopes do not include `business_management`; prompt says Phase đầu includes it.
- Required scopes already include `pages_manage_posts`; prompt says do not automatically ask unnecessary permissions, and Phase đầu may be read/subscription first.
- No `getBusinesses()` wrapper yet.
- No direct `getPagePosts()` wrapper named as such; post metrics helpers exist.
- No generic retry/backoff yet.
- Graph version default is `v25.0`, prompt says testing is `v26.0`.

## Current Admin UI

- `src/app/admin/social/pages/page.tsx` shows Social Page cards, Meta config warnings, connect/reconnect, validate, disconnect actions.
- Connect starts from an existing internal Social Page, not a standalone `/api/meta/login` flow.
- Page selector UI: `src/components/admin/meta-page-selector.tsx`.
- Selector lists pages returned by OAuth session and posts to `selectMetaPageAction`.
- UI does not show access tokens.
- It currently requires `CREATE_CONTENT` task before allowing connect. For read-only Phase, this may be too strict because prompt Phase đầu includes read/list/metadata/business permissions; write/publish should be permission-aware instead of blocking all connection.

## Current Webhook / Background Jobs

Routes/jobs:

- `src/app/api/cron/social-webhooks/route.ts`
- `src/app/api/cron/social-insights/route.ts`
- `src/app/api/cron/social-publish/route.ts`

Webhook storage exists and is idempotent via `eventHash`.
Need further audit before modifying webhook processor internals.

## Middleware / Proxy

- `src/proxy.ts` protects `/admin/*` and redirects logged-in users away from `/login`.
- root `proxy.ts` performs host policy and tenant redirects.
- `PRIMARY_HOST` default is `gfvgo.com`.
- `isAdminHost = host === ADMIN_HOST || host === PRIMARY_HOST`, so `/login` and `/admin/*` are available on `gfvgo.com`.
- Tenant hosts do not expose admin/login.

## Logging / Observability

- Audit log helper exists: `src/server/audit/log.ts`.
- It writes `AuditLog` and never breaks primary actions.
- Existing Meta actions write audit records for connect/validate/disconnect.
- Need review of PM2/app logs during later phases to ensure no secrets are logged.

## Existing Tests

Tests directory includes relevant coverage:

- `tests/meta-oauth-state.test.ts`
- `tests/token-vault.test.ts`
- `tests/webhook-payload.test.ts`
- auth/permissions/host/cron/rate-limit/SSRF tests

Need to add tests for any new `/api/meta/*` alias/core behavior and new client helpers.

## Phase A Findings / Risks

### High

1. Callback mismatch between prompt/Meta confirmed URL (`/api/meta/callback`) and existing code/env default (`/api/integrations/meta/callback`).
   - Safe fix: add alias route(s), do not remove old route.

2. Prompt says Graph API v26.0; code/env example defaults to v25.0.
   - Safe fix: centralize support for `META_GRAPH_API_VERSION` while preserving `META_GRAPH_VERSION` compatibility; do not force production without testing.

### Medium

3. Current connect flow requires an existing internal SocialPage and `pageId` query param; prompt describes generic `/api/meta/login` then choose Page. Existing architecture is tenant-aware and safer, but `/api/meta/login` should likely redirect with `pageId` or require selected context.

4. Current `META_REQUIRED_SCOPES` includes `pages_manage_posts`, which may be more than needed for read-only Phase C/D. App review strategy should be permission-aware.

5. Current Page selector blocks connection if Page lacks `CREATE_CONTENT`; read-only/metadata/webhook use cases may not require create content.

### Low / Documentation

6. Product docs/env examples still reference older callback/version and old product comments.
7. No dedicated `META_APP_REVIEW_CHECKLIST.md` / `META_SECURITY_REVIEW.md` yet.

## Recommended Next Phase Plan

### Phase B — Core OAuth, safe/minimal

- Add `/api/meta/login` alias that forwards/redirects to existing `/api/integrations/meta/connect` while preserving current `pageId`-based tenant-safe flow.
- Add `/api/meta/callback` alias that delegates to existing callback handler.
- Add `/api/meta/webhook` alias that delegates to existing webhook handler.
- Update Meta config to support `META_GRAPH_API_VERSION` fallback without breaking existing `META_GRAPH_VERSION`.
- Keep current production callback env untouched until aliases are deployed and verified.
- Add/update tests for OAuth state and route alias behavior where feasible.

### Phase C/D candidates

- Make Page selection permission-aware rather than hard requiring `CREATE_CONTENT` for connection.
- Add service methods: `getMe`, `getBusinesses`, `getPagePosts`, optional `getPageInsights` with graceful permission handling.
- Add read-only Page info/posts UI or route under admin social pages.

## Phase A Test Result

Pending at first write. Run after file creation:

- targeted tests: `npm test -- tests/meta-oauth-state.test.ts tests/token-vault.test.ts tests/webhook-payload.test.ts`
- typecheck/build before moving to Phase B.
