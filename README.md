# 30Nice Growth OS — Phase 1 MVP

Custom multi-tenant CMS and growth platform. Replaces WordPress gradually as the central CMS for 30Nice-managed websites.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 |
| Database ORM | Prisma 7 |
| Database | PostgreSQL (any v14+) |
| Validation | Zod 4 |
| Session | HMAC-signed cookie (custom, no library) |

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd 30nice-growth-os
npm install
```

### 2. Environment variables

Copy `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/30nice_growth_os"
SESSION_SECRET="generate-with-openssl-rand-hex-32-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a session secret:
```bash
openssl rand -hex 32
```

### 3. Database setup

```bash
# Create DB (if it doesn't exist)
createdb 30nice_growth_os

# Push schema
npm run db:push

# Generate Prisma client
npm run prisma:generate

# Seed demo data
npm run seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/admin/dashboard`.

---

## Demo Login

> **MVP only** — demo credentials. Replace with database-backed auth in production.

| Field | Value |
|---|---|
| Email | `admin@30nice.vn` |
| Password | `admin123` |
| Role | `SUPER_ADMIN` |

---

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Create migration |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio UI |

---

## Architecture

```
src/
├── app/
│   ├── admin/             # Protected admin routes
│   │   ├── layout.tsx     # Admin layout (sidebar + header)
│   │   ├── dashboard/     # Growth dashboard
│   │   ├── sites/         # Multi-tenant site management
│   │   ├── pages/         # CMS pages
│   │   ├── blog/          # Blog posts & categories
│   │   ├── media/         # Media library
│   │   ├── menus/         # Navigation menus
│   │   ├── leads/         # Lead center inbox
│   │   ├── settings/      # Site settings
│   │   ├── seo-ai/        # SEO AI (Phase 2 placeholder)
│   │   ├── analytics/     # Analytics (Phase 2 placeholder)
│   │   ├── ads/           # Ads (Phase 3 placeholder)
│   │   ├── automation/    # Automation (Phase 3 placeholder)
│   │   └── reports/       # Reports (Phase 3 placeholder)
│   ├── api/
│   │   ├── auth/login/    # POST — login
│   │   ├── auth/logout/   # POST — logout
│   │   └── contact/       # POST — public lead capture
│   ├── login/             # Login page
│   ├── blog/              # Public blog listing + detail
│   └── [[...slug]]/       # Public page renderer (tenant-resolved)
├── components/
│   ├── admin/             # Sidebar, header, stat-card, coming-soon
│   ├── public/            # PageRenderer (block-based)
│   └── ui/                # Button, Badge, Card, Input, Table, Select
├── server/
│   ├── auth/session.ts    # HMAC cookie session
│   ├── db/index.ts        # Prisma singleton
│   ├── importers/         # WordPress import placeholders
│   ├── permissions/       # Role rank helpers
│   ├── queries/           # Demo data (pre-DB)
│   └── tenant/resolve.ts  # Resolve tenant by request host
├── middleware.ts           # Route protection (admin requires session)
└── lib/utils.ts           # cn() helper
prisma/
├── schema.prisma          # Full 20-model schema
└── seed.ts                # Demo org, users, tenants, pages, posts, leads
```

### Multi-Tenant Model

Each content record (Page, Post, MediaAsset, Lead, etc.) has a `tenantId` field. The `resolveTenant()` utility reads the request host and matches it against `Domain` records to determine the active tenant.

### Roles

`SUPER_ADMIN` > `AGENCY_ADMIN` > `TENANT_ADMIN` > `EDITOR` > `VIEWER`

Role checks via `can(role, minRole)` in `src/server/permissions/index.ts`.

---

## Phase 1 Modules (Implemented)

| Module | Status |
|---|---|
| Auth (cookie session, roles) | ✅ |
| Multi-tenant site management | ✅ |
| CMS pages (block-based) | ✅ |
| Blog posts & categories | ✅ |
| Media library (UI + model) | ✅ |
| Menu management | ✅ |
| Lead center | ✅ |
| Growth dashboard | ✅ |
| Public page renderer | ✅ |
| Public blog routes | ✅ |
| Contact form API | ✅ |
| Prisma schema (20 models) | ✅ |
| Seed data | ✅ |
| WordPress importer placeholders | ✅ |

## Upcoming Phases

| Module | Phase |
|---|---|
| SEO AI engine | Phase 2 |
| Analytics & tracking | Phase 2 |
| Real file upload (media) | Phase 2 |
| Ads management | Phase 3 |
| Automation workflows | Phase 3 |
| Report generation | Phase 3 |
| Database-backed auth (bcrypt) | Phase 2 |
| WordPress importer (real) | Phase 2 |
| Page block editor UI | Phase 2 |

---

## Known Limitations (MVP)

1. **Demo auth only** — credentials hardcoded. Replace `DEMO_CREDENTIALS` in `session.ts` with DB lookup + bcrypt.
2. **Demo data** — admin pages use `src/server/queries/demo-data.ts` (in-memory). Connect to Prisma once DB is provisioned.
3. **No real file upload** — media library shows placeholder UI only.
4. **Contact API requires DB** — `POST /api/contact` writes to PostgreSQL via Prisma. Requires `DATABASE_URL`.
5. **Public page renderer** — currently shows a simplified hero block. Full block rendering needs DB-loaded `uiBlocks` JSON.
6. **No pagination** — all lists show first N demo records.
