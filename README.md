# IronVault

A full-stack banking web application built with Next.js, Node.js, Express, and MongoDB. Registered users get a 12-digit account with a $1,000 opening balance, can send money to other users, and see an immutable audit trail of every incoming and outgoing transfer.

The project focuses on how real financial systems handle money: no double-spending, a ledger that always balances, no floating-point rounding errors, and duplicate payment requests that are processed exactly once.

---

## Key Engineering Decisions

### 1. Integer-Based Currency Handling
In JavaScript, floating-point math causes rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In financial applications even small errors accumulate and corrupt balances.
* All balances and amounts are stored and computed as whole integer **cents** (`balanceCents`, `amountCents`).
* The API rejects anything that is not a JSON integer (`10.5`, `"100"`, negatives).
* The frontend parses typed dollar amounts into cents with string arithmetic, never `parseFloat`. Dollars exist only at the presentation layer.

### 2. Multi-Document ACID Transactions
A transfer debits one account, credits another, and writes a ledger entry and an idempotency record. All four writes happen in one MongoDB transaction (`session.withTransaction()`): either all of them commit or none do.
* The debit is a conditional update (`balanceCents >= amount` in the filter, `$inc` in the update), so two concurrent transfers can never spend the same cents.
* Write conflicts between concurrent transfers are retried automatically (`TransientTransactionError`).

### 3. Idempotency Keys (Preventing Duplicate Transfers)
Network dropouts or double-clicks can send the same transfer twice.
* Every transfer carries a client-generated `referenceId` (idempotency key).
* The server stores each key with the response it produced. Repeating the request replays the stored response (header `Idempotent-Replayed: true`) without moving money again, even when the duplicates arrive concurrently.
* Reusing a key with *different* parameters is rejected (`422 IDEMPOTENCY_KEY_REUSED`). A key belonging to another user is rejected (`409`) without revealing their data.
* The UI keeps the same key after a network error or 5xx, so pressing "Retry" is always safe, and generates a fresh key after a definitive answer.

### 4. Immutable, Balanced Ledger
* Ledger entries cannot be updated or deleted: the Mongoose model blocks every update and delete path.
* Opening balances are recorded as deposits from the IronVault Treasury (`000000000000`), so the sum of all balances always equals the sum of all deposits.
* Business-rule rejections (insufficient funds, unknown recipient) are recorded as `FAILED` entries, visible to the sender only, and never move money.

### 5. Session Security
* Passwords are hashed with bcrypt (12 rounds). Sign-in compares against a dummy hash for unknown emails, so response timing doesn't reveal which emails are registered.
* JWTs carry a token version. "Logout all devices" and password changes bump it, revoking every other session immediately.
* Helmet security headers, CORS allow-list, request size limits, and rate limits on auth and transfer endpoints.

### 6. Role-Based Access Control
* Two roles: `user` (customer) and `admin` (bank operations / compliance). The role is in the user profile and the JWT, but authorization always uses the role stored in the database, so a role change takes effect on the next request.
* `requireRole(...roles)` middleware guards `/api/admin/*` and answers `403 Access denied: insufficient permissions` otherwise. Public signup can never create an admin.
* Admins can freeze and unfreeze accounts. A freeze on **either** party blocks a transfer (`403 ACCOUNT_FROZEN`) and the attempt is recorded as a `FAILED` ledger entry. Freezes write-conflict with in-flight transfers, so a transfer commits entirely before a freeze or is rejected after it.
* Each status change records who made it, when, and an optional reason. The reason is visible to admins only.

---

## Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, JavaScript (JSX), Tailwind CSS, Radix UI, Recharts, Lucide Icons, Sonner (toasts)
* **Backend:** Node.js, Express 5, Mongoose 9, express-validator, Helmet, express-rate-limit
* **Database:** MongoDB (replica set required for multi-document transactions; Atlas works out of the box)
* **Authentication:** JWT with bcrypt-hashed passwords
* **Tests:** Node's built-in test runner, Supertest, and an in-memory MongoDB replica set

---

## Repository Structure

