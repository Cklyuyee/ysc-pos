# POS API Spec — handoff to POS UI team

**Status:** v1 — Scope A (minimum viable). Shift / refund / void / cash drawer are NOT in this version (planned for v2).

**Backend repo:** `ysc-core-api` (NestJS + Prisma 7 + Postgres + better-auth)
**Frontend reference:** `backoffice` (React + Vite + Tailwind) — same auth, same DB

> **Terminology:** "POS staff" = พนักงานหน้าร้านที่สแกนสินค้าและคิดเงิน (ไม่เก็บเงิน). "ConX cashier" = แคชเชียร์ที่บันทึกรับเงินจริงในระบบ ConX. POS app ทำหน้าที่แค่ tally bill — เงินจริงเก็บที่ ConX cashier และ stock cut เกิดเมื่อ ConX confirm payment.

---

## 1. Quick start

### Base URL
- Prod: `https://core-api.ysc.adeptio.app/api`
- Dev: `http://localhost:3000/api`

### Authentication
- **Cookie-based (better-auth).** Session cookie name `better-auth.session_token`.
- POS app must be served from a domain that can share the cookie with the API. Either:
  - Same root domain (e.g. `pos.ysc.adeptio.app` + `core-api.ysc.adeptio.app` → cookie scoped to `.ysc.adeptio.app`), OR
  - Reverse-proxy the API behind the POS origin so cookies stay first-party.
- All API calls MUST include `credentials: 'include'` (fetch) / `withCredentials: true` (axios).
- 401 → redirect to `POST /api/auth/sign-in/email` (better-auth) and retry.

### CORS
- Backend reads `CORS_ORIGIN` env (comma-separated). To enable POS app, ops must add the POS origin to that list and restart the API.
- `credentials: true` is set, so cookies pass through.

### Required role
- POS users must have role `pos_staff` (seeded in `seed-rbac.ts`). Label: "POS Staff" — พนักงาน POS ทำหน้าที่สแกน + คิดเงิน, ไม่เก็บเงิน (เงินเก็บที่ ConX cashier).
- Permissions granted: `pos.scan`, `order.view`, `order.create`, `customer.view`, `customer.create`, `slip.view`, `slip.upload`.
- Admin can promote a user via `PATCH /api/admin/users/:id/role` (requires `user.manage`).

### OpenAPI / Swagger
- Live at `<base>/docs` — schemas for every DTO are there. Treat this doc as the narrative; Swagger as the source of truth for field types.

---

## 2. Sale flow (happy path)

```
1. POS app login            → POST /auth/sign-in/email (better-auth)
2. Open / resume cart       → POST /pos/cart           (or GET /pos/cart/active)
3. Optionally attach member → cart was created with customerId, OR pass at checkout
4. Each scan                → POST /pos/cart/:id/items {sku, qty?}
5. Adjust qty               → PATCH /pos/cart/:id/items/:sku {qty}
6. Remove                   → DELETE /pos/cart/:id/items/:sku
7. Checkout                 → POST /pos/cart/:id/checkout {paymentMethod, customerId?}
                              → returns { cartId, order }
8. (bank-transfer only)
   Cashier uploads slip     → POST /orders/:orderId/slips (multipart/form-data)
9. Behind the scenes        → ConX confirms payment (mocked in dev: auto-fires;
                              in prod: real webhook). Stock cuts + reserve releases
                              + order flips to completed/delivered atomically.
```

### Key design points

- **Reserve happens at scan, not at checkout.** Each `POST /pos/cart/:id/items` increments `ProductSku.reservedOffline` by qty. Checkout does NOT re-reserve — POS-channel orders skip `reserveOrderItems`.
- **Stock cut happens at ConX payment confirmation, not at checkout.** Until ConX confirms, stock counter is unchanged; only `reservedOffline` is up. Available = `stockOffline - reservedOffline`.
- **POS skips pick/pack.** The staff hands goods over at the counter. There's no PickTask, no PackAssignment, no Runner. `deliveryStatus` starts at `'none'` and goes straight to `'delivered'` when ConX confirms.
- **Cart TTL = 15 min.** Every scan / qty change / remove bumps `expiresAt`. A cron sweep (every 5 min) marks idle carts as `abandoned` and releases their reserves so other registers can sell the SKU.

---

## 3. Endpoints

All POS endpoints require `pos.scan` permission. All return JSON. Error shape:

```json
{ "statusCode": 409, "message": "Insufficient offline stock for SKU-1234: requested +3, available 1", "error": "Conflict" }
```

