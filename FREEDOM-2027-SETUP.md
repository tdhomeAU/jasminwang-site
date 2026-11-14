# Freedom 2027 registration — deployment and email setup

## Existing implementation
- Public forms in `dist/freedom-2027/index.html` and `dist/freedom-2027/register/index.html`.
- Both POST to `/api/freedom-2027/register`.
- Cloudflare Pages Function: `functions/api/freedom-2027/register.js`.
- D1 binding expected: `FREEDOM_DB`; table: `freedom_registrations`; migration: `migrations/0001_freedom_registrations.sql`.
- D1 database `freedom-2027-registrations` and at least one row were visible in the Cloudflare dashboard on 2026-11-14. This does **not** independently confirm current Pages binding, form test, or new deployment status.

## Automatic notification emails (code prepared, NOT activated/tested)
The Pages Function now attempts two transactional messages **after** the D1 insert succeeds:
1. Customer: confirmation and a formatted electronic ticket containing name and unique ticket number. No meeting link is invented. On-screen ticket remains downloadable/printable independently of email.
2. Organizer: notification with name, WeChat, email, city, and ticket number. Health goals and barriers are intentionally not included in the notification email; view those in the access-controlled D1 console.

Sending uses Resend `POST https://api.resend.com/emails`. The API key and sender must be configured first. The function gracefully reports `emailSent:false` when sending is unavailable. An email API's accepted-message ID does not guarantee arrival in an inbox. Each customer/organizer message has a ticket-based idempotency key to prevent repeat sending at the provider within its idempotency window.

### Configuration required in Cloudflare Pages production
In Workers & Pages > `jasminwang-site` > Settings > Variables and Secrets, configure:
- `RESEND_API_KEY` — **secret**, write-only; obtain from a Resend account. Never commit it or paste it into a chat or GitHub.
- `FREEDOM_MAIL_FROM` — variable containing a valid sender at a **verified sending domain**, e.g. `自由女神计划 <tickets@notify.example.com>`. Replace the example with a verified address. Consider a separate sending subdomain, and **do not change existing domain DNS/MX records without approval**.
- `FREEDOM_NOTIFY_EMAIL` — variable set to the organizer's approved recipient address; **confirm address with the user before configuring**. An older planning note named `yingsun7100@gmail.com`; it has not been reconfirmed here.
- Optional `FREEDOM_REPLY_TO` — recipient for replies, if wanted.

In Settings > Bindings, verify `FREEDOM_DB` is a D1 binding pointing to `freedom-2027-registrations` **in the Production environment**. Also apply migration if the table is absent; the user saw the table on 2026-11-14. After variables/secrets are saved, trigger a fresh deployment so the production deployment includes them.

To enable a sender in Resend: create an account, add and verify a dedicated sending domain/subdomain, and configure only the DNS records approved for sending (typically SPF/DKIM). Do not touch inbound MX records or the website domain setup unless explicitly required and approved.

### Acceptance test — do before distributing the invitation QR
1. Verify latest Cloudflare Pages deployment succeeds.
2. Submit **one test registration with a controlled personal email address**, not real customer health data.
3. Confirm a new row in D1 `freedom_registrations`, and see on-screen electronic ticket and saved ticket number.
4. Confirm the customer receives the matching confirmation/ticket email and the organizer receives a separate notification. Also check spam, email sender provider logs, and non-delivery fallback wording.
5. Confirm the form works from both URLs; test invalid and repeat submissions. Before a public campaign, enable appropriate anti-bot/rate limiting to prevent nuisance signups and notification spam.
6. Do not publish an unverified live QR or claim email confirmation is automated until these pass.

Customer email contains only the person's name and ticket (not detailed health answers). Organizer email contains contact details needed for follow-up. No public endpoint should expose registrations; keep the D1 dashboard access-controlled.

## Current status
- [x] Registration table and at least one row visible in D1 dashboard on 2026-11-14.
- [x] Email code and both form submit field formats prepared in GitHub.
- [ ] Current Cloudflare Pages production deployment and D1 binding verified.
- [ ] Verified sending domain, Resend key, sender, approved organizer address configured.
- [ ] Two actual emails received in a live test.
- [ ] Admin portal (optional, later phase).