```text
fintech-web-app/
├── Frontend/
│   ├── app/
│   │   ├── auth/              # Sign-in & sign-up routes
│   │   ├── dashboard/         # Overview, transfers, ledger, settings
│   │   └── page.jsx           # Entry redirect logic
│   ├── components/
│   │   ├── dashboard/         # BalanceCard, ActivityChart, TransferForm, TransactionTable, ...
│   │   └── ui/                # Reusable UI primitives (buttons, inputs, dialogs)
│   ├── context/AuthContext.jsx  # Session state, auto sign-out on revoked tokens
│   ├── hooks/                   # useAuth, useDebounce
│   └── lib/
│       ├── api.js             # API client
│       ├── constants.js       # Endpoints, validation limits
│       └── utils.js           # Cents formatting/parsing, idempotency keys
│
├── backend/
│   ├── app.js                 # Express app (middleware + routes)
│   ├── server.js              # Entry point: connect DB, listen, graceful shutdown
│   ├── config/                # env loading, MongoDB connection
│   ├── models/                # User, Account, Transaction, IdempotencyKey
│   ├── middleware/            # auth, rbac (requireRole), validation, rate limits, errors
│   ├── services/              # transferService (ACID + idempotency), userService, serializers
│   ├── controllers/           # auth, account, transfer, transaction, admin handlers
│   ├── routes/                # Route definitions + request validation
│   ├── scripts/               # seed.js, dev-memory.js, demoUsers.js
│   └── tests/                 # API integration tests
│
└── README.md
```

---

## Getting Started

### Prerequisites
* Node.js 18.18 or later
* A MongoDB **replica set**: a free MongoDB Atlas cluster, or none at all if you use the in-memory mode below

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev            # http://localhost:5000
npm run seed           # optional: creates the demo users below
```

**No database? Use the in-memory mode:**

```bash
npm run dev:memory
```

This starts a throwaway MongoDB replica set in memory, creates the demo users below, and serves the API on port 5000. Data is lost when you stop it. The first run downloads a MongoDB binary (~1 minute).

**Demo users** (created by `npm run seed` and `npm run dev:memory`):

| Email | Password | Role |
|---|---|---|
| `alice@example.com` | `Password123!` | user |
| `bob@example.com` | `Password123!` | user |
| `admin@ironvault.com` | `AdminPassword123!` | admin (opens with a $0 balance) |

> Change the admin password on any database that is not a throwaway one.

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local   # optional, defaults to http://localhost:5000/api
npm run dev                  # http://localhost:3000
```

### 3. Tests

```bash
cd backend
npm test
```

The suite covers signup/signin, session revocation, atomic transfers, idempotent replays, concurrent duplicate requests, overdraft protection under concurrency, ledger immutability, ledger balance, filtering and pagination, admin-only access (403 for customers), and freeze enforcement on both sides of a transfer.

### Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `MONGO_URI` | *(required)* | MongoDB connection string (must be a replica set) |
| `JWT_SECRET` | dev-only fallback | Token signing secret. **Required in production** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Comma-separated CORS allow-list |
| `OPENING_BALANCE_CENTS` | `100000` | Starting balance for new accounts ($1,000.00) |

---

## API Overview

All endpoints except signup/signin require `Authorization: Bearer <token>`. Errors have the shape `{ success: false, code, message }`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register (`username`, `email`, `password`) and receive a 12-digit account number |
| `POST` | `/api/auth/signin` | Authenticate and receive a JWT |
| `GET` | `/api/auth/me` | Current user profile |
| `POST` | `/api/auth/logout-all` | Revoke all other sessions; returns a fresh token |
| `POST` | `/api/auth/change-password` | Change password (`currentPassword`, `newPassword`); revokes other sessions |

### Accounts & Balances
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/account` | Account details |
| `GET` | `/api/account/balance` | Balance in cents |
| `GET` | `/api/account/stats` | This month's total sent, total received and transfer count |
| `GET` | `/api/account/activity?days=30` | Daily money in / out, zero-filled |
| `GET` | `/api/account/lookup/:accountNumber` | Recipient name, to confirm before sending |

### Transfers & Ledger
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transfers` | Atomic, idempotent transfer (`toAccountNumber`, `amountCents`, `referenceId`, optional `note`) |
| `GET` | `/api/transactions` | Paginated history. Filters: `status`, `type` (`SEND`/`RECEIVE`), `rangeType` (`week`/`month`/`all`), `search`, `page`, `limit` |
| `GET` | `/api/transactions/:id` | A single transaction (only if you are a party to it) |

### Admin (role `admin` only; everyone else gets `403`)
| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/api/admin/accounts/:accountNumber/status` | Freeze or unfreeze an account (`status`: `ACTIVE` | `FROZEN`, optional `reason`) |
| `GET` | `/api/admin/transactions` | Every ledger entry in the bank, paginated. Filters: `accountNumber` (either party), `status`, `rangeType`, `search`, `page`, `limit` |

Transfer status codes: `201` success · `400` validation / self-transfer · `403` either account frozen · `404` unknown recipient · `409` reference ID used by someone else · `422` insufficient funds or key reused with different parameters.
