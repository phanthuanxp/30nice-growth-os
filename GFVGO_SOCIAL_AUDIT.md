# GFVGO Social / Multi-Facebook Audit — Phase A

Audit date: 2026-09-13 19:42 Europe/Berlin  
Project: `gfvgo` / `https://gfvgo.com`  
Repo: `/root/.openclaw/workspace/projects/gfvgo`  
Production path referenced but not changed: `/var/www/gfvgo`

## 0. Scope and Safety

This document is Phase A only. No later-phase implementation was performed in this audit pass.

Safety boundary confirmed:

- Project guard passed for `gfvgo` at `/root/.openclaw/workspace/projects/gfvgo`.
- This is the Next.js/Prisma GFVGO project, not the WordPress `cms.30nice.vn` project.
- Production was not deployed/reloaded by this audit.
- No secrets or token values were printed or copied.
- Existing `/login`, auth/session, admin protection, CMS models, and social module behavior were inspected only.

Memory semantic search was unavailable due the existing embedding-provider auth error, so this audit is grounded in repository inspection and previously verified runtime context.

## 1. Framework / Runtime Architecture

- Framework: Next.js `16.2.7` App Router.
- React: `19.2.4`.
- TypeScript: `^5`.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`, with reusable admin UI components under `src/components`.
- ORM: Prisma `7.1.0` with PostgreSQL.
- Main app router root: `src/app`.
- Public homepage route: `src/app/page.tsx`.
- Dynamic CMS route: `src/app/[...slug]/page.tsx`.
- Admin root: `src/app/admin`.
- Admin social module root: `src/app/admin/social`.
- API routes: `src/app/api/**/route.ts`.
- Middleware/proxy: `src/proxy.ts`, protecting `/admin/*` and redirecting authenticated `/login` users to `/admin/dashboard`.

Scripts available in repo:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run prisma:generate`
- `npm run seed`

## 2. Database / ORM

Datasource: PostgreSQL via Prisma. The schema is in `prisma/schema.prisma`.

Current core multi-tenant CMS models include:

- `User`
- `Organization`
- `OrganizationMember`
- `Tenant`
- `TenantMember`
- `SiteSettings`
- `Domain`
- `Page`
- `PageRevision`
- `Category`
- `Post`
- `PostRevision`
- `MediaAsset`
- `Menu`
- `MenuItem`
- `Form`
- `FormSubmission`
- `RedirectRule`
- `AiUsageLog`
- `SeoAudit`
- `Integration`
- `AutomationJob`
- `AnalyticsEvent`
- `AuditLog`

Additional SEO/content engine models exist for keyword planning, subdomain planning, content plans, content sources, source articles, and crawl jobs.

Social schema already exists and is substantial:

- Enums:
  - `SocialPlatform`
  - `SocialWorkspaceStatus`
  - `SocialPageStatus`
  - `SocialPlanStatus`
  - `SocialContentStatus`
  - `SocialPublishTargetType`
  - `SocialPublishStatus`
  - `SocialGroupMode`
  - `SocialGroupStatus`
- Models:
  - `SocialWorkspace`
  - `SocialPage`
  - `SocialConnection`
  - `SocialContentPlan`
  - `SocialContent`
  - `SocialContentRevision`
  - `SocialGroup`
  - `SocialPublishTarget`
  - `MetaOAuthSession`
  - `SocialPostInsight`
  - `SocialWebhookEvent`
  - `SocialComment`

Relevant migrations already present:

- `20260824150000_add_social_growth_os`
- `20260825090000_add_social_content_revisions`
- `20260825112000_add_meta_page_publishing`
- `20260903120000_add_social_group_distribution`
- `20260905090000_add_social_comments`

Audit note: local `npx prisma migrate status` could not complete because the local DB credentials in the environment were denied (`P1010`). This was non-destructive and no migration was run.

## 3. Authentication / Session / Authorization

Authentication:

- Login API: `src/app/api/auth/login/route.ts`.
- Logout API: `src/app/api/auth/logout/route.ts`.
- Session helper: `src/server/auth/session.ts`.
- Session cookie: `30nice_session`.
- Session signing/parsing: `src/server/auth/token.ts`.
- In production, `SESSION_SECRET` is required.
- Cookie attributes: `httpOnly`, `secure` in production, `sameSite: "lax"`, `path: "/"`.

Admin protection:

- `src/proxy.ts` redirects unauthenticated `/admin/*` requests to `/login`.
- Authenticated `/login` redirects to `/admin/dashboard`.

Authorization / tenant isolation:

- Permission guard: `src/server/permissions/guard.ts`.
- `requireTenantAccess(tenantId, minRole)` handles:
  - `SUPER_ADMIN`: full access.
  - `AGENCY_ADMIN`: via organization membership.
  - `TENANT_ADMIN` / `EDITOR` / `VIEWER`: via tenant membership.
- Social query layer uses an `accessibleTenantWhere(userId, role)` pattern in `src/server/queries/social.ts` to filter workspaces/pages/content by accessible tenants.

Risk:

- Existing social routes/actions generally use tenant-aware queries or `requireTenantAccess`, which is good.
- Future AI Gateway routes must not bypass this layer by accepting raw Page IDs without resolving them to accessible tenant/workspace records.

## 4. Existing Social Media Module

The codebase already contains a dashboard social module. Do not create a duplicate top-level Social menu; extend this module.

Existing admin social routes:

- `/admin/social` — overview dashboard.
- `/admin/social/pages` — Page Factory / Facebook connection management.
- `/admin/social/pages/connect` — choose a Facebook Page after OAuth.
- `/admin/social/planner` — Social Content Planner.
- `/admin/social/planner/[contentId]` — edit/review individual social content.
- `/admin/social/calendar` — calendar view.
- `/admin/social/publishing` — publishing queue.
- `/admin/social/groups` — Facebook Group library/distribution.
- `/admin/social/analytics` — analytics/performance dashboard.

Existing social server actions:

- `src/server/actions/social.ts`
  - social workspace creation
  - social Page creation
  - AI strategy generation
  - social content plan creation
  - draft/edit/status/schedule workflows
- `src/server/actions/social-meta.ts`
  - Page selection after OAuth
  - Meta token validation
  - disconnect/retry/publish-now actions
- `src/server/actions/social-groups.ts`
  - Group library CRUD/status/mode/API verification
  - group distribution queue and manual-post workflows

Existing admin components:

- `src/components/admin/meta-page-selector.tsx`
- `src/components/admin/social-ai-actions.tsx`
- `src/components/admin/social-content-editor.tsx`
- `src/components/admin/social-distribution.tsx`
- `src/components/admin/social-forms.tsx`
- `src/components/admin/social-group-actions.tsx`

Fit to MASTER PROMPT:

- Overview: present.
- Facebook Pages: present, but list details should be expanded.
- Content Studio: partially present as Planner/editor; no separate rich Content Studio yet.
- Calendar: present monthly view.
- Comments: data model/webhook processor present; no dedicated comments UI route found.
- Analytics: present but based on stored publish insights/comments; permission-aware unavailable states need strengthening.
- Automation: admin route exists globally; social-safe automation needs extension.

## 5. Existing Meta / Facebook Integration

Existing route family:

- `GET /api/integrations/meta/connect`
- `GET /api/integrations/meta/callback`
- `GET /api/integrations/meta/webhook`
- `POST /api/integrations/meta/webhook`

Compatibility aliases already present:

- `GET /api/meta/login` → delegates to existing connect route.
- `GET /api/meta/callback` → delegates to existing callback route.
- `GET /api/meta/webhook` and `POST /api/meta/webhook` → delegate to existing webhook route.

OAuth flow currently:

1. User clicks connect from `/admin/social/pages`.
2. `GET /api/integrations/meta/connect?pageId=...` checks session and tenant admin access.
3. It checks Meta env config and token vault availability.
4. It seals OAuth state in cookie `30nice_meta_oauth` with path `/api`.
5. It redirects to Meta OAuth dialog.
6. Callback exchanges code for long-lived user token.
7. It calls `/me/accounts` and stores available Page metadata plus encrypted Page tokens in `MetaOAuthSession`.
8. User chooses a Page at `/admin/social/pages/connect?sessionId=...`.
9. `selectMetaPageAction` decrypts selected Page token, validates it, stores encrypted token in `SocialConnection`, updates `SocialPage`, and attempts Page webhook subscription.

Meta client:

- File: `src/server/meta/client.ts`.
- Current default callback: `https://gfvgo.com/api/meta/callback` unless env overrides.
- Current Graph version default: `v26.0` via `META_GRAPH_API_VERSION || META_GRAPH_VERSION || "v26.0"`.
- Existing helpers include:
  - `buildMetaAuthorizeUrl`
  - `exchangeMetaCode`
  - `listMetaManagedPages`
  - `debugMetaToken`
  - `getMetaMe`
  - `getMetaBusinesses`
  - `getMetaPage`
  - `getMetaPagePosts`
  - `publishMetaPagePost`
  - `subscribeMetaPageWebhooks`
  - `getMetaPostMetrics`
  - group helpers referenced by social group code.

Scopes currently split as:

- Read scopes: `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `business_management`.
- Publish scopes: `pages_manage_posts`.
- Required scopes for OAuth currently combine read + publish scopes.

Audit observation:

- MASTER PROMPT says not to request unused permissions and current/test permissions exclude `pages_manage_posts` until ready. Code currently requests `pages_manage_posts` through `META_REQUIRED_SCOPES`. This is a potential App Review friction/risk. Since publishing code exists, this may be intentional, but Phase B should decide whether to make publish scopes optional/configurable.

Token security:

- Token vault: `src/server/crypto/token-vault.ts`.
- Access tokens are encrypted at rest and not returned to frontend.
- `TOKEN_ENCRYPTION_KEY` is required for real connect.
- Page-token temporary storage in `MetaOAuthSession.encryptedPageTokens` is cleared on selection by setting JSON null.

Webhook:

- Verification route checks `META_WEBHOOK_VERIFY_TOKEN` using constant-time helper.
- POST route verifies `x-hub-signature-256` with `META_APP_SECRET`.
- Payload size capped at 1 MB.
- Payload schema supports `object: "page"` and up to 500 entries.
- Events are saved idempotently in `SocialWebhookEvent` using `eventHash`.
- Processor: `src/server/social/webhook-processor.ts`, called by `POST /api/cron/social-webhooks`.
- Processor parses feed events into `SocialComment` and prunes processed events after 30 days.

## 6. Current API Architecture

Current API route list includes:

- Auth: `/api/auth/login`, `/api/auth/logout`
- AI generation: `/api/ai/generate`
- Contact/tracking/upload/media/files/internal redirects
- Cron: `/api/cron/crawl`, `/api/cron/publish`, `/api/cron/social-insights`, `/api/cron/social-publish`, `/api/cron/social-webhooks`
- Meta: both `/api/integrations/meta/*` and `/api/meta/*`
- Social publish runner: `/api/social/publish/run`

Current AI namespace is not yet a ChatGPT/AI Gateway:

- `/api/ai/generate` is an authenticated admin generation endpoint, not a scoped service-account API.
- It does not implement MASTER PROMPT endpoints like `/api/ai/pages`, `/api/ai/pages/:id/posts`, `/api/ai/content/drafts`, etc.
- It uses logged-in web session auth, not scoped API keys/service accounts.

## 7. Current AI Integrations

AI providers:

- Anthropic SDK
- OpenAI SDK
- Google Gemini SDK
- 9Router-compatible call path

Config models and query layer:

- `AiProviderConfig` model stores provider config.
- AI provider actions under `src/server/actions/ai-providers.ts`.
- Content generation/rewrite modules under `src/server/ai`, `src/server/content`, and social AI under `src/server/social/ai.ts`.

Social AI capabilities already present:

- Generate social strategy.
- Generate social plan/caption drafts.
- Generate group caption variants.

Risks:

- Existing `/api/ai/generate` returns AI output to authenticated admin clients, which is expected for CMS use.
- Future external AI Gateway must have separate auth/scopes and must not expose Meta tokens or unscoped tenant data.

## 8. Current Background Jobs / Cron / Queue

Cron auth helper: `src/server/http/cron-auth.ts` using `CRON_SECRET`.

Social cron routes:

- `POST /api/cron/social-publish`
  - calls `processSocialPublishQueue({ limit: 20 })`.
- `POST /api/cron/social-insights`
  - calls `syncSocialPostInsights(50)`.
- `POST /api/cron/social-webhooks`
  - calls `processSocialWebhookEvents(200)`.

Publisher behavior:

- Claim/lock model with `lockedAt` and `lockToken`.
- Retries via `attempts`, `maxAttempts`, `nextAttemptAt`, `permanentFailure`.
- Page posts require content to be approved and scheduled before publish.
- Group posting has guardrails and often falls back to `MANUAL_REQUIRED`.
- Metrics sync calls Meta after publish and upserts `SocialPostInsight`.

This is reusable for Phase D/E/I, but automation kill switches/status UI should be improved before expanding.

## 9. Deployment / Environment

Deployment artifacts inspected:

- `deploy/deploy.sh`
- `deploy/ecosystem.config.js`
- `deploy/env.production.example`
- Nginx config file exists as `deploy/nginx-gfvgo.com.conf`.

Known production app:

- Production path: `/var/www/gfvgo`.
- PM2 app: `gfvgo`.
- Next app serves behind Nginx on port 3001.

Environment variable references found:

- Core/auth/deploy: `DATABASE_URL`, `SESSION_SECRET`, `PRIMARY_HOST`, `ADMIN_HOST`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SERVER_PUBLIC_IP`, `NODE_ENV`, `NEXTAUTH_URL`
- AI: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NINER_ROUTER_API_KEY`, `NINER_ROUTER_BASE_URL`, `NINER_ROUTER_MODEL`
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_API_VERSION`, `META_GRAPH_VERSION`, `META_REDIRECT_URI`, `META_WEBHOOK_VERIFY_TOKEN`, `TOKEN_ENCRYPTION_KEY`
- Cron: `CRON_SECRET`
- Email: `RESEND_API_KEY`, `RESEND_FROM`
- Demo seed: `SEED_SOCIAL_DEMO`

Do not print `.env` values. The repo contains `.env*` and backup env files; treat them as secret material and do not commit/share.

## 10. Existing Tests

Tests found:

- `tests/ai-json.test.ts`
- `tests/auth-token.test.ts`
- `tests/cron-auth.test.ts`
- `tests/group-rules.test.ts`
- `tests/host-rules.test.ts`
- `tests/media-paths.test.ts`
- `tests/meta-config.test.ts`
- `tests/meta-oauth-state.test.ts`
- `tests/performance.test.ts`
- `tests/permissions.test.ts`
- `tests/publish-rules.test.ts`
- `tests/rate-limit.test.ts`
- `tests/ssrf-guard.test.ts`
- `tests/token-vault.test.ts`
- `tests/webhook-payload.test.ts`

Coverage strengths:

- OAuth state.
- Token vault.
- Webhook payload parsing.
- Cron auth.
- Permission ranking.
- Publish/group rules.
- SSRF/media path/rate-limit helpers.

Coverage gaps for MASTER PROMPT V2:

- No integration tests for `/api/meta/pages`, connect/disconnect/reconnect route family because these routes do not yet exist.
- No AI Gateway auth tests because scoped AI Gateway auth does not exist yet.
- No tenant cross-access tests for new social APIs that will be added.
- No comments UI/reply workflow tests.
- No app-review end-to-end OAuth browser test.

## 11. Reusable Modules

Can reuse directly:

- Tenant/member/role model and `requireTenantAccess`.
- Existing `SocialWorkspace` / `SocialPage` / `SocialConnection` / `SocialContent` / `SocialPublishTarget` schema.
- Token vault encryption utilities.
- OAuth state sealing/opening utilities.
- Meta webhook signature verification and event storage.
- Social webhook processor for feed/comment events.
- Social publishing queue and retry/idempotency structure.
- Social analytics/performance helpers.
- Audit log writer.
- Cron auth helper.
- Existing admin design system and social dashboard pages.
- AI provider config + social AI generation helpers.

Reusable with refactor:

- `src/server/meta/client.ts`: should become/act as the canonical `MetaGraphClient` abstraction, with more methods and clearer permission-aware errors.
- `/admin/social/planner`: can evolve into Content Studio rather than creating a separate disconnected tool.
- `/api/ai/generate`: keep as internal admin helper; do not use as external AI Gateway without separate scoped auth.

## 12. Missing Modules / Required Additions

For later phases, likely additions are:

### Meta Core / Pages API

Missing route family from MASTER PROMPT:

- `GET /api/meta/pages`
- `POST /api/meta/pages/connect`
- `POST /api/meta/pages/:id/disconnect`
- `POST /api/meta/pages/:id/reconnect`

Current connect logic exists as Server Action and OAuth session UI, not as these REST routes.

### Multi-Page Management

Need richer Page management fields/UI:

- Page avatar.
- external Page ID.
- category.
- workspace/project.
- connected status.
- token health.
- webhook status.
- last sync.
- permissions.
- followers/posts count if API allows.
- actions: view/sync/reconnect/disconnect/view posts/view insights/create post/open calendar.

Schema may need metadata fields or can initially derive from existing `SocialConnection.grantedScopes`, `lastValidatedAt`, `tokenExpiresAt`, `SocialPage.externalPageId`, `SocialPage.pageUrl`, and `SocialPostInsight`.

### Posts module

Need read-only recent posts store/UI:

- Current `getMetaPagePosts` can read posts live.
- Current DB stores internal publish targets and metrics, but not a general synced external-post table for arbitrary Page posts.
- Could either add a new table or map synced posts into `SocialPublishTarget` only when generated by GFVGO. For Page posts created outside GFVGO, a dedicated model is cleaner.

### Comments & Engagement

- `SocialComment` model and webhook processor exist.
- Missing dedicated UI for comments, unreplied filter, sentiment, suggested reply, manual reply action, and permission-aware reply/hide/delete.
- Need permissions `pages_manage_engagement` / `pages_read_user_content` before reply/deeper read.

### Analytics

- `SocialPostInsight` exists and syncs post counts/insights where available.
- Missing `social_analytics_daily` style general metric table.
- Need permission-aware unavailable states for `read_insights`.
- Need multi-Page compare/date range UI.

### Content Studio / Approval

- Planner/editor/status flow exists.
- Need richer Content Studio UX for selecting multiple Pages, media uploads, video/reel prep, preview, campaign/status filters, and explicit approval screens.
- Human approval is already encoded in statuses (`IN_REVIEW`, `APPROVED`, `SCHEDULED`) and publisher requires approved/scheduled content before posting.

### AI Connector / ChatGPT-ready Gateway

Missing entirely as a secure external API:

- Scoped API key/service account model.
- `/api/ai/pages` and related social read endpoints.
- `/api/ai/content/drafts`, analyze, schedule proposal endpoints.
- Pending-action approval workflow for publish/reply.
- AI gateway audit log metadata.

Important: do not let AI clients hold Meta tokens. AI Gateway must call GFVGO services server-side.

### Automation

- Existing social crons cover publish, insights, webhook processing.
- Need admin-safe automation rules for alerts: token expiry, webhook failure, disconnected Page, due content, sync reminders.
- Need kill switch for every write automation.

## 13. DB Changes Likely Needed Later

Do not migrate during Phase A. Later phases may need safe additive migrations.

Existing schema already covers many proposed tables:

- Proposed `social_accounts` ≈ existing `SocialPage` + `SocialConnection`.
- Proposed `social_posts` ≈ existing `SocialContent` + `SocialPublishTarget`, but only for GFVGO-created posts.
- Proposed `social_webhook_events` ≈ existing `SocialWebhookEvent`.
- Proposed `social_comments` ≈ existing `SocialComment`.

Potential additive schema needs:

1. Page metadata/status expansion
   - avatar URL
   - followers count
   - webhook status/error/last subscribed at
   - last synced at
   - business ID
   - disconnected/reconnect reason

2. Permission tracking
   - Existing `SocialConnection.grantedScopes` stores scopes/tasks.
   - A separate permissions table may help App Review/diagnostics but is not strictly required initially.

3. External Page posts
   - A table for posts fetched from Meta but not created by GFVGO.

4. Daily analytics
   - A `SocialAnalyticsDaily`-style table for historical metrics beyond per-publish-target insight snapshots.

5. AI Gateway
   - API keys/service clients.
   - Scopes.
   - pending actions / approval records.
   - draft provenance metadata.

6. Automation rules/alerts
   - Rule definitions.
   - last run status.
   - kill switch.
   - alert log.

All changes should be additive, indexed by tenant/workspace/page, and rolled out with migration dry-run before production deployment.

## 14. Production Risks

High-priority risks:

1. Production DB migrations
   - Must be additive and dry-run/backup-aware.
   - Current local migrate status failed due DB auth, so production migration procedure must be verified separately.

2. Auth regressions
   - Do not alter `30nice_session`, `/login`, `src/proxy.ts`, or `requireTenantAccess` without dedicated regression tests.

3. Tenant isolation / IDOR
   - New REST routes accepting `pageId`, `socialPageId`, `commentId`, or `targetId` must resolve records through tenant-access checks.

4. Token leakage
   - Never expose `encryptedToken`, raw Page token, App Secret, or debug token response to frontend/AI Gateway.

5. Permission over-requesting
   - Current OAuth requests publish scope. If App Review focus is read-only first, consider making publish scopes optional or staged.

6. Webhook spoofing/replay
   - Signature verification exists; retain it.
   - Event hashing is raw-body/index based. This is idempotent for identical deliveries but may not dedupe semantically identical events if Meta reorders or formats payload differently.

7. Queue/write automation
   - Publishing code exists. Keep human approval mandatory and keep write automation off by default.

8. Existing dirty repo
   - Repo has many pre-existing modified/untracked files. Any implementation must avoid broad resets, mass formatting, or clobbering unrelated changes.

9. Route family compatibility
   - Preserve both `/api/meta/*` and `/api/integrations/meta/*` until explicitly retired.

10. Public/site CMS behavior
   - Public homepage, legal pages, CMS catch-all, and `/admin/*` protection must be smoke-tested after any deployment.

## 15. Recommended Implementation Plan After Audit

Do not implement in a single blind step. Suggested sequence:

### Phase B — Meta Core Stabilization

- Decide whether OAuth should request read scopes only by default, with publish scope opt-in when enabling publish.
- Add REST routes required by prompt while reusing existing server actions/services:
  - `GET /api/meta/pages`
  - `POST /api/meta/pages/connect`
  - disconnect/reconnect endpoints
- Centralize permission-aware Meta errors.
- Add route tests where practical.

### Phase C — Multi-Page Management

- Expand `/admin/social/pages` into a full multi-Page dashboard.
- Add sync action and token/webhook status display.
- Add missing Page metadata fields only if needed.

### Phase D — Posts + Webhook

- Add posts read/sync UI using `getMetaPagePosts`.
- Add storage for external posts if needed.
- Keep webhook fast-response route unchanged.
- Improve webhook semantic idempotency and status reporting.

### Phase E — Analytics

- Add permission-aware insights fetch and UI states.
- Add daily analytics table if historic comparison is required.
- Never fake metrics; show unavailable if permission/API does not return data.

### Phase F — Content Studio

- Evolve planner/editor into Content Studio.
- Add multi-Page draft workflow, media/reel prep, preview, approval.
- Keep publish disabled until approved.

### Phase G — Comments

- Build comments UI from `SocialComment`.
- Add suggested reply via existing AI services.
- Manual reply only after permission/app review; no auto-reply by default.

### Phase H — AI Connector

- Create separate AI Gateway auth/scopes.
- Implement read + draft endpoints only first.
- Add pending action approval model before publish/reply endpoints.

### Phase I — Automation

- Add safe alert/sync rules first.
- Add kill switch for every automation.
- Keep write automation disabled by default.

### Phase J — Security + Tests + App Review

- Create/update `GFVGO_SOCIAL_SECURITY_REVIEW.md`.
- Extend tests for new route auth, tenant isolation, AI Gateway auth, webhook verify, and no token leakage.
- Update `META_APP_REVIEW_CHECKLIST.md` and final implementation report.

## 16. Phase A Conclusion

The codebase is not starting from zero. GFVGO already has:

- Multi-tenant CMS foundation.
- Tenant-aware auth/authorization.
- A substantial Social Growth OS module.
- Facebook OAuth, encrypted Page tokens, webhook verification/storage, publish queue, insights sync, content planner, calendar, analytics, group distribution, and social AI helpers.

The next phases should extend and harden this existing system rather than building a separate Facebook tool.

Most important next decisions before coding:

1. Whether to keep requesting `pages_manage_posts` in the initial OAuth scope or stage publish permissions later.
2. Whether to introduce dedicated external-post and daily-analytics tables now or defer until posts/analytics UI requirements are locked.
3. AI Gateway auth design: API key/service account/signed request, scope model, and approval table.
4. Production migration safety process, because local migrate status could not authenticate to the configured DB during audit.
