# 30Nice Growth OS Upgrade Plan

_Last updated: 2026-06-12_

## 1. Current Situation

Project path:

```text
/root/.openclaw/workspace/projects/30nice-growth-os
```

Production/admin domain:

```text
https://admin.30nice.vn
```

Current public tenant/site:

```text
https://taxibacninh.vn
https://www.taxibacninh.vn
```

Upgrade archive supplied by owner:

```text
/root/.openclaw/workspace/projects/30nice-growth-os/30nice-upgrade-v2-full.tar.gz
```

Current status verified before this plan:

- `admin.30nice.vn` is live and redirects unauthenticated users to `/login`.
- `taxibacninh.vn` and `www.taxibacninh.vn` return `200 OK`.
- Live public title: `Taxi Bắc Ninh - Đặt Xe 24/7, Giá Trọn Gói | 30Nice Growth OS`.
- `npm run typecheck` passed.
- `npm run build` passed.
- Warning exists: Next.js detects multiple lockfiles and infers workspace root from `/root/.openclaw/workspace/package-lock.json`.
- Repository currently has many local modified/untracked files. Do not overwrite blindly.

Current database snapshot observed via Prisma:

```text
organization: 1
tenant: 1
domain: 1
siteSettings: 1
page: 4
post: 10
category: 2
mediaAsset: 2
analyticsEvent: 2
aiProviderConfig: 2
lead: 0
menu: 0
user: 0
```

Current tenant:

```text
Name: Taxi Bắc Ninh
Slug: taxi-bac-ninh
Primary domain: taxibacninh.vn
Status: ACTIVE
Theme: taxi
Phone: 0961657891
Email: info@taxibacninh.vn
```

## 2. Product Vision

The project should evolve from a multi-site CMS MVP into **30Nice Growth OS**:

```text
Core Platform
→ CMS / Website Builder
→ AI Content Engine
→ SEO Engine
→ Lead Center
→ Analytics & Tracking
→ Ads Management
→ Automation / Notifications
```

The goal is not only to manage websites, but to manage the full growth loop:

```text
Website / Landing Page
→ Content / SEO / Ads traffic
→ Tracking / Analytics
→ Lead capture
→ Lead follow-up / automation
→ Reporting
→ AI-assisted optimization
```

## 3. Key Architectural Principles

### 3.1 Use a modular monolith first

Keep one Next.js app for now. Do not prematurely split into microservices.

Recommended direction:

```text
src/modules/core
src/modules/auth
src/modules/tenants
src/modules/cms
src/modules/builder
src/modules/themes
src/modules/ai-content
src/modules/seo
src/modules/leads
src/modules/analytics
src/modules/ads
src/modules/notifications
src/modules/integrations
src/modules/automations
```

Each module may contain:

```text
actions.ts
queries.ts
types.ts
validators.ts
services/
components/
```

Do not move everything at once. Introduce this structure gradually as features are upgraded.

### 3.2 Tenant safety is mandatory

All tenant-owned data must be scoped by `tenantId` or `organizationId`.

Preferred:

```text
getPosts(tenantId)
getLeads(tenantId)
getAnalytics(tenantId)
```

Avoid global queries unless explicitly guarded for `SUPER_ADMIN`.

### 3.3 Data model and permissions before UI

Do not add UI screens before the schema, services, and permission model are correct.

Order of implementation:

```text
Schema
→ services/actions/queries
→ permission guards
→ UI
→ tests/build
→ smoke test
```

### 3.4 No destructive database operations without backup

Do not run:

```bash
npx prisma db push --accept-data-loss
```

unless a DB backup exists and the data-loss impact has been explicitly reviewed.

Use migrations where possible.

## 4. Recommended Target Admin Navigation

Global/admin level:

```text
Dashboard
Sites
Content
Builder
SEO
AI Content
Leads
Analytics
Ads
Automations
Integrations
Users
Settings
```

Inside a site:

```text
Site Overview
Pages
Blog
Media
Menus
Forms
Theme / Builder
SEO
Leads
Analytics
Settings
Domains
```

## 5. Target Data Model Direction

Current schema already has useful foundations:

