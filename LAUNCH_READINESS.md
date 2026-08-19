# NorthStock Launch Readiness

Last updated: August 18, 2026

This package completes the code work for the seven launch-readiness areas. The production-only checks below must still be performed against the real Supabase, Resend, Vercel, and browser accounts before inviting sellers.

## 1. End-to-end account testing

Run these tests in a private/incognito window on the production domain. Use separate buyer, seller, and admin test accounts. Do not use a real customer's email or inventory.

| Role | Test | Expected result |
| --- | --- | --- |
| Guest | Open home, inventory, buyer requests, help, terms, privacy, and marketplace guidelines | Public pages load; private dashboards redirect to login |
| Guest | Attempt to post or respond without an account | Login is required |
| Buyer | Create account, confirm email, log in, reset password | Each flow completes and returns to the correct NorthStock page |
| Buyer | Save a listing and a search | Saved data appears only in that buyer's account |
| Buyer | Submit a listing quote request | One lead is saved and the seller email is sent |
| Buyer | Post, edit, fulfill, and review responses to a buyer request | Only the owner can manage the request and view private responses |
| Seller | Create or claim a company profile | The profile belongs to the authenticated seller and is publicly viewable |
| Seller | Add, edit, renew, mark sold, and delete a listing | Changes affect only the seller's own inventory |
| Seller | Download template, bulk upload, and export inventory | Files open cleanly; imported categories and rows are correct |
| Seller | Respond to a buyer request | The response saves once and the buyer is notified |
| Admin | Open admin pages and APIs with an admin account | Access succeeds |
| Non-admin | Attempt the same admin pages and API calls | Access is denied |
| All | Log out, then use the Back button | Private data is not usable after logout |

Record the date, tester, browser, result, and evidence for every row. Repeat on a desktop browser and a mobile-sized browser.

## 2. Security and permissions audit

The server routes in this package now authenticate sensitive actions, derive ownership-sensitive values from Supabase, escape email content, validate input, and rate-limit public contact submissions. Admin server routes use the `admin_users` table rather than a hard-coded email list.

Run `supabase/launch-security-audit.sql` in the Supabase SQL editor. Review every result; the script is read-only. A public-schema application table without RLS is a release blocker.

Expected access model:

| Data | Expected access |
| --- | --- |
| `listings` | Public reads for active inventory; owners manage their own records; privileged server routes may use service role |
| `companies` | Public profile reads; owners manage their own profile |
| `leads` | Created by the authenticated quote API; visible only to the relevant buyer/seller and admins as intended |
| `buyer_requests` | Public reads only for active/public requests; owners manage their requests |
| `buyer_request_responses` | Responding seller creates through the server route; request owner sees received responses; seller sees their own responses |
| `saved_listings`, `saved_searches` | Authenticated user sees and manages only their own rows |
| `admin_users`, campaigns, invites | Admin or server-only; never anonymous |

Also verify in Supabase Authentication:

- Email confirmation is enabled if desired for launch.
- Site URL is `https://northstock.ca`.
- Redirect URLs include the exact production reset/invite URLs.
- Service-role keys appear only in Vercel server environment variables and never in browser code, screenshots, commits, or support messages.
- Any exposed key is rotated before launch.

## 3. Excel and category consistency

The application category source remains `lib/categories.ts` and includes:

- Office Furniture
- Restaurant Equipment
- Hotel Supplies
- Commercial Gym Equipment

The seller template, admin upload template, and seller inventory export are formatted with ExcelJS. Templates include frozen top rows, filters, professional headers, readable widths, wrapped cells, alternating row fills, category reference sheets, and validation where applicable.

Manual verification:

1. Download both templates from production.
2. Open them in desktop Excel and Google Sheets.
3. Confirm all four categories appear in dropdowns/reference sheets.
4. Upload one valid row in every category.
5. Try one invalid category and confirm it is rejected or corrected before publication.
6. Export inventory and confirm every value round-trips correctly.

## 4. Production email verification

Confirm the sending domain is verified in Resend and the Vercel Production environment has a current `RESEND_API_KEY`. Send the following messages to controlled test inboxes on at least two providers (for example Gmail and Outlook):

| Email | Trigger | Verify |
| --- | --- | --- |
| Contact | Submit contact form | Arrives at NorthStock; untrusted HTML is rendered as text |
| Quote request | Buyer requests quote on a listing | Seller receives correct listing and authenticated buyer information |
| Buyer request response | Seller responds to a buyer request | Buyer receives correct seller and response information |
| Saved-search alert | Matching inventory is posted | Matching subscriber receives one alert, not duplicates |
| Seller invite | Admin creates invite | Correct recipient and production invite URL |
| Password reset | User requests reset | Reset link opens production reset flow |
| Campaign test | Admin sends a controlled test | Admin authorization works; unsubscribe link works |

For each message, verify sender, reply-to, subject, text and HTML versions, links, spam placement, and that no secret or private data is exposed. Review Vercel function logs and Resend delivery logs for failures.

## 5. Public site polish

Completed in code:

- Current metadata, canonical URL, robots rules, sitemap, Open Graph, and Twitter metadata.
- Custom not-found page.
- Category cards link to filtered inventory.
- Correct Help Centre layout placement.
- Footer links to policies and seller onboarding.
- Homepage does not expose marketplace counts to anonymous visitors.

Before launch, inspect production at 320 px, 768 px, 1440 px, and a real mobile device. Check navigation wrapping, form focus states, image fallbacks, empty states, error states, loading states, and every footer link.

## 6. Trust and policies

This package adds plain-language Privacy Policy, Terms of Use, and Marketplace Guidelines pages and links them from the footer and account creation copy.

These drafts are product copy, not legal advice. Have qualified Canadian and United States counsel review them before public promotion, especially privacy obligations, marketplace liability, prohibited inventory, dispute handling, governing law, email consent, and cross-border activity. Replace any business address, legal entity name, retention period, or contact information required by counsel.

## 7. Seller onboarding

The Seller Getting Started page provides an actionable checklist covering profile setup, individual listing creation, Excel bulk upload, buyer requests, response tracking, and inventory maintenance. It is linked from the public footer and seller dashboard.

Before recruiting sellers:

1. Create a reusable welcome email linking to `/sellers/getting-started`.
2. Prepare one sample spreadsheet with fictitious inventory in every category.
3. Choose an owner for seller support at `info@northstock.ca`.
4. Define a response-time target for invite and upload questions.
5. Onboard the first 3-5 sellers personally and record every point of confusion.
6. Update the Help Centre after that pilot before broad outreach.

## Environment checklist

Production in Vercel must contain:

- `NEXT_PUBLIC_SITE_URL=https://northstock.ca`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server secret)
- `RESEND_API_KEY` (server secret)

After changing an environment variable, redeploy Production. Never commit `.env.local`.

## Verification status

- `npm run build`: passed using non-production placeholder values; TypeScript compilation and route generation succeeded.
- ESLint: existing repository backlog remains (primarily Next.js internal-link rules, image optimization warnings, older hook patterns, and existing broad types). The build passes, but schedule a separate cleanup before enabling strict lint as a deployment gate.
- Production RLS, live emails, live account flows, browser/device checks, and legal approval: require manual verification using the real services and accounts.

## Release and rollback

1. Export a Supabase database backup or confirm point-in-time recovery before deployment.
2. Deploy to a Vercel Preview and complete the critical buyer/seller/admin smoke tests.
3. Merge or push to `main` only after Preview passes.
4. Re-run the critical smoke tests on Production.
5. If a blocker appears, use Vercel to promote the last known-good deployment and investigate without altering production data manually.
