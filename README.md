# Martins Realties — Backend API

Secure, scalable REST API for a real estate platform: property listings, inquiries, reviews, cart/checkout, and an admin dashboard. **Backend only — no frontend/UI is included.**

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (httpOnly cookie + Bearer token support)
- Multer + Cloudinary (image uploads)
- express-validator (input validation)
- Winston + Morgan (logging)
- Helmet, express-mongo-sanitize, xss-clean, express-rate-limit (security)

## Project Structure

```
martins-realties-backend/
├── server.js                 # Entry point
├── .env.example               # Environment variable template
├── src/
│   ├── app.js                 # Express app + middleware wiring
│   ├── config/                # db, cloudinary, logger config
│   ├── models/                # Mongoose schemas
│   ├── controllers/           # Route handler logic
│   ├── routes/                # Route definitions
│   ├── middleware/             # auth, roleCheck, upload, validate, errorHandler
│   ├── validators/            # express-validator rule sets
│   └── utils/                 # AppError, asyncHandler, apiFeatures, generateToken, seedAdmin
```

## Setup

```bash
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, Cloudinary keys, etc.
npm run seed:admin        # creates the first admin account from .env values
npm run dev                # nodemon, or `npm start` for production
```

Health check: `GET /health`

All endpoints are prefixed with `/api/v1` (configurable via `API_VERSION`).

---

## Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user (role: `user`) |
| POST | `/auth/login` | Public | Login, returns JWT (cookie + body) |
| POST | `/auth/logout` | Private | Clear auth cookie |
| GET | `/auth/me` | Private | Get own profile |
| PATCH | `/auth/me` | Private | Update own name/phone |
| PATCH | `/auth/update-password` | Private | Change password |

Send the token via `Authorization: Bearer <token>` or rely on the `token` httpOnly cookie set at login.

## Properties

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/properties` | Public | List properties — search/filter/sort/paginate |
| GET | `/properties/featured` | Public | Featured properties (homepage) |
| GET | `/properties/:id` | Public | Single property (increments views) |
| POST | `/properties` | Admin | Create property (`multipart/form-data`, field `images`, up to 10) |
| PATCH | `/properties/:id` | Admin | Update property / append images |
| DELETE | `/properties/:id` | Admin | Delete property + its Cloudinary images |
| DELETE | `/properties/:id/images/:publicId` | Admin | Remove a single image |

**Search & filter query params on `GET /properties`:**
- `q=text` — full-text search across title, description, city, state
- `type`, `listingType`, `status`, `city`, `state` — exact match filters
- `price[gte]=100000&price[lte]=5000000` — range filters
- `bedrooms`, `bathrooms` — exact filters
- `sort=price,-createdAt` — sort fields (`-` = descending)
- `fields=title,price,city` — limit returned fields
- `page=1&limit=12` — pagination

## Inquiries / Contact

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/inquiries` | Public | Submit a contact/property inquiry |
| GET | `/inquiries` | Admin | List all inquiries (filterable, paginated) |
| GET | `/inquiries/:id` | Admin | Single inquiry |
| PATCH | `/inquiries/:id` | Admin | Update status (`new`/`in_progress`/`resolved`/`closed`) + note |
| DELETE | `/inquiries/:id` | Admin | Delete inquiry |

## Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reviews` | Public | Approved reviews only (for homepage) |
| GET | `/reviews/admin` | Admin | All reviews incl. pending, `?status=pending\|approved` |
| POST | `/reviews` | Private | Submit review (defaults to unapproved) |
| PATCH | `/reviews/:id` | Admin | Approve/reject (`{ "isApproved": true }`) |
| DELETE | `/reviews/:id` | Admin | Delete review |

## Cart

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cart` | Private | View own cart |
| POST | `/cart/items` | Private | Add property to cart `{ "propertyId": "..." }` |
| DELETE | `/cart/items/:propertyId` | Private | Remove one item |
| DELETE | `/cart` | Private | Clear cart |

## Orders / Checkout

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders/checkout` | Private | Convert cart into an order (`contactPhone`, `contactAddress`, `notes`) |
| GET | `/orders/my-orders` | Private | Own order history |
| GET | `/orders/:id` | Private (owner) / Admin | Single order |
| GET | `/orders` | Admin | **All orders — appears here for admin review** |
| PATCH | `/orders/:id` | Admin | Update `status` / `paymentStatus` / `adminNote` |

On checkout: cart items are copied into an `Order`, the cart is emptied, and the related properties are flagged `pending` until the admin confirms or cancels the order (which then marks them `sold`/`available`).

## Dashboard (Admin)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/dashboard/stats` | Admin | Property counts by status/type, user count, inquiry counts, pending reviews, order counts + total paid revenue, 5 most recent orders & inquiries |

## Users (Admin)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin | List users (filter/paginate) |
| GET | `/users/:id` | Admin | Single user |
| PATCH | `/users/:id` | Admin | Update `role` or `isActive` |
| DELETE | `/users/:id` | Admin | Delete user |

---

## Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "status": "fail", "message": "Description of the error" }
```

## Error Handling

Centralized in `middleware/errorHandler.js`. Handles Mongoose CastErrors, duplicate key errors, validation errors, JWT errors, and Multer upload errors, returning consistent JSON with appropriate HTTP status codes. Stack traces are only included when `NODE_ENV=development`.

## Logging

Winston writes daily-rotated logs to `/logs` (`combined` and `error` files) and also logs to console in development. Morgan pipes HTTP request logs into Winston.

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT auth, httpOnly cookies
- Helmet security headers
- Rate limiting (`RATE_LIMIT_*` env vars)
- MongoDB query sanitization + XSS input cleaning
- CORS restricted to `CORS_ORIGINS`