```text
User
Organization
OrganizationMember
Tenant
TenantMember
SiteSettings
Domain
Page
Category
Post
MediaAsset
Menu
MenuItem
Lead
AiUsageLog
SeoAudit
Integration
AutomationJob
AiProviderConfig
AnalyticsEvent
```

Recommended additions over time:

### 5.1 Core

```text
AuditLog
ApiKey
Plan
Subscription
```

`Plan` and `Subscription` can wait until SaaS/rental features are needed.

### 5.2 CMS

```text
PageRevision
PostRevision
PageBlock
RedirectRule
Form
FormField
FormSubmission
```

Important: distinguish raw `FormSubmission` from normalized `Lead`.

### 5.3 Builder / Theme System

```text
Theme
ThemeTemplate
ThemeBlock
TenantTheme
BlockPreset
```

Short-term: keep hard-coded React themes, but store configurable block/theme metadata in DB.

### 5.4 AI Content

```text
AiPromptTemplate
AiContentJob
AiContentBrief
AiGeneratedDraft
ContentCalendarItem
```

### 5.5 SEO / Search Growth

```text
SeoIssue
SeoKeyword
SeoPageMetric
SearchConsoleProperty
SearchConsoleQuery
SearchConsolePage
SitemapSubmission
```

### 5.6 Lead Center

```text
LeadActivity
LeadNote
LeadSource
LeadAssignment
LeadStatusHistory
LeadNotification
```

### 5.7 Analytics

```text
ConversionEvent
TrafficSource
DailySiteMetric
PageMetric
PostMetric
```

### 5.8 Ads

```text
AdAccount
AdCampaign
AdGroup
AdCreative
AdSpendDaily
AdConversion
```

### 5.9 Notifications / Automation

```text
NotificationProvider
NotificationTemplate
NotificationRule
NotificationLog
AutomationRun
WebhookEndpoint
```

## 6. Upgrade Roadmap

### Phase 0 — Freeze and backup current state

Must happen before any meaningful upgrade.

Tasks:

1. Backup project source.
2. Backup `.env` and `.env.local` separately.
3. Backup database.
4. Backup uploaded media/files.
5. Commit or tag the current working state if possible.
6. Extract upgrade archive into a temporary directory only.
7. Diff archive against current code before applying anything.

Suggested commands should be adapted to the actual production location and DB credentials:

```bash
cd /root/.openclaw/workspace/projects/30nice-growth-os
mkdir -p .upgrade-work/backups .upgrade-work/extracted

# Source backup, excluding heavy/generated directories where appropriate.
tar --exclude=node_modules --exclude=.next --exclude=.git \
  -czf .upgrade-work/backups/source-pre-upgrade-$(date +%Y%m%d-%H%M%S).tar.gz .

# Env backup.
cp -a .env .upgrade-work/backups/.env.pre-upgrade.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
cp -a .env.local .upgrade-work/backups/.env.local.pre-upgrade.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Extract supplied upgrade archive to temp only.
tar -xzf 30nice-upgrade-v2-full.tar.gz -C .upgrade-work/extracted
```

Database backup example:

```bash
# Use DATABASE_URL from .env/.env.local. Verify before running.
pg_dump "$DATABASE_URL" > .upgrade-work/backups/db-pre-upgrade-$(date +%Y%m%d-%H%M%S).sql
```

### Phase 1 — Core Platform Foundation

Goal: make the system safe and tenant-aware before expanding features.

Tasks:

- Replace demo credential login with real DB-backed users.
- Seed a real `SUPER_ADMIN` user.
- Use bcrypt password hashing.
- Implement route/action-level RBAC.
- Ensure all admin queries are tenant/organization scoped.
- Add user management screens.
- Add audit logs for critical actions.
- Harden session cookie config.

Do not build Ads/GSC/advanced automation before this phase is stable.

Required checks:

```bash
npm run typecheck
npm run build
```

Smoke tests:

```text
https://admin.30nice.vn/login
https://admin.30nice.vn/admin/dashboard
https://taxibacninh.vn
https://taxibacninh.vn/blog
```

### Phase 2 — CMS Foundation

Goal: turn the current MVP into a reliable multi-site CMS.

Tasks:

