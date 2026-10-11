# Meta App Review Checklist — GFVGO Growth Platform

## Production URLs

- App domain: `gfvgo.com`
- Website: `https://gfvgo.com/`
- Privacy Policy: `https://gfvgo.com/privacy-policy`
- Terms of Service: `https://gfvgo.com/terms-of-service`
- Data Deletion: `https://gfvgo.com/data-deletion`
- OAuth callback confirmed in Meta: `https://gfvgo.com/api/meta/callback`
- Webhook callback: `https://gfvgo.com/api/meta/webhook`

Legacy compatibility routes remain active and should not be removed until old app settings are no longer in use:

- `https://gfvgo.com/api/integrations/meta/callback`
- `https://gfvgo.com/api/integrations/meta/webhook`

## Requested Permissions

Read / setup permissions:

- `pages_show_list` — list Pages the connected user can manage.
- `pages_read_engagement` — read Page metadata/engagement and validate connected Page access.
- `pages_manage_metadata` — subscribe the connected Page to app webhooks.
- `business_management` — read business/page ownership context when Meta requires business-level review.

Publish permission:

- `pages_manage_posts` — publish approved/scheduled content to the selected connected Page.

Do not request group publishing unless a separate review flow is prepared. Group publishing remains manual unless the app/token has explicit permission and the group is verified.

## Reviewer Demo Flow

1. Log in to GFVGO admin.
2. Go to Admin → Social → Page Factory.
3. Create/select a Social Workspace and internal Social Page.
4. Click Connect Facebook.
5. OAuth opens through `/api/meta/login` and returns to `/api/meta/callback`.
6. Choose one of the Pages returned by Meta.
7. GFVGO stores only encrypted Page access token server-side.
8. Reviewer can validate connection and see Page status in Admin → Social → Page Factory.
9. If publish permission is granted, approved scheduled content can publish to the selected Page only.

## Review Evidence to Capture

- Screenshot of public legal URLs returning HTTP 200.
- Screenshot of OAuth dialog showing exact permissions.
- Screenshot of Page selection UI.
- Screenshot of connected Page status.
- Video showing an approved post publishing only after admin action/approval.

## Safety Notes

- No access token is shown in browser UI.
- No Page ID is hardcoded in production logic.
- User chooses Page from Meta-returned Pages only.
- Tenant access is checked before starting OAuth and before consuming OAuth sessions.
- Existing App ID should not be changed during deployment.
