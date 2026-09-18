# IronVault: End-to-End Fintech Application Blueprint & Master Implementation Plan

> **Target Audience**: Software Engineers, AI Coding Agents (Claude Code / Claude Editor), DevOps  
> **Status**: Ready for Execution / Rebuild from Scratch  
> **Core Mission**: Build a production-grade, secure, financial banking & ledger platform with strict ACID transactional guarantees, idempotency protection, integer-based currency math, and an institutional-grade Next.js UI.

---

## 1. System Architecture & High-Level Design

### 1.1 Architecture Diagram
```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|   Next.js 16 (React 19, TypeScript, Tailwind CSS, Shadcn UI / Radix)     |
|   - Auth Context & Route Guards                                         |
|   - Dashboard (Balances, Stats, Real-time Visualizations)               |
|   - Transfers Form with Idempotency Key Engine                          |
|   - Searchable, Filterable & Paginated Ledger Table                     |
+------------------------------------+------------------------------------+
                                     | HTTPS / JSON (Bearer JWT)
                                     v
+-------------------------------------------------------------------------+
|                           APPLICATION TIER                              |
|   Node.js + Express.js API Gateway (Modular Architecture)               |
|   - Middlewares: CORS, Helmet, RateLimiter, JWT Auth, Input Validator  |
|   - Controllers: AuthController, AccountController, TransferController  |
|   - Services: TransactionService (ACID Runner & Idempotency Lock)       |
+------------------------------------+------------------------------------+
                                     | Mongoose ODM / Replica Set Driver
                                     v
+-------------------------------------------------------------------------+
|                              DATA TIER                                  |
|   MongoDB Cluster (Replica Set required for Multi-Document ACID)        |
|   - Collections: Users, Accounts, Transactions, IdempotencyKeys         |
|   - Strict Indexes & Unique Constraints                                 |
+-------------------------------------------------------------------------+
```

### 1.2 Core Invariants & Engineering Guarantees
1. **Zero Floating-Point Representation**: All monetary values are handled, calculated, and stored as integers in **cents** (`amountCents`, `balanceCents`). E.g., `$10.50` = `1050`. Divisor is strictly `100`.
2. **ACID Transaction Guarantee**: Every transfer operation runs inside a MongoDB multi-document session with transaction rollback on any failure. Balance updates and ledger records succeed together or fail together.
3. **Idempotency Protection**: Every transfer request requires a unique `referenceId` (idempotency key). Retried requests return the original outcome without double-debiting.
4. **Account Invariant**: Balances cannot drop below zero (`balanceCents >= 0`). Account numbers are immutable 12-digit numeric strings.
5. **Double-Entry Bookkeeping**: A transfer creates balanced debit/credit records linked to the same batch reference ID.

---

## 2. Data Models & Database Schemas (MongoDB / Mongoose)

