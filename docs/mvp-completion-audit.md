# MVP completion audit checkpoint

Status: initial source inspection only; not a completed repository audit or launch-readiness assessment.

## Branch safety

Work branch: perplexity/mvp-completion, created from main at 0b12e8f15eafefdedc59c537144112380da4c875. No application changes have been committed at this checkpoint.

## Inspected

- Repository root and README.md. README status statements are historical claims, not fresh test evidence.
- backend/package.json and frontend/package.json.
- backend/src/services/mailer.js.
- backend/src/lib/permissions.js.
- frontend/src/App.jsx and frontend/src/components/Layouts.jsx.
- Directory listings for backend/src, backend/src/routes, backend/src/services, frontend/src and frontend/src/components.
- Partial StorefrontEditor.jsx content; the connector truncated this file, so its upload handler and remaining UI have not been fully audited.

## Confirmed source findings

1. App.jsx already registers the merchant editor at /app/storefront inside RequireAuth and AppLayout. Layouts.jsx NAV omits Store Editor, affecting both desktop navigation and the mobile More menu. Backend editor permissions still require inspection.
2. App.jsx has public service routes, but no merchant services or bookings routes. Backend services.js and bookings.js route files exist; their correctness has not been established. Do not duplicate these modules.
3. RequireAuth checks authenticated user presence, not emailVerified. AppLayout shows an unverified-email banner rather than blocking dashboard rendering. Backend verification enforcement remains unaudited.
4. VerifyBanner catches and ignores resend errors, then displays Check your inbox. This can falsely imply a successful resend.
5. mailer.js uses Nodemailer SMTP only. It records sent, failed and skipped_no_provider notifications. No direct Resend API integration or deduplication is present in this file. A notification-write failure after successful SMTP sending is caught as a send failure, creating potential retry ambiguity.
6. Frontend scripts provide dev, build and preview, but no lint or test script. ESLint is already a dev dependency.
7. Backend test scripts run unit.test.js and http.test.js; integration tests have a separate script. None has been executed during this audit.
8. Merchant permission definitions already include services and bookings permissions. Preserve these existing role distinctions.
9. README describes setup fees and automatic charge_authorization renewals, conflicting with the requested no-setup-fee/manual-renewal policy. This is a documentation finding; subscription implementation must be inspected before changing billing behavior.
10. Host-based storefront routing already exists in App.jsx through merchantSlugFromHost. DNS, TLS, CORS and tenant isolation are not verified.

## Validation limits

The available GitHub connector provides remote repository operations, not a Node.js terminal or browser runner. No npm install, production build, lint, backend tests, database tests, browser interaction tests or external provider transactions have been executed. No Cloudinary, Resend, Paystack, DNS or SSL integration is externally verified. Do not treat repository README claims as current test results.

## Remaining scope

Complete the full source audit before editing application behavior. All requested implementation work, regression testing, provider configuration and final pull request remain outstanding at this checkpoint. Preserve existing data, green branding, JavaScript/Vite architecture and path-based storefront fallback. Do not enable automatic payment charging or use live payments for automated tests.