### `GET /pos/cart/active`
Returns the current staff's active cart (or `null` if none). Use this on POS app startup to resume an in-progress sale.

**Response 200** — `PosCart | null`:
```json
{
  "id": "ckxx…",
  "staffId": "user-id",
  "customerId": null,
  "status": "active",
  "expiresAt": "2026-05-06T10:15:00.000Z",
  "orderId": null,
  "items": [
    { "id": "…", "cartId": "ckxx…", "sku": "SKU-1234", "qty": 2, "unitPrice": "45.00", "addedAt": "…", "updatedAt": "…" }
  ],
  "createdAt": "…",
  "updatedAt": "…"
}
```

### `POST /pos/cart`
Create a cart. If the staff already has an active cart, returns the existing one (idempotent — no duplicate).

**Body:** `{ customerId?: string }` — optional member (omit for walk-in).

**Response 201** — `PosCart`.

### `GET /pos/cart/:id`
Fetch a specific cart with items.

### `POST /pos/cart/:id/items`
Add a scanned SKU to the cart. If the SKU is already in the cart, qty is added (not replaced). Reserves `qty` against `reservedOffline` atomically.

**Body:**
```json
{ "sku": "SKU-1234", "qty": 1 }
```
- `qty` is optional, defaults to `1` (single-scan flow).

**Response 200** — updated `PosCart`.

**Errors:**
- `404 SKU not found`
- `400 SKU is not active`
- `409 Insufficient offline stock for SKU-X: requested +N, available M` — frontend should beep + show alternative SKUs.

### `PATCH /pos/cart/:id/items/:sku`
Set absolute qty for an item already in the cart. Backend computes the diff vs current qty and reserves/releases accordingly.

**Body:** `{ qty: number }` (≥1; to remove, use DELETE)

**Errors:** same as add — `409` if you try to bump past available stock.

### `DELETE /pos/cart/:id/items/:sku`
Remove the line and release its full reserve.

### `POST /pos/cart/:id/checkout`
Convert the cart into an `Order` (channel=`pos`). Marks cart as `checked_out` and links `orderId`.

**Body:**
```json
{ "paymentMethod": "cash", "customerId": "optional-override" }
```
- `paymentMethod`: one of `cash | bank-transfer | qr-code | credit-card | credit-limit`.
- `customerId`: required somewhere (cart or body). Walk-in carts must pass it here.

**Response 200:**
```json
{ "cartId": "ckxx…", "order": { /* full Order */ } }
```

**What backend does atomically:**
1. Resolve all SKUs (productName, brand, category, taxType, etc.) for the order rows.
2. Call `orders.create({ channel: 'pos', items: [...], customerId, paymentMethod })`.
3. `orders.create` skips `reserveOrderItems` (already reserved) and skips `createPickTaskFor` (POS).
4. Mark cart `checked_out`, link `orderId`.
5. Audit: `pos_cart` / `checkout` / `{ orderId, orderNumber }`.

**After checkout:**
- For `cash` / `credit-limit`: order is `confirmed` + `paid`; ConX confirm-payment fires (mocked, auto-fires in dev) → stock cut + reserve release + status flips to `completed` / `delivered`.
- For `bank-transfer` / `qr-code`: order is `pending_payment`. Upload slip via `POST /orders/:orderId/slips`. After admin verifies, order flips to `confirmed` and the same ConX flow runs.

### `POST /pos/cart/:id/abandon`
Cashier explicitly cancels the in-progress cart. Releases all reserves, marks `abandoned`. Audited.

---

## 4. Companion endpoints (already stable)

POS UI will need these from the rest of the API. Treat the responses as opaque and trust Swagger for field-level details — they're shared with backoffice and unlikely to break.