- Pages/posts/media/menu management should be tenant-safe.
- Add page/post revision model if feasible.
- Add form builder and form submissions.
- Add redirect manager.
- Improve sitemap/robots/canonical/schema handling.
- Add preview/publish workflow where needed.
- Improve media library and upload safety.

Required checks:

```bash
npm run typecheck
npm run build
```

### Phase 3 — Builder and Theme System

Goal: make the taxi theme configurable and move toward no-code site building.

Tasks:

- Keep existing React themes working.
- Introduce theme/block schema gradually.
- Start with taxi theme blocks:

```text
Hero
Services
Popular routes
Pricing
Trust badges
FAQ
Blog preview
CTA strip
Floating Call/Zalo
Lead form
```

- Store block content/config in DB where practical.
- Add preview before publish.

### Phase 4 — Lead Center

Goal: make leads operational, not just stored.

Tasks:

- Lead inbox.
- Lead pipeline/status history.
- Lead source and UTM tracking.
- Track call/Zalo/form/CTA events.
- Lead notes.
- Follow-up tasks/reminders.
- Export.
- Notification hooks.

Suggested lead statuses:

```text
NEW
CONTACTED
QUALIFIED
WON
LOST
SPAM
```

If changing enum values, handle migration carefully.

### Phase 5 — AI Content Engine

Goal: turn AI writing into a full editorial workflow.

Tasks:

- Topic planner.
- Keyword clusters.
- AI content brief.
- AI draft generation.
- Human review/approval.
- SEO score/checklist.
- Internal link suggestions.
- Content calendar.
- Scheduled publishing.
- AI usage and cost report.

### Phase 6 — SEO and Google Search Console

Goal: make the platform a search-growth system.

Tasks:

- Technical SEO audit dashboard.
- Missing/duplicate title and meta checks.
- H1/H2 checks.
- Broken link/404 tracking.
- Redirect and canonical manager.
- Schema manager.
- GSC integration models.
- Sitemap submit and URL inspection readiness.
- AI recommendations based on GSC data.

### Phase 7 — Analytics and Ads

Goal: connect traffic, content, lead, and spend.

Tasks:

- Page views.
- CTA clicks.
- Call/Zalo/WhatsApp clicks.
- Form conversion tracking.
- UTM attribution.
- GA4 integration.
- Google Ads and Meta Ads models/integration later.
- ROI, CPA, ROAS reporting after conversion tracking is reliable.

### Phase 8 — Automation and Notifications

Goal: automate growth operations.

Tasks:

- Notification providers:

```text
Telegram
Zalo
WhatsApp
Email
SMS
```

- Notification rules.
- Notification templates.
- Delivery logs.
- Lead alerts.
- SEO issue alerts.
- Content publish reports.
- Weekly growth summaries.

## 7. How to Handle the Supplied Upgrade Archive

Do not blindly extract it over the project.

Required process:

1. Extract to temp:

```bash
mkdir -p .upgrade-work/extracted
rm -rf .upgrade-work/extracted/*
tar -xzf 30nice-upgrade-v2-full.tar.gz -C .upgrade-work/extracted
```

2. List archive content:

```bash
tar -tzf 30nice-upgrade-v2-full.tar.gz | sort
```

3. Compare file-by-file:

```bash
diff -ru --exclude=node_modules --exclude=.next . .upgrade-work/extracted
```

Better: compare only relevant paths first:

```bash
diff -ru prisma .upgrade-work/extracted/prisma
diff -ru src/app .upgrade-work/extracted/src/app
diff -ru src/components .upgrade-work/extracted/src/components
diff -ru src/server .upgrade-work/extracted/src/server
```

4. Apply changes in layers:

```text
schema → server/actions/queries → admin/API → public/theme → build/test
```

5. After every meaningful layer:

```bash
npm run typecheck
npm run build
```

6. Do not deploy if these fail.

## 8. Definition of Done for Any Upgrade Phase

A phase is complete only when all of these are true:

- Source and DB backups exist.
- Prisma/schema changes are reviewed.
- No unreviewed destructive DB command was run.
- `npm run typecheck` passes.
- `npm run build` passes.
- Admin smoke test passes.
- Public tenant smoke test passes.
- Changed files are summarized.
- Rollback path is known.

## 9. Suggested Claude CLI Task Brief

Use this brief when asking Claude CLI to work on the project:

```text
You are upgrading 30Nice Growth OS at:
/root/.openclaw/workspace/projects/30nice-growth-os

Read 30NICE_GROWTH_OS_UPGRADE_PLAN.md first and follow it.

Current production/admin domain:
https://admin.30nice.vn

Current public tenant:
https://taxibacninh.vn

Supplied upgrade archive:
/root/.openclaw/workspace/projects/30nice-growth-os/30nice-upgrade-v2-full.tar.gz

Do not blindly extract over the project.
Do not run prisma db push --accept-data-loss unless a DB backup exists and you report the impact first.
Do not deploy production unless typecheck/build pass.

First task:
Phase 0 + Phase 1 only.

Deliverables:
1. Backup source/env/DB/media.
2. Extract archive to temp and diff it.
3. Implement Core Platform Foundation:
   - real DB user login
   - seed SUPER_ADMIN
   - bcrypt password hashing
   - RBAC guards
   - tenant-safe admin access
   - audit log if feasible
4. Run npm run typecheck.
5. Run npm run build.
6. Smoke test admin.30nice.vn/login and taxibacninh.vn.
7. Report changed files, migration impact, and rollback instructions.
```

## 10. Important Cautions

- The live tenant `taxibacninh.vn` contains real data. Preserve it.
- Current repository has local changes. Preserve them.
- `.env` and `.env.local` contain secrets. Do not expose them in logs or reports.
- Do not convert this into many microservices yet.
- Do not prioritize Ads/GSC before Core/Auth/CMS/Lead foundations are stable.
- The system should become a product, not just a collection of pages.

---

## 12. Product Direction Update — AI Travel News CMS (2026-06-22)

Owner direction: `30nice-growth-os` / `admin.30nice.vn` should focus on English-language travel, news, and review sites for foreign visitors. Lead generation, forms, and booking flows are paused and should not receive near-term upgrade effort.

### 12.1 New Core Product Loop

```text
Root domain + niche
→ AI keyword research
→ topic/location/tourist-entity clustering
→ subdomain suggestions, e.g. halongbay.domain.com
→ SEO content plan per subdomain
→ source/crawl article discovery
→ AI rewrite/transform into original English content
→ SEO optimization
→ scheduled publishing
→ sitemap/indexing/analytics feedback
```

### 12.2 Priority Modules

1. **Subdomain Factory**
   - Generate subdomain ideas from keywords, locations, destinations, and travel entities.
   - Score each idea by SEO opportunity, topical depth, and subdomain quality.
   - Example: `halong bay travel guide` → `halongbay.domain.com`.

2. **Keyword Intelligence**
   - Generate seed keywords, expand them, classify intent, and cluster by destination/topic.
   - Cluster types: destination, hotel/review, itinerary, transport, food/nightlife, seasonal, comparison.

3. **Content Source / Crawl Engine**
   - Manage source sites, sitemaps, RSS/manual URL imports, crawl queues, dedupe hashes, and extracted article text.

4. **AI Rewrite + SEO Optimizer**
   - Extract facts/entities, create a new outline, rewrite in English, add helpful travel sections, optimize title/meta/schema/internal links.

5. **Publishing Scheduler**
   - Plan and schedule pillar/supporting articles per subdomain.

### 12.3 Paused / Legacy Modules

Do not prioritize upgrades for:

- Lead Center
- Forms
- Booking
- CRM/follow-up automations
- Lead exports/notifications

Keep these modules only as legacy/optional until the travel content engine is stable.

### 12.4 Safe Schema Direction

Avoid destructive migrations until baseline is clean. Proposed future models:

```text
SubdomainPlan(rootDomain, subdomain, niche, primaryLocation, language, seoScore, opportunityScore, status)
ContentSource(name, baseUrl, sourceType, language, niche, crawlStatus)
SourceArticle(sourceId, url, title, extractedText, canonicalUrl, contentHash, status)
ContentRewriteJob(sourceArticleId, tenantId, targetKeywordId, status, generatedOutline, generatedContent, seoTitle, metaDescription, qualityScore)
ContentPlan(subdomainPlanId/tenantId, topic, goal, status)
ContentPlanItem(contentPlanId, keyword, title, intent, articleType, priority, scheduledAt, status)
```
