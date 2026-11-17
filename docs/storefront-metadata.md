# Storefront browser metadata

The public path-based and merchant-host routes now apply saved storefront SEO title, description, keywords, sharing image, favicon and no-index preferences after the public business response loads. Visible custom pages use a page-title prefix. Checkout, order, hidden and missing custom-page routes receive a client-side no-index preference. Canonical and sharing URLs exclude query strings and fragments.

The route wrapper restores the previous document head when leaving storefront routes. Metadata is reset before applying another storefront's values so omitted images and icons do not retain the previous merchant's values. Product detail pages retain their existing asynchronous title/description hook; product-specific Open Graph metadata is not added by this change. No checkout, payment or publication handlers are changed.

## Limits

This is client-rendered metadata, not server-rendered HTML or crawler verification. It does not guarantee that social preview crawlers execute the application or honor the generated tags. Server-rendered or pre-rendered metadata and any X-Robots-Tag policy still require deployment-side implementation and verification. No-index preferences are not access control. DNS, TLS and real-provider delivery are separate release checks.

Model regression tests exercise URL construction and fallbacks. Browser regression tests use intercepted fixture APIs and offline fonts; they test the real public route and document head, not a deployed host or external crawler. Inspect CI for each commit before reporting those tests as passed.