| Endpoint | Use case |
|---|---|
| `POST /auth/sign-in/email` (better-auth) | login |
| `GET /me` | current user + role |
| `GET /products?search=&barcode=` | barcode lookup → resolves to `sku` for `/pos/cart/:id/items` |
| `GET /products/by-code/:code` | direct SKU lookup |
| `GET /customers?search=` | member lookup (phone / custCode / name) |
| `GET /customers/:id` | full member profile (reward points, credit) |
| `POST /customers` | create walk-in profile if staff needs one |
| `GET /config/banks` | list bank accounts (`allowedDocTypes` filtered by customer's docType) |
| `POST /orders/:orderId/slips` | upload bank-transfer slip (multipart) |
| `GET /orders/:orderId` | full order detail (post-checkout receipt data source) |

---

## 5. Behavior notes & gotchas

1. **One active cart per staff.** `POST /pos/cart` is idempotent — calling it when an active cart exists returns the same row. UI should treat "open new sale" as "GET active first; if null, POST."
2. **TTL extends on every mutation.** A staff scrolling on the cart screen does NOT extend it; only add/set/remove/checkout/abandon do. If the UI needs to keep a cart alive during a long pause (e.g. bagging), call `PATCH` with the current qty as a no-op heartbeat.
3. **Stock check race.** `POST /items` and `PATCH` both check available = `stockOffline - reservedOffline` inside a transaction, but two concurrent registers can both see "1 available" before either reserves. Backend uses a transaction so the second call will return `409` after the first commits. UI should retry-with-error-toast, not silent-fail.
4. **Free items.** `OrderItem.isFreeItem = true` rows are NOT reserved and NOT cut at ConX confirm. POS cart doesn't currently expose free items — promotions that add free items happen during `orders.create` / pricing, not at scan time. If the POS UI needs to show free items pre-checkout, that's a v2 design.
5. **Pricing.** `addItem` records `unitPrice = ProductSku.standardPrice` at scan time. There's no member-tier or promo logic at the cart level today. If POS needs tier pricing or scan-time promo, raise it — current minimum scope assumes the POS UI shows `standardPrice` and any post-scan adjustment happens via `couponDiscount` on the checkout payload (not yet wired through POS endpoints — would need a v2 enhancement).
6. **No discount/override at line level (v1).** All adjustments (bill-level discount, coupon) belong to the order, not the cart. POS UI in v1 can pass `paymentMethod` only.
7. **ConX is mocked in dev.** `MockConxService.submitOrderToCashier` auto-fires `confirmPayment` unless `CONX_AUTO_CONFIRM=false`. For POS-channel orders the confirm path also flips orderStatus → completed + deliveryStatus → delivered + sets deliveredAt. Manual confirm endpoint: `POST /dev/conx/confirm-payment/:orderId` (admin only).
8. **No refund/void in v1.** If the staff needs to undo a checked-out sale, an admin must `DELETE /orders/:id` (refunds are out of scope for v1). v2 will add a POS-side void endpoint.
9. **Receipt printing.** Backend doesn't generate receipts. POS UI uses `GET /orders/:orderId` data + its own template/printer integration.
10. **Audit trail.** All cart mutations are auditable via `pos_cart` entityType in `/audit` (admin-only).

---

## 6. Status / transitions reference

### Cart status
- `active` → `checked_out` (via checkout)
- `active` → `abandoned` (via abandon, or sweep after TTL)
- Terminal: `checked_out`, `abandoned`

### POS order lifecycle
| paymentMethod | initial orderStatus | after ConX confirm |
|---|---|---|
| `cash` | `confirmed` (paid at counter) | `completed` (deliveryStatus=`delivered`) |
| `credit-limit` (and credit OK) | `confirmed` | `completed` |
| `bank-transfer` / `qr-code` | `pending_payment` | (waits on slip verify → `confirmed` → ConX → `completed`) |

`deliveryStatus` for POS orders: always starts `none`, never visits `pending`/`picking`/`packing`. Only valid transition out: `delivered` (via ConX confirm) or `cancelled` (via order cancel).

---

## 7. v2 candidates (out of scope)

Things deliberately NOT in v1 — flag if POS team needs any of these now:

- Shift open / close, cash drawer balance reconciliation
- POS-side void/refund (today only admin can DELETE order)
- Receipt running number distinct from `orderNumber`
- Per-terminal device registry / per-shift audit
- Member tier pricing applied at scan time
- Scan-time promotion engine (free-with-purchase, mix-and-match)
- Loyalty point earn / redeem at POS
- Returns / exchange flow
- Manual line-level discount with approval gate
- Offline mode (cart stays usable when API is unreachable)

---

## 8. Pending ops actions before v1 ship

1. Apply migration `20260506000000_pos_cart` on DO via `prisma migrate deploy`.
2. Re-run `seed-rbac.ts` so `pos_staff` role and `pos.scan` permission land in DB.
3. Add POS app origin to `CORS_ORIGIN` env, restart API.
4. Promote a test staff user to role `pos_staff`.
5. (Optional) Set `CONX_AUTO_CONFIRM=false` if you want to manually drive the confirm step during integration testing.