### 2.1 User Schema (`backend/models/User.js`)
```typescript
interface IUser {
  _id: ObjectId;
  username: string;          // 3-32 chars, unique, trimmed, lowercase
  email: string;             // unique, valid email format, trimmed, lowercase
  passwordHash: string;      // bcrypt (salt rounds: 12)
  accountNumber: string;     // 12-digit string, unique index, immutable
  isActive: boolean;         // default: true
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indexes**:
  * `{ email: 1 }` (unique: true)
  * `{ username: 1 }` (unique: true)
  * `{ accountNumber: 1 }` (unique: true)

### 2.2 Account Schema (`backend/models/Account.js`)
```typescript
interface IAccount {
  _id: ObjectId;
  userId: ObjectId;          // ref: 'User', unique index
  accountNumber: string;     // 12-digit string, unique index
  balanceCents: number;      // Integer >= 0, min validator: 0
  currency: string;          // 'USD' (default)
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED'; // default: 'ACTIVE'
  version: number;           // Optimistic concurrency control (OCC)
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indexes & Rules**:
  * `{ userId: 1 }` (unique: true)
  * `{ accountNumber: 1 }` (unique: true)
  * Schema constraint: `balanceCents: { type: Number, required: true, min: [0, 'Insufficient balance'] }`

### 2.3 Transaction / Ledger Schema (`backend/models/Transaction.js`)
```typescript
interface ITransaction {
  _id: ObjectId;
  referenceId: string;           // Idempotency key (e.g. txn-timestamp-random), unique
  type: 'SEND' | 'RECEIVE';     // Viewed relative to user/account
  senderAccountNumber: string;   // 12 digits
  receiverAccountNumber: string; // 12 digits
  amountCents: number;           // Integer > 0
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```
* **Indexes**:
  * `{ referenceId: 1 }` (unique: true)
  * `{ senderAccountNumber: 1, createdAt: -1 }`
  * `{ receiverAccountNumber: 1, createdAt: -1 }`

### 2.4 Idempotency Record Schema (`backend/models/IdempotencyKey.js`)
```typescript
interface IIdempotencyKey {
  _id: ObjectId;
  key: string;               // Unique referenceId
  userId: ObjectId;
  endpoint: string;          // '/api/transfers'
  requestPayloadHash: string;// SHA256 of the transfer body
  responseStatus: number;    // e.g. 200, 400
  responseBody: any;
  createdAt: Date;           // TTL index for expiration (e.g. 7 days)
}
```
* **Indexes**:
  * `{ key: 1 }` (unique: true)
  * `{ createdAt: 1 }` (expireAfterSeconds: 604800)

---

## 3. Complete REST API Specifications

Base URL: `http://localhost:5000/api` (Production: `/api`)

### 3.1 Authentication Endpoints

#### `POST /api/auth/signup`
* **Request Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "username": "alice99",
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Validation**:
  * `username`: 3-32 characters, alphanumeric + underscores
  * `email`: valid email string
  * `password`: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
* **Action**:
  1. Hash password with bcrypt.
  2. Generate unique 12-digit `accountNumber` (e.g., `8800` + 8 random numeric digits).
  3. Inside a transaction, create `User` document and initial `Account` document with starting balance (e.g., initial test grant `100000` cents = `$1,000.00`).
* **Response `201 Created`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
    "user": {
      "id": "65f2...",
      "username": "alice99",
      "email": "alice@example.com",
      "accountNumber": "880012345678",
      "createdAt": "2026-09-18T18:00:00.000Z"
    }
  }
  ```

#### `POST /api/auth/signin`
* **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response `200 OK`**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "65f2...",
      "username": "alice99",
      "email": "alice@example.com",
      "accountNumber": "880012345678",
      "createdAt": "2026-09-18T18:00:00.000Z"
    }
  }
  ```

#### `GET /api/auth/me`
* **Headers**: `Authorization: Bearer <token>`
* **Response `200 OK`**:
  ```json
  {
    "id": "65f2...",
    "username": "alice99",
    "email": "alice@example.com",
    "accountNumber": "880012345678",
    "createdAt": "2026-09-18T18:00:00.000Z"
  }
  ```

---

### 3.2 Account Endpoints

#### `GET /api/account`
* **Headers**: `Authorization: Bearer <token>`
* **Response `200 OK`**:
  ```json
  {
    "id": "acc_65f2...",
    "accountNumber": "880012345678",
    "balanceCents": 100000,
    "userId": "65f2...",
    "createdAt": "2026-09-18T18:00:00.000Z"
  }
  ```

#### `GET /api/account/balance`
* **Headers**: `Authorization: Bearer <token>`
* **Response `200 OK`**:
  ```json
  {
    "balanceCents": 100000
  }
  ```

#### `GET /api/account/stats`
* **Headers**: `Authorization: Bearer <token>`
* **Response `200 OK`**:
  ```json
  {
    "totalSentCents": 25000,
    "totalReceivedCents": 10000,
    "transferCount": 5
  }
  ```

---

### 3.3 Transfer & Transaction Endpoints

