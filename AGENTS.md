# GFVGO — rules for every contributor (human or AI agent)

Read this whole file before changing anything. It is the single source of truth
for how this project is developed and shipped; `CLAUDE.md` only includes it.

## 1. Where things live

| What | Path | Rule |
|---|---|---|
| Git repo | `github.com/phanthuanxp/30nice-growth-os` | The only source of truth. |
| Dev checkout | `/root/.openclaw/workspace/projects/gfvgo` | Work here, on a branch. |
| Build clone | `/srv/gfvgo-src` | Used by `deploy/deploy.sh` only. Never edit. |
| Production | `/var/www/gfvgo` (PM2 `gfvgo`, port 3001) | **Never edit by hand.** Every deploy overwrites it from git. |
| Runtime data | `/var/www/gfvgo/.env.local`, `.data/`, `public/uploads/` | Not in git, never overwritten by deploys. |

Not this project: `cms.gfvgo.com` (WordPress, `/var/www/cms.gfvgo.com`) and
goforvietnam.com (`/opt/projects/booking-car-map`).

## 2. Workflow

1. `git checkout main && git pull`, then `git checkout -b <type>/<short-name>`
   (`feat/`, `fix/`, `chore/`, `docs/`).
2. Make the change. Keep it to one topic.
3. Before committing, all four must pass:
   ```bash
   npm run typecheck && npm run lint && npm test && npm run build
   ```
4. Commit with a conventional message (`feat: …`, `fix: …`, `chore: …`) that says *why*.
5. Push the branch and open a PR. CI (`.github/workflows/ci.yml`) runs the same checks.
6. Merge to `main` only when CI is green.
7. Deploy: GitHub → Actions → **Deploy to VPS** → Run workflow, or on the VPS
   `bash /srv/gfvgo-src/deploy/deploy.sh origin/main`. The script backs up source
   and DB, migrates, tests, builds, reloads PM2 and smoke-tests. The deployed
   commit is written to `/var/www/gfvgo/REVISION`.

Do **not**: edit `/var/www/gfvgo`, rsync/scp code to the server, run `prisma db push`,
leave work uncommitted, or write phase/report `.md` files at the repo root
(put lasting docs in `docs/`, throwaway notes nowhere).

## 3. Conventions

- Name: the product is **GFVGO** (domain `gfvgo.com`). Do not introduce `30nice` names.
- Database changes: edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <change>`
  and commit the migration. Production applies it with `prisma migrate deploy`.
- Request-level rules (host policy, auth redirect, tenant redirects) live only in
  `src/proxy.ts`. A root-level `proxy.ts`/`middleware.ts` is ignored by Next.js here.
- Session cookie name: `src/server/auth/cookie.ts`. Signing/expiry: `src/server/auth/token.ts`.
- Outbound fetches to user-supplied URLs must go through `safeFetch` (`src/server/http/ssrf-guard.ts`).
- Meta: canonical routes are `/api/integrations/meta/*`; `/api/meta/{callback,login,webhook}`
  are aliases kept because they are registered in the Meta App. Docs: `docs/meta/`.
- Secrets only in `.env.local` on the server (mode 600). Never print or commit them.
- New logic gets a test in `tests/` (Node test runner: `npm test`).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
