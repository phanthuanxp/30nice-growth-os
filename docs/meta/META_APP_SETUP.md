# META_APP_SETUP.md

Date: 13/09/2026
Project: gfvgo / GFVGO Growth Platform

## Public pages for Meta App Review
Use these production URLs:

- App domain: `gfvgo.com`
- Website URL: `https://gfvgo.com/`
- Privacy Policy URL: `https://gfvgo.com/privacy-policy`
- Terms of Service URL: `https://gfvgo.com/terms-of-service`
- Data Deletion Instructions URL: `https://gfvgo.com/data-deletion`

Vietnamese equivalents:

- `https://gfvgo.com/chinh-sach-bao-mat`
- `https://gfvgo.com/dieu-khoan-su-dung`
- `https://gfvgo.com/xoa-du-lieu`

## OAuth callback
Current integration code uses:

- `https://gfvgo.com/api/integrations/meta/callback`

If `META_REDIRECT_URI` is set in production, ensure it exactly matches the URL configured in Meta Developers.

## Webhook callback
Current webhook route:

- `https://gfvgo.com/api/integrations/meta/webhook`

The webhook verify token must be configured through `META_WEBHOOK_VERIFY_TOKEN` in server environment. Do not expose it publicly.

## Environment variables
Required or relevant server variables:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_GRAPH_VERSION`
- `META_REDIRECT_URI`
- `META_WEBHOOK_VERIFY_TOKEN`
- `TOKEN_ENCRYPTION_KEY`

Never commit real secrets/tokens to the repository or expose them in screenshots/docs.

## Current permission scope observed in code
The Meta connect flow requests:

- `pages_show_list`
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_manage_metadata`

Use App Review text that describes actual product behavior:

1. User logs into GFVGO Growth Platform.
2. User connects their Facebook account and selects Pages they manage.
3. The system stores encrypted Page connection data server-side.
4. User can create, schedule, publish, and review content/engagement for connected Pages from the admin dashboard.
5. User can remove/disconnect integrations and request data deletion.

## Review notes
Do not claim features that are not implemented. Safe claims:

- Facebook Page connection
- Page list and page selection
- Page publishing workflow
- Engagement/analytics workflows where implemented
- Comment/content management where implemented in admin modules

Avoid unsupported claims:

- Guaranteed SEO results
- Full certification/security audit unless independently completed
- Access to private user data beyond granted scopes

## Test account guidance
For Meta Review, prepare a reviewer account with access to:

- `/login`
- relevant admin social pages
- a demo tenant/social workspace
- a Facebook Page test flow if required

Keep demo data non-sensitive.
