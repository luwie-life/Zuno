# Cloudinary image uploads

Status: backend implementation added. Provider integration, database authorization tests and frontend wiring are not yet externally verified. Do not claim uploads are live from unit-test results.

## Backend configuration

Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the backend hosting environment, then restart the API. Never use VITE_ variables for credentials. Missing configuration returns MEDIA_NOT_CONFIGURED rather than a success response. No new SDK dependency is required.

## API

All endpoints require a verified authenticated session, X-Business-Id, active membership and business.update permission. The server generates public IDs under zuno/<business-id>/<random-uuid>; the client cannot select another tenant or overwrite an existing image.

- POST /api/media/images: JSON containing mimeType, canonical base64 data, optional name and purpose. JPEG, PNG and WebP are supported, up to 5 MB of decoded bytes. Authentication and merchant resolution occur before the route-specific 8 MB JSON parser. The normal API JSON limit remains 200 KB.
- GET /api/media/images: paginated ready assets belonging to the selected business.
- DELETE /api/media/images/:id: archives only that tenant's media record. The provider file is deliberately retained so existing products, galleries and storefront configurations do not break. This is not physical Cloudinary deletion.

The backend checks byte signatures, signs the Cloudinary upload, uses HTTPS with a timeout, verifies returned public ID/type/format/size/URL metadata, and stores the secure URL and public ID. Cloudinary still performs actual image decoding; header-only unit fixtures are not proof of valid image decoding or successful external uploads. Failed attempts remain tracked by public ID for investigation.

## Replacement and legacy records

Replacement creates a new asset instead of overwriting or deleting the old asset. Consumers continue storing image URLs, preserving existing merchant records. Media metadata is stored separately. Public image delivery URLs are public; tenant isolation protects upload/list/archive operations, not secrecy of public storefront images.

## Remaining verification

Test real JPEG/PNG/WebP files against the configured Cloudinary account; denied uploads, another tenant's list/archive requests, progress and error UI, replacement, mobile selection, save/reopen and public storefront rendering. Physical file deletion and orphan cleanup need a reference-aware retention policy and are not implemented here.
