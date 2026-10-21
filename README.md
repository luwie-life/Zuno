# Zuno

Nigeria-first commerce and business management SaaS: online storefront, integrated POS, one shared inventory, Paystack payments, subscriptions, secure account recovery, a platform control centre, and a branded-mobile-app application workflow.

```
backend/    Express + MongoDB API  (deploy to Render)
frontend/   React + Vite app       (deploy to Vercel)
docs/       Audit notes
```

> **Honest status:** see [Status and limitations](#status-and-limitations). The code builds and its pure-logic and HTTP tests pass. The database-backed integration tests are written but **have not been run** (no MongoDB was available where this was built). Run them before trusting it with real money.

## Quick start (local)

Requirements: Node 20+, a MongoDB. Use a free **MongoDB Atlas** cluster (replica set, supports transactions), or a local replica set (`mongod --replSet rs0` then `rs.initiate()`), or standalone Mongo with `ALLOW_NO_TXN=true` (dev only).

```bash
# 1. Backend
cd backend
copy .env.example .env        # fill MONGODB_URI and JWT_SECRET (see below)
npm install
npm run dev                   # http://localhost:4000/api/health

# 2. Frontend (new terminal; in Windows CMD use `copy .env.example .env`)
cd frontend
copy .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Create the first Platform Owner** (there is no default admin and no public admin sign-up):

```bash
cd backend
npm run create-admin -- you@example.com "Your Name"   # password is typed at a hidden prompt
```
Then sign in at `/admin/login`. Create other staff by registering a normal account, then promoting it directly in the database (`platformRole: "support"` or `"billing"`); a staff-management UI is not built yet.

**Emails in development:** with no SMTP set, emails are **not sent**; each is recorded as `skipped_no_provider`. Set `DEV_LOG_EMAILS=true` (non-production only) to print verification/reset links in the server console.

## Commands

| What | Command |
|---|---|
| Backend tests (no DB needed) | `cd backend && npm test` |
| Integration tests (needs replica-set DB, **drops the DB**) | `cd backend && set TEST_MONGODB_URI=mongodb+srv://<test-user>:<password>@<test-cluster>/<disposable-db> && npm run test:integration` |
| Frontend production build | `cd frontend && npm run build` |
| Frontend preview | `cd frontend && npm run preview` |
| Lint | No lint script is defined in either package |

## Environment variables

**Backend (`backend/.env`)** — see `backend/.env.example`

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `ALLOW_NO_TXN` | `true` only for local standalone Mongo. Refused in production |
| `JWT_SECRET` | ≥32 chars. Signs session tokens |
| `SESSION_HOURS` | Session lifetime (default 12) |
| `FRONTEND_URL` | Public frontend URL; used in email links and Paystack callbacks |
| `CORS_ORIGINS` | Comma-separated exact origins allowed to call the API (no wildcard) |
| `BACKEND_URL` | This API's public URL |
| `TRUST_PROXY` | `true` on Render so rate limiting sees real IPs |
| `PLATFORM_PAYSTACK_SECRET_KEY` | Zuno-owned subscriptions/setup fees only. Server-only; never used for merchant sales |
| `GATEWAY_ENCRYPTION_KEY` | Base64 32-byte server-managed key used to encrypt merchant gateway secrets at rest |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` | Any SMTP provider (Brevo, Mailgun, Resend SMTP, Gmail app password…) |
| `RUN_JOBS` | `false` to disable in-process background jobs |

**Frontend (`frontend/.env`)**: only `VITE_API_URL` (public). Never put secrets in `VITE_*` variables.

## Deployment

**MongoDB Atlas:** create a cluster, a database user, and allow Render's outbound IPs (or `0.0.0.0/0` while testing, then tighten). Atlas is a replica set, so transactions work.

**Windows CMD MongoDB diagnostics (run from the repository root):**

```cmd
cd backend
node --input-type=module -e "import 'dotenv/config'; import { parse } from 'node:url'; const u=new URL(process.env.MONGODB_URI||''); console.log('MONGODB_URI loaded:',Boolean(process.env.MONGODB_URI),'scheme:',u.protocol,'hostname:',u.hostname)"
```

This prints only whether the variable is loaded, its URI scheme, and the hostname (not the username/password or full URI). The application loads `backend\.env` by file location, independent of the launch working directory; an already-set Windows/process environment variable takes precedence over `.env`. Resolve the reported hostname with `nslookup ACTUAL_HOSTNAME`. For Atlas SRV URIs, also check `_mongodb._tcp.ACTUAL_HOSTNAME` with `nslookup -type=SRV _mongodb._tcp.ACTUAL_HOSTNAME`. If `nslookup` reports `Non-existent domain`/`NXDOMAIN` or cannot resolve the host, copy a fresh URI from the intended Atlas cluster's **Connect → Drivers** panel and check Windows DNS/network settings. Never replace it with a guessed hostname. A connection-string hostname typo/stale cluster address is a configuration/DNS issue, not an IP allowlist error; Atlas network access rules matter only after DNS resolves. The server logs the hostname and classifies DNS failures without printing URI credentials.

**Backend on Render:** New → Web Service → root dir `backend`, build `npm ci`, start `npm start` (or use `render.yaml`). Set every variable above, with `NODE_ENV=production`, `TRUST_PROXY=true`, `FRONTEND_URL` and `CORS_ORIGINS` set to your Vercel URL(s). Health check: `/api/health`. Free instances sleep: background jobs only run while awake, so also create a Render Cron Job (or any scheduler) that signs in as a Platform Owner and calls `POST /api/admin/jobs/run` every 30 minutes (releases expired stock holds, attempts renewals, reconciles payments). The in-process timers also run while the service is awake.

**Frontend on Vercel:** root dir `frontend`, framework Vite, build `npm run build`, output `dist`, env `VITE_API_URL=https://your-api.onrender.com`. `vercel.json` already rewrites all routes to `index.html`.

**Paystack:** Zuno's `PLATFORM_PAYSTACK_SECRET_KEY` is used only for Zuno-owned subscriptions/setup charges. Merchants connect their own Paystack secret under **Settings → Payments**; it is encrypted at rest and never returned to the browser. Each merchant checkout and refund is routed through the corresponding merchant account, with no fallback to Zuno's credentials and no split-payment routing. Configure Paystack's webhook URL as `https://YOUR-API/api/webhooks/paystack` on each relevant account. Use test keys first and complete sandbox checkout/webhook/refund tests before going live; provider API behavior has not been tested against a live Paystack account.

**Marketplace settlement:** merchant orders and online POS payments are initialized with the merchant's own connected Paystack secret. Zuno does not receive merchant sales revenue. Merchants must connect and test their own account before integrated online checkout is available.

## How the important rules work

**Money** is stored as integer kobo. Prices, totals, discounts, deliveries and plan fees are all computed on the server from server records; the browser's numbers are display-only.

**Shared inventory** (`backend/src/services/inventory.js`): `available = stock − reserved`.
| Event | Effect |
|---|---|
| Online order placed (unpaid) | `reserved += qty` if available ≥ qty, else rejected |
| Online payment verified by Paystack | `stock −= qty`, `reserved −= qty` |
| Order unpaid / failed / expired / cancelled before payment | `reserved −= qty` |
| Payment arrives *after* the hold expired | re-deducts if stock allows, else order flagged **refund pending** |
| POS cash / transfer / terminal sale (cashier confirms) | `stock −= qty` (only if available ≥ qty) |
| POS Paystack sale | reserve, then deduct on verified payment |
| Cancel/return of a paid sale or order | stock changes **only if the actor ticks "restock"** |
| Manual adjustment / purchase received | recorded movement with reason, actor, time |

Every change is a single conditional atomic update plus a `StockMovement` row, wrapped in a transaction when the database supports it. Documents are "claimed" with an atomic state change (`reserved → deducted`) so retries, duplicate webhooks and double clicks cannot deduct twice. POS retries use a per-business unique `idempotencyKey`.

**Payments:** every payment is a `Payment` row with a unique server-generated reference and server-computed amount. Platform billing is explicitly bound to Zuno's platform Paystack account; merchant sale payments are bound to the merchant's own gateway record. A payment is applied only after provider verification confirms status, reference, **amount and currency**; webhooks are checked against that exact account and re-verified; event delivery and payment application are idempotent. Cash is recorded as cash; merchant-confirmed transfers/terminal payments are marked manually recorded, not gateway verified.

**Subscriptions:** setup fee and monthly fee are separate obligations. Access = setup settled (or waived/none) **and** paid period not ended; then a configurable grace period (default 7 days); then paid features pause. Data is never deleted. Upgrades take effect after the setup-fee difference is paid; downgrades at the next renewal. Renewal uses Paystack's `charge_authorization` with the saved authorization code (never card data). Admin overrides require a reason and are audited. Plan features and limits are enforced by server middleware, not the UI.

**Roles:** merchants: owner / manager / cashier (`backend/src/lib/permissions.js`). Platform: owner / support / billing. Discounts, returns/voids, stock adjustments, reports and staff management are permission-checked on the server; cashiers only see their own sales and tickets.

**Account recovery:** forgot-password returns an identical response whether or not the account exists, is rate-limited per IP and per email, uses 256-bit random tokens stored only as SHA-256 hashes, expiring (default 60 min) and single-use; a weak new password does not consume the token; success revokes all sessions and emails a notice. Public recovery requests return a reference **and** a one-time access key; the reference alone reveals nothing. Staff can: assign, record verification outcomes, add private notes, message the applicant, approve/reject, send a reset link (to the *registered* email only), revoke sessions, suspend, change email (via a confirmation link to the *new* address; high-risk needs a Platform Owner), and transfer ownership (Platform Owner only; needs an approved request with two passed checks incl. business records or authority evidence). These rules are in `lib/recoveryRules.js` and are unit tested. Administrators can never set or see passwords.

**Reports** (`routes/reports.js`): online revenue = paid orders only; POS revenue = paid/partially refunded sales minus refunded amounts; net sales = both. Pending, failed, expired and refunded orders are not sales.

## Security checklist (before going live)
- [ ] `JWT_SECRET` long and random; `NODE_ENV=production`; `ALLOW_NO_TXN` not set
- [ ] `CORS_ORIGINS` lists only your real frontend origin(s)
- [ ] Paystack **live** key set, webhook URL configured, a real test payment verified end to end
- [ ] SMTP configured and a verification + reset email actually received
- [ ] Integration tests run green against a replica-set test database
- [ ] First Platform Owner created; no one else has `platformRole`
- [ ] Atlas network access restricted; database user has least privilege; backups on
- [ ] Privacy policy and Terms reviewed by a qualified lawyer (current text is a plain-language template)
- [ ] Consider adding MFA for platform staff (not implemented)

## Status and limitations

| Area | Status |
|---|---|
| Auth, sessions, password reset, email verification | Implemented. HTTP + unit tests pass; DB flows covered by unrun integration tests |
| Multi-tenancy, roles, entitlements | Implemented; isolation tests written, **not run** |
| Storefront, cart, checkout, orders (separate payment/fulfilment state) | Implemented, not run against Paystack |
| POS, receipts (browser print), returns/voids, idempotency | Implemented; concurrency/idempotency tests written, **not run** |
| Inventory, movements, adjustments, suppliers, purchases | Implemented |
| Paystack init/verify/webhook/refund/renewal | Implemented from the documented API; **untested against Paystack** (mocked only) |
| Subscriptions, setup vs monthly, grace, upgrade/downgrade, overrides | Implemented; rule logic unit tested |
| Platform control centre | Implemented (overview, merchants, businesses, recovery, plans/subscriptions, payments, apps, support, audit, settings) |
| Account recovery incl. contact change, ownership transfer, compromise tools | Implemented; rules unit tested |
| Support tickets | Implemented |
| Branded app applications | Implemented (merchant + admin); no automatic app generation, as specified |
| UI | Builds and lints for undefined identifiers; **not visually tested in a browser or on devices** |

Known gaps / not built:
- **Image upload:** product images and logos are https links, not uploads (no storage service chosen).
- **Staff management UI for platform admins** (promote via database), **MFA**, **multi-branch**, **warehouse transfers**, **accounting**, **thermal-printer-specific output** (standard browser print only), **quarterly/annual billing**.
- Merchant staff are added by the email of an existing account (no invitation emails).
- Auth token lives in `localStorage` (simple for a Vercel↔Render split; an httpOnly-cookie design is stronger but needs same-site hosting).
- Server-rendered SEO: store pages set title/description client-side only; for strong SEO add prerendering/SSR.
- Order notifications to customers/merchants (e.g. "new order" emails) are not implemented; payment/receipt emails to buyers rely on Paystack's own receipts.
- Payment amounts, fees and plan features are **provisional defaults** (₦250k/₦15k, ₦450k/₦30k, ₦750k+/₦50k+; app from ₦500k + ₦25k/mo), editable in the admin UI.

## Troubleshooting
- *"Invalid environment configuration"* on start → a required variable is missing; the message names it.
- *Transactions error locally* → standalone Mongo: use Atlas/replica set or set `ALLOW_NO_TXN=true` (dev only).
- *CORS error in browser* → add the exact frontend origin to `CORS_ORIGINS`.
- *Webhook 401* → the configured platform/merchant Paystack account key does not match the sender (test vs live) or a proxy altered the body.
- *Rate limit seems to hit everyone* → set `TRUST_PROXY=true` behind Render.
- *No emails* → SMTP not configured; see Notification records with status `skipped_no_provider`.
"# Zuno" 
