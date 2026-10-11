# Meta Integration Security Review — GFVGO Growth Platform

## Secrets

The following values must exist only in server environment variables and must never be printed in logs or committed:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `TOKEN_ENCRYPTION_KEY`

## OAuth State

- OAuth state is HMAC-signed using `SESSION_SECRET`.
- State includes nonce, user id, internal SocialPage id, and expiry.
- Callback rejects missing, expired, tampered, mismatched, or cross-user state.
- OAuth cookie is HttpOnly, SameSite=Lax, Secure in production.
- Cookie path is `/api` so both `/api/meta/callback` and legacy `/api/integrations/meta/callback` work.

## Token Storage

- Page tokens are encrypted with AES-256-GCM in `src/server/crypto/token-vault.ts`.
- `TOKEN_ENCRYPTION_KEY` must be at least 32 characters.
- Temporary OAuth session token map is deleted/nulled after a Page is selected.
- Tokens are decrypted only server-side for validation, read-only Graph calls, webhook subscription, and publish jobs.

## Webhooks

- Verify endpoint checks `META_WEBHOOK_VERIFY_TOKEN`.
- POST endpoint validates `x-hub-signature-256` using `META_APP_SECRET`.
- Raw body is limited to 1MB before JSON processing.
- Events are stored idempotently with a SHA-256 event hash.

## Tenant Isolation

- OAuth start requires logged-in user and selected internal SocialPage.
- SocialPage → Workspace → Tenant is checked with `TENANT_ADMIN` access.
- Page selector only consumes OAuth sessions owned by the current user.
- Tenant hosts cannot access `/admin` or `/login`; primary `gfvgo.com` remains admin-capable.

## Production Deployment Rules

- Do not change Meta App ID without explicit owner instruction.
- Do not change live callback abruptly; deploy aliases first.
- Do not hardcode any specific external Page ID.
- Run `npm run typecheck` and `npm run build` before PM2 reload.
- Keep production backup for touched files before each deploy.
