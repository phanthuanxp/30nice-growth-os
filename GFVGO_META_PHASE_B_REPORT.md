# GFVGO Meta Phase B Report — Meta Core Stabilization

Date: 2026-09-14
Project: `gfvgo` / `gfvgo.com`
Scope: Phase B only. No Phase C+ work, no production deployment, no DB migration, no production reload.

## Summary

Implemented Meta Core Stabilization by extending the existing Meta/Social Growth OS implementation instead of creating a new Facebook module. Existing OAuth, `/api/meta/*` aliases, callback/webhook URLs, token vault, publisher, session cookie, `/login`, and tenant permission model were preserved.

The key App Review blocker was addressed: `pages_manage_posts` is no longer part of the default OAuth scope request. Publishing permission is now opt-in/configurable.

## Files Changed / Added

- `src/server/meta/client.ts`
  - Kept existing App ID/callback/Graph API version behavior.
  - Changed default required scopes to read/core scopes only.
  - Added `META_REQUEST_PUBLISH_SCOPE` opt-in handling.
  - Added `getMetaOAuthScopes()` for staged permission requests.
  - Exposed `requestPublishScope` as a boolean configuration status without exposing secrets.

- `src/server/meta/errors.ts`
  - Added normalized Meta error classification:
    - `token_expired`
    - `permission_missing`
    - `reconnect_required`
    - `page_access_lost`
    - `rate_limited`
    - `unknown`

- `src/server/meta/pages-service.ts`
  - Added service layer for Phase B page REST routes.
  - Reuses:
    - existing `requireAuth()` / `30nice_session`
    - `requireTenantAccess()`
    - Prisma `SocialPage`, `SocialConnection`, `MetaOAuthSession`
    - existing token vault decrypt flow
    - existing Meta helpers from `src/server/meta/client.ts`
  - Does not return raw User/Page access tokens.
  - Clears encrypted page-token session payload after successful connect.

- `src/app/api/meta/pages/route.ts`
  - Added `GET /api/meta/pages`.

- `src/app/api/meta/pages/connect/route.ts`
  - Added `POST /api/meta/pages/connect`.

- `src/app/api/meta/pages/[id]/disconnect/route.ts`
  - Added `POST /api/meta/pages/:id/disconnect`.

- `src/app/api/meta/pages/[id]/reconnect/route.ts`
  - Added `POST /api/meta/pages/:id/reconnect`.

- `tests/meta-config.test.ts`
  - Updated expectations so default required scopes are read/core only.

- `tests/meta-phase-b.test.ts`
  - Added Phase B regression tests covering staged permissions, required route files, tenant/token-vault reuse, token non-leak checks, no hardcoded smoke Page, and normalized Meta errors.

## Routes Added

- `GET /api/meta/pages`
  - Lists Facebook `SocialPage` records visible to the authenticated user based on tenant access.
  - Returns page/connection metadata, granted scopes, missing read/publish scopes, and `canPublish`.
  - Never returns raw tokens.

- `POST /api/meta/pages/connect`
  - Body: `{ "oauthSessionId": "...", "externalPageId": "..." }`
  - Uses an existing unconsumed `MetaOAuthSession` belonging to the current user.
  - Validates tenant access through the session's `SocialPage` workspace tenant.
  - Validates the selected external Page/token against Meta.
  - Upserts `SocialConnection` and marks `SocialPage` connected.
  - Subscribes Page webhook using existing helper, best-effort.
  - Does not expose Page tokens.

- `POST /api/meta/pages/:id/disconnect`
  - Requires tenant admin access to the target page's workspace tenant.
  - Deletes the stored `SocialConnection`.
  - Resets the page to setup state and clears external Page metadata.
  - Marks scheduled/failed publish targets as failed to avoid stale automated publishing.

- `POST /api/meta/pages/:id/reconnect`
  - Requires tenant admin access.
  - Returns `/api/meta/login?pageId=...` so the existing OAuth flow can be reused.

## Permission Strategy

Default OAuth scopes now request only core/read permissions:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_metadata`
- `business_management`

Publishing permission is opt-in only:

- `pages_manage_posts`

To request publish permission for flows that genuinely need publishing, set:

```env
META_REQUEST_PUBLISH_SCOPE=true
```

If unset/false, OAuth does not request `pages_manage_posts`. This should reduce Meta App Review friction while preserving the ability to request publishing later for approved workflows.

## Security Notes

- Raw User/Page access tokens are not returned by the new route responses.
- The list route only returns connection metadata and scopes.
- Connect route decrypts the selected Page token server-side only.
- `MetaOAuthSession.encryptedPageTokens` is cleared after successful connect.
- Tenant access checks are required before connect/disconnect/reconnect operations.
- The smoke-test Page name/ID (`Pet Suphub - Daily Cute Pets`, `541436539349001`) was not hardcoded in production logic.

## Test / Build Results

Passed:

```bash
npm test -- tests/meta-phase-b.test.ts tests/meta-config.test.ts tests/meta-oauth-state.test.ts
# Result: 169 tests passed, 0 failed
```

Passed:

```bash
npm run typecheck
# Result: tsc --noEmit passed
```

Not run yet in this Phase B turn:

```bash
npm run build
```

## Deployment Notes

No production deployment was performed in this phase turn.

Before deploying, recommended gates:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`
4. Verify production env policy for `META_REQUEST_PUBLISH_SCOPE`:
   - leave unset/false for App Review read/core flow
   - set true only for explicit publish-permission review/testing
5. Deploy without DB migration unless a future phase introduces schema changes.
6. Smoke test:
   - `/`
   - `/login`
   - `/admin/dashboard` unauth redirect
   - `/api/meta/login`
   - `/api/meta/callback`
   - `/api/meta/webhook`
   - `/api/meta/pages` as authenticated admin

## Risks / Follow-ups

- The new connect route depends on existing `MetaOAuthSession.availablePages` and `encryptedPageTokens` shape from the callback flow; manual OAuth E2E should confirm current callback data exactly matches production Meta responses.
- Production database connectivity/migration status was not touched; prior audit noted local Prisma migration status failed with DB access denial.
- Real Meta OAuth testing requires an authenticated admin browser session and real Facebook consent flow.
- The `META_REQUEST_PUBLISH_SCOPE` env should be documented for operators and kept disabled by default during read-only App Review.
