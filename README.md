# GFVGO

Multi-tenant CMS and growth platform behind **https://gfvgo.com**: sites and
domains, pages and blog, media, SEO/AI content pipeline (crawl → rewrite →
review → publish), analytics, and Social Growth OS (Meta Page publishing).

**Before contributing, read [AGENTS.md](AGENTS.md)** — workflow, deploy and conventions.

## Stack

Next.js 16 (App Router, `src/`) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
Prisma 7 + PostgreSQL · Zod 4 · Node test runner. AI providers: Anthropic, OpenAI,
Gemini (configured in Admin → Settings → AI).

## Local setup

```bash
npm ci
cp deploy/env.production.example .env.local   # then fill in values
npx prisma migrate deploy
npm run prisma:generate
npm run seed        # optional demo data
npm run dev
```

Prisma CLI does not read `.env.local` by itself; export it first
(`set -a; . ./.env.local; set +a`) before `prisma migrate …`.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests in `tests/` |
| `npm run build` | Production build |
| `npm run seed` | Seed demo data |

## Layout

```
src/
  app/            routes: public site, /admin, /api (auth, cron, integrations/meta, internal, …)
  components/     admin/, marketing/, public/, ui/
  server/         auth, db, http (host rules, SSRF guard), meta, social, content, ai, tenant, …
  proxy.ts        the only request proxy: host policy, admin auth redirect, tenant redirects
prisma/           schema.prisma, migrations/, seed.ts
tests/            node:test unit tests
deploy/           deploy.sh, PM2 ecosystem, nginx and env examples
docs/             meta/ (Meta App setup/review), archive/ (historic phase reports)
.github/workflows ci.yml, deploy.yml (manual), cron triggers
```

## Production

PM2 app `gfvgo` on port 3001 behind nginx (`deploy/nginx-gfvgo.com.conf`), DB
`growth_os_db` on localhost. Deploy only via `deploy/deploy.sh` (see AGENTS.md).

## Known gaps

- Repository is still named `30nice-growth-os`.