#### `POST /api/transfers` (ACID + Idempotent)
* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "toAccountNumber": "880098765432",
    "amountCents": 5000,
    "referenceId": "txn-lm9234-92jdf90"
  }
  ```
* **Processing Workflow**:
  1. Check `IdempotencyKey` collection for `referenceId`. If found: return cached response immediately.
  2. Validate: `amountCents > 0`, `toAccountNumber !== senderAccountNumber`, sender exists, recipient exists.
  3. Start MongoDB session (`session.startTransaction()`).
  4. Fetch sender account with write lock: check `balanceCents >= amountCents`. If false, abort transaction with `400 Insufficient funds`.
  5. Atomically decrement sender: `Account.updateOne({ _id: senderAcc._id, balanceCents: { $gte: amountCents } }, { $inc: { balanceCents: -amountCents } })`.
  6. Atomically increment recipient: `Account.updateOne({ _id: recipientAcc._id }, { $inc: { balanceCents: amountCents } })`.
  7. Create `Transaction` ledger record (`status: 'SUCCESS'`).
  8. Save `IdempotencyKey` record with result.
  9. `session.commitTransaction()`.
* **Response `200 OK`**:
  ```json
  {
    "id": "txn_65f3...",
    "referenceId": "txn-lm9234-92jdf90",
    "type": "SEND",
    "senderAccountNumber": "880012345678",
    "receiverAccountNumber": "880098765432",
    "amountCents": 5000,
    "status": "SUCCESS",
    "createdAt": "2026-09-18T18:30:00.000Z",
    "updatedAt": "2026-09-18T18:30:00.000Z"
  }
  ```

#### `GET /api/transactions`
* **Headers**: `Authorization: Bearer <token>`
* **Query Params**:
  * `page` (number, default: 1)
  * `limit` (number, default: 10 or 25)
  * `status` (`SUCCESS` | `PENDING` | `FAILED`)
  * `search` (string: query by reference ID or account number)
  * `rangeType` (`week` | `month` | `all`)
* **Response `200 OK`**:
  ```json
  {
    "transactions": [
      {
        "id": "txn_65f3...",
        "referenceId": "txn-lm9234-92jdf90",
        "type": "SEND",
        "senderAccountNumber": "880012345678",
        "receiverAccountNumber": "880098765432",
        "amountCents": 5000,
        "status": "SUCCESS",
        "createdAt": "2026-09-18T18:30:00.000Z",
        "updatedAt": "2026-09-18T18:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```

#### `GET /api/transactions/:id`
* **Response `200 OK`**: Single transaction record.

---

## 4. Frontend Specifications & Component Architecture

### 4.1 Tech Stack & Directory Structure
```
Frontend/
├── app/
│   ├── layout.tsx                   # ThemeProvider, Toaster (Sonner), AuthProvider
│   ├── page.tsx                     # Auth routing redirect (Dashboard vs SignIn)
│   ├── globals.css                  # CSS Variables & Tailwind root
│   ├── auth/
│   │   ├── layout.tsx               # Minimal auth centered layout
│   │   ├── signin/page.tsx          # Sign-in form with validation
│   │   └── signup/page.tsx          # Sign-up form with password strength indicator
│   └── dashboard/
│       ├── layout.tsx               # Shell: Sidebar, Top Navbar, User Header
│       └── (main)/
│           ├── page.tsx             # Overview: BalanceCard, StatsSection, RecentTransactions
│           ├── transfers/page.tsx   # Transfer form with Idempotency Generator
│           ├── transactions/page.tsx# Full Ledger table with filters & pagination
│           └── settings/page.tsx    # Profile info & Security settings
├── components/
│   ├── dashboard/
│   │   ├── BalanceCard.tsx          # Large balance display in dollars, copy account #
│   │   ├── StatsSection.tsx         # Inflow/Outflow metric cards
│   │   ├── RecentTransactions.tsx   # Top 5 recent activity cards
│   │   ├── TransferForm.tsx         # Send money form with live fee/cents preview
│   │   ├── TransactionTable.tsx     # Paginated tabular ledger view
│   │   ├── TransactionFilters.tsx   # Filter dropdowns & search inputs
│   │   ├── ProfileSection.tsx       # Account & personal identity display
│   │   ├── SecuritySection.tsx      # Password info, session terminate, security checklist
│   │   ├── Navbar.tsx               # Header with user avatar & logout
│   │   └── Sidebar.tsx              # Navigation links (Overview, Transfer, Ledger, Settings)
│   └── ui/                          # Radix/Shadcn primitives (Button, Input, Card, Dialog, Badge)
├── context/
│   └── AuthContext.tsx              # User state, JWT storage, checkAuth, login, logout
├── hooks/
│   ├── useAuth.ts                   # Auth hook wrapper
│   └── use-toast.ts                 # Toast notification hook
└── lib/
    ├── api.ts                       # Typed Fetch wrapper with Bearer token injection
    ├── constants.ts                 # Endpoints, Validation constants, UI limits
    ├── types.ts                     # Full TypeScript interfaces
    └── utils.ts                     # cn() helper, generateIdempotencyKey()
```

### 4.2 Frontend State & Security Standards
1. **JWT Handling**: Token stored securely; automatically appended to `Authorization: Bearer <token>` in `lib/api.ts`.
2. **Auto-Logout on 401**: If any authenticated API call returns 401 Unauthorized, automatically clear token and push to `/auth/signin`.
3. **Form Submissions**: Disable all inputs and show spinners (`Processing...`) to prevent client-side double submits.
4. **Dollar-to-Cents Conversion Formula**:
   ```typescript
   const amountCents = Math.round(parseFloat(inputDollars) * 100);
   ```

---

## 5. Execution Phases: From Level 0 to Fully Deployable

### Phase 0: Environment Setup, Tooling & Scaffolding
- [ ] Initialize monorepo or standard folder structure (`/frontend` and `/backend`).
- [ ] Backend: Initialize `package.json`, install `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `bcryptjs`, `jsonwebtoken`, `express-rate-limit`, `zod`.
- [ ] Frontend: Next.js 16 with TypeScript, Tailwind CSS, Lucide icons, Sonner, Radix UI components.
- [ ] Setup linting and formatting (`prettier`, `eslint`, `tsconfig.json`).
- [ ] Configure environment variable templates (`.env.example` for both backend and frontend).

### Phase 1: Database & Backend Core Engine
- [ ] Establish MongoDB connection with replica set support (required for transactions; in local dev, use MongoDB Atlas or a Dockerized single-node replica set).
- [ ] Create Mongoose schemas: `User`, `Account`, `Transaction`, `IdempotencyKey`.
- [ ] Implement secure JWT Authentication middleware (`verifyToken`).
- [ ] Implement Auth Routes (`/signup`, `/signin`, `/me`) with bcrypt hashing and validation.
- [ ] Implement Account Routes (`/account`, `/account/balance`, `/account/stats`).

### Phase 2: ACID Transfer Engine & Idempotency Pipeline
- [ ] Build `TransferService.executeTransfer()` with explicit MongoDB session management:
  - Session startup: `session.startTransaction({ readPreference: 'primary', writeConcern: { w: 'majority' } })`.
  - Check idempotency cache first.
  - Query sender account with active session.
  - Verify `balanceCents >= amountCents`.
  - Atomic debit from sender and atomic credit to recipient.
  - Insert Transaction log with `referenceId`.
  - Save Idempotency record with response payload.
  - Commit transaction and end session.
  - Catch block with `session.abortTransaction()` on any error.
  - Implement Transaction List query with server-side pagination, regex search, date filter, and type filter.

### Phase 3: Frontend Architecture & UI Assembly
- [ ] Implement `lib/types.ts`, `lib/constants.ts`, and `lib/api.ts` fetch client.
- [ ] Set up `AuthContext.tsx` and route protection in Next.js.
- [ ] Build Auth pages: Sign In and Sign Up with real-time field validation.
- [ ] Build Dashboard Layout (Sidebar, Navbar, Theme toggles).
- [ ] Build Main Overview: `BalanceCard`, `StatsSection`, `RecentTransactions`.
- [ ] Build Transfers Page with `TransferForm` (live cents preview and idempotency key generator).
- [ ] Build Transaction Ledger Page with `TransactionTable` and `TransactionFilters`.
- [ ] Build Settings Page (`ProfileSection` and `SecuritySection`).

### Phase 4: Rigorous Testing & Concurrency Verification
- [ ] **Unit Tests**:
  - Currency conversion utilities (`centsToDollars`, `dollarsToCents`).
  - Validation schemas (12-digit account numbers, password complexity).
- [ ] **Integration Tests**:
  - Full Auth flow: Sign up user A, sign up user B.
  - Account generation verification (both users get accounts with unique numbers).
- [ ] **ACID Concurrency & Double-Spend Tests**:
  - Fire 10 parallel transfer requests of $50 from an account that only has $50. Only 1 transfer must succeed, 9 must fail with `400 Insufficient funds`.
- [ ] **Idempotency Verification Tests**:
  - Send identical transfer payload with identical `referenceId` multiple times simultaneously. Only 1 debit occurs; all responses return the same transaction ID.
- [ ] **E2E Smoke Tests**: Run complete browser user flow (sign up -> view balance -> send money -> verify ledger record on both accounts).

### Phase 5: Production Hardening, Docker & Deployment
- [ ] Security audits: Rate limiting on `/auth` and `/transfers` routes, Helmet headers enabled, CORS restricted to production frontend domain.
- [ ] Write multi-stage `Dockerfile` for Backend (Node 20 alpine) and Frontend (Next.js standalone build).
- [ ] Create `docker-compose.yml` orchestrating MongoDB (replica set), Backend, and Frontend.
- [ ] Production Deployment:
  - Backend: Render / Railway / AWS ECS with environment variables configured.
  - Frontend: Vercel / Cloudflare Pages / Railway with `NEXT_PUBLIC_API_BASE_URL`.
  - Database: MongoDB Atlas (M0/M10+ with automatic replica set support).

---

## 6. Complete Implementation Code References

### 6.1 Backend ACID Transfer Controller Implementation
```javascript
// backend/controllers/transferController.js
const mongoose = require('mongoose');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const IdempotencyKey = require('../models/IdempotencyKey');

exports.createTransfer = async (req, res) => {
  const { toAccountNumber, amountCents, referenceId } = req.body;
  const senderUserId = req.user.id;

  // 1. Input Validation
  if (!toAccountNumber || !amountCents || !referenceId) {
    return res.status(400).json({ success: false, message: 'Missing required transfer fields' });
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return res.status(400).json({ success: false, message: 'Transfer amount must be a positive integer in cents' });
  }

  // 2. Check Idempotency Key
  const existingKey = await IdempotencyKey.findOne({ key: referenceId });
  if (existingKey) {
    return res.status(existingKey.responseStatus).json(existingKey.responseBody);
  }

  // 3. Start MongoDB Session for Multi-Document ACID
  const session = await mongoose.startSession();
  session.startTransaction({
    readPreference: 'primary',
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' }
  });

  try {
    // 4. Find Sender Account
    const senderAccount = await Account.findOne({ userId: senderUserId }).session(session);
    if (!senderAccount) {
      throw new Error('Sender account not found');
    }
    if (senderAccount.accountNumber === toAccountNumber) {
      throw new Error('Cannot transfer money to your own account');
    }
    if (senderAccount.balanceCents < amountCents) {
      throw new Error('Insufficient funds for this transfer');
    }

    // 5. Find Recipient Account
    const recipientAccount = await Account.findOne({ accountNumber: toAccountNumber }).session(session);
    if (!recipientAccount) {
      throw new Error('Recipient account number not found');
    }

    // 6. Perform Atomic Debit & Credit
    const debitResult = await Account.updateOne(
      { _id: senderAccount._id, balanceCents: { $gte: amountCents } },
      { $inc: { balanceCents: -amountCents } },
      { session }
    );
    if (debitResult.modifiedCount !== 1) {
      throw new Error('Concurrency conflict or insufficient funds during debit');
    }

    await Account.updateOne(
      { _id: recipientAccount._id },
      { $inc: { balanceCents: amountCents } },
      { session }
    );

    // 7. Create Immutable Transaction Record
    const [transaction] = await Transaction.create([
      {
        referenceId,
        type: 'SEND',
        senderAccountNumber: senderAccount.accountNumber,
        receiverAccountNumber: recipientAccount.accountNumber,
        amountCents,
        status: 'SUCCESS',
      }
    ], { session });

    // 8. Save Idempotency Record Inside the Same Session
    const responsePayload = {
      id: transaction._id,
      referenceId: transaction.referenceId,
      type: 'SEND',
      senderAccountNumber: transaction.senderAccountNumber,
      receiverAccountNumber: transaction.receiverAccountNumber,
      amountCents: transaction.amountCents,
      status: transaction.status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    await IdempotencyKey.create([
      {
        key: referenceId,
        userId: senderUserId,
        endpoint: '/api/transfers',
        responseStatus: 200,
        responseBody: responsePayload,
      }
    ], { session });

    // 9. Commit Transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(responsePayload);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ success: false, message: error.message });
  }
};
```

---

## 7. Automated Test Suite Specification

### 7.1 Test Matrix
| Category | File | Test Cases |
| :--- | :--- | :--- |
| **Unit** | `tests/unit/currency.test.js` | Exact dollars-to-cents rounding, negative amount rejection, overflow checks |
| **Unit** | `tests/unit/idempotency.test.js` | Key format validation, uniqueness generator testing |
| **Integration** | `tests/integration/auth.test.js` | Registration -> Hash verification -> Auto account creation -> JWT issuance |
| **Integration** | `tests/integration/transfer.test.js` | Valid transfer -> Balance deduction on A -> Balance credit on B -> Ledger creation |
| **Stress/ACID** | `tests/stress/doubleSpend.test.js` | 20 concurrent requests attempting to drain single balance simultaneously |
| **E2E** | `cypress/e2e` or `playwright` | Login -> Send $25.00 -> View updated balance -> Check ledger pagination |

### 7.2 Concurrency / Double Spend Test Script
```javascript
// tests/stress/doubleSpend.test.js
describe('ACID Double Spend Prevention', () => {
  it('prevents double spending under concurrent requests', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      apiClient.post('/api/transfers', {
        toAccountNumber: userBAccount,
        amountCents: 5000,
        referenceId: `stress-test-${Date.now()}-${i}`
      })
    );

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failed = responses.filter(r => r.status === 'fulfilled' && r.value.status === 400);

    expect(successful.length).toBe(2);
    expect(failed.length).toBe(3);
    
    const finalBalance = await getBalance(userAAccount);
    expect(finalBalance).toBe(0);
  });
});
```

---

## 8. Deployment Configurations

### 8.1 Backend `.env.example`
```ini
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/ironvault?retryWrites=true&w=majority
JWT_SECRET=super_secure_random_jwt_secret_key_at_least_64_chars_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,https://ironvault.vercel.app
```

### 8.2 Frontend `.env.example`
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

---

## 9. Next Steps & Instructions for Claude Editor Hand-off

When giving this project to Claude Editor or any coding agent:
1. Provide this exact document as `SPECIFICATION.md` or `IMPLEMENTATION_PLAN.md`.
2. Instruct the agent:
   > *"Read `IMPLEMENTATION_PLAN.md` completely. Implement the system phase by phase starting with Phase 0 and Phase 1. Ensure all money is in integer cents, transfers use MongoDB multi-document ACID sessions, and the UI matches the Next.js 16 / Tailwind specifications."*
