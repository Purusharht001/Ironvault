# IronVault

A full-stack banking web application built with Next.js, Node.js, Express, and MongoDB. It allows registered users to manage account balances, send money to other users, and view an audit trail of incoming and outgoing transactions.

The project is designed with a strong focus on real-world financial data handling: preventing double-spending, maintaining ledger consistency, avoiding floating-point math issues, and deduplicating payment requests.

---

## Key Engineering Decisions

### 1. Integer-Based Currency Handling
In JavaScript, floating-point math causes rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In financial applications, even small rounding errors accumulate and corrupt balances.
* All balances and transfer amounts are stored and calculated strictly in whole integer **cents** (`balanceCents`, `amountCents`).
* Conversion to dollars/decimals occurs only at the presentation layer when displaying values in the UI.

### 2. Multi-Document ACID Transactions
Transferring funds requires two operations: decrementing the sender's balance and incrementing the receiver's balance. If either step fails, the system must revert.
* Transfers execute inside a MongoDB transaction session (`session.startTransaction()`).
* If a balance check fails or a network issue occurs midway, the entire transaction is rolled back (`session.abortTransaction()`), preventing loss of funds or partial debits.

### 3. Idempotency Keys (Preventing Duplicate Transfers)
Network dropouts or rapid double-clicks on a "Send Money" button can cause a client to submit duplicate transfer requests.
* Every transfer payload includes a client-generated `referenceId` (idempotency key).
* Before executing a debit, the backend verifies whether the `referenceId` has already been processed. If found, the server returns the cached response without debiting the account again.

### 4. Immutable Ledger
* Once written, transaction records cannot be modified or deleted.
* Every transfer creates a persistent ledger record containing sender, receiver, amount in cents, status, and timestamp.

---

## Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Lucide Icons, Sonner (toasts)
* **Backend:** Node.js, Express.js (v5), Mongoose ODM
* **Database:** MongoDB (Replica Set required for multi-document transaction sessions)
* **Authentication:** JWT (JSON Web Tokens) with passwords hashed via bcrypt

---

## Repository Structure

```text
fintech-web-app/
├── Frontend/
│   ├── app/
│   │   ├── auth/              # Sign-in & sign-up routes
│   │   ├── dashboard/         # Dashboard layouts, overview, transfers, ledger, settings
│   │   └── page.jsx           # Entry redirect logic
│   ├── components/
│   │   ├── dashboard/         # BalanceCard, StatsSection, TransferForm, TransactionTable
│   │   └── ui/                # Reusable UI primitives (buttons, inputs, cards)
│   ├── context/
│   │   └── AuthContext.jsx    # Client-side session and auth state
│   ├── lib/
│   │   ├── api.js             # Typed API client
│   │   ├── constants.js       # Route endpoints and validation limits
│   │   └── types.js           # Shared models & constants
│   └── package.json
│
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route logic (Auth, Account, Transfers)
│   ├── models/                # User, Account, Transaction, IdempotencyKey schemas
│   ├── server.js              # Server entry point
│   ├── .env.example           # Backend environment template
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
* Node.js (v18.x or later)
* npm or pnpm
* MongoDB Atlas account or local MongoDB instance configured with a replica set (needed for transactions)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on `.env.example`:

```ini
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend development server:

```bash
npm run dev
```

The API will run on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd ../Frontend
npm install
```

Create a `.env.local` file in the `Frontend/` directory:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Overview

### Authentication
* `POST /api/auth/signup` — Register a new user and generate a 12-digit account number.
* `POST /api/auth/signin` — Authenticate user and return JWT token.
* `GET /api/auth/me` — Retrieve current authenticated user profile.

### Accounts & Balances
* `GET /api/account` — Fetch account details for the authenticated user.
* `GET /api/account/balance` — Quick balance check in cents.
* `GET /api/account/stats` — Total sent, total received, and transfer counts.

### Transfers & Ledger
* `POST /api/transfers` — Execute an atomic transfer using an idempotency key.
* `GET /api/transactions` — Query paginated transaction history with status and date filters.
* `GET /api/transactions/:id` — Retrieve details for a specific transaction.

---
