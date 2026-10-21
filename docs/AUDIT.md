# Repository audit

**Finding:** `github.com/luwie-life/Zuno` was an **empty repository** (no commits, no files) when this work started, and `luwie-life/stocker` could not be read from the build environment. There was therefore no existing code, history, schema or data to preserve or migrate. Everything here is a fresh implementation.

**Consequences**
- No existing features to verify, no duplicated logic to merge, no data migration needed.
- Stocker's workflows (inventory, POS, staff roles) were designed from the brief, not from Stocker's code. If Stocker has specific rules you want mirrored, compare them to `backend/src/services/inventory.js` and `pos.js`.

**Architecture chosen** (matches the brief)
- `frontend/`: React 19 + Vite + Tailwind 3 + React Router + Framer Motion + Lucide. JavaScript only.
- `backend/`: Node 20+ (ESM) + Express + Mongoose, JWT sessions backed by a `Session` collection (so logout and revocation really work).
- Layering: `routes/` (HTTP + validation) → `services/` (business rules, transactions) → `models/`. Pure rules live in `lib/` so they are unit tested without a database.

**Risks designed against** (details in README → Security)
broken access control, cross-tenant access, price/stock/payment tampering, webhook spoofing and replay, account enumeration, recovery-as-takeover, double stock deduction, oversell under concurrency.
