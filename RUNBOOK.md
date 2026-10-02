# Ralix CRM (v5.1.0-HARDENED) — Operational Runbook & Developer Guide

This document provides step-by-step instructions to configure, run, test, and develop both the **Backend API Server** and the **Frontend Web Client** in the Ralix CRM monorepo.

---

## 1. Architecture Overview & Ports

```text
CRMS/
├── server/   → Express API Server + Outbox Background Worker (Port: 5000)
├── client/   → Next.js 15 App Router Frontend (Port: 3005)
└── prisma/   → Authoritative hardened schema (53 models, 32 enums, raw SQL constraints)
```

| Service | Port | Endpoint URL | Health Check / Note |
|---|---|---|---|
| **Backend Server** | `5000` | `http://localhost:5000` | `http://localhost:5000/health/liveness` |
| **Frontend Client** | `3005` | `http://127.0.0.1:3005` | Bound to `0.0.0.0` for IPv4 Windows compatibility |
| **PostgreSQL** | `5432` | `localhost:5432` | Database: `ralix_crm` |
| **Redis** | `6379` | `localhost:6379` | Token bucket rate limiter & BullMQ queues |

> **Note on Ports**: Default ports `3000` and `4000` were avoided because other development projects on your machine actively occupy them. Ralix CRM uses `5000` (server) and `3005` (client).

---

## 2. Environment Configuration

### Server Environment (`server/.env`)
Ensure `server/.env` contains the required keys:
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ralix_crm?schema=public&sslmode=prefer"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ralix_crm?schema=public&sslmode=prefer"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="development-jwt-secret-minimum-32-characters-ralix-crm-dev"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
RATE_LIMIT_AUTH_PER_MIN=10
RATE_LIMIT_WEBHOOK_PER_MIN=60
RATE_LIMIT_API_PER_MIN=600
CORS_ORIGIN="http://localhost:3005,http://localhost:3000,http://127.0.0.1:3005"
```

---

## 3. Step-by-Step Execution Guide

### Step 1: Install Dependencies
If you ever clone or setup freshly on a new machine:
```powershell
# From project root:
cd server
npm install

cd ../client
npm install
```

### Step 2: Database Initialization (Prisma & Raw SQL Constraints)
The database migration includes all hardened architectural partial indexes and composite foreign keys:
```powershell
cd server
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init_hardened_schema

# Seed capabilities catalogue, system admin, and Acme Realty demo tenant
npm run seed
```

### Step 3: Start the Backend Server (Terminal 1)
```powershell
cd server
npm run dev
```
**Expected Output**:
```text
[INFO] 🚀 Ralix CRM Server booted successfully
  port: 5000
  environment: "development"
  apiPrefix: "/api/v1"
```
Verify via browser or curl:
`http://localhost:5000/health/liveness` $\rightarrow$ `{"status":"UP"}`

### Step 4: Start the Frontend Client (Terminal 2)
```powershell
cd client
npm run dev
```
*Note: `npm run dev` in `client` serves the pre-compiled, high-performance production build on `http://0.0.0.0:3005` in ~15ms.*

If you make modifications to frontend code (`client/src/*`):
```powershell
cd client
npm run build   # Rebuilds in ~1.5 seconds
npm run dev     # Starts the updated server
```

---

## 4. How to Access the Application

Open your browser to:
👉 **`http://127.0.0.1:3005`** or **`http://localhost:3005`**

### Available Pages:
1. **Executive Dashboard (`/`)**: High-level conversion metrics, net revenue, 120s SLA compliance rate, and system invariant guards.
2. **5-Dimensional Lead Pipeline (`/leads`)**: 
   - 9-stage Kanban board (`NEW`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT`, `NEGOTIATION`, `BOOKING`, `WON`, `CANCELLED`, `LOST`).
   - Click any card to open the **360° Lead Detail Drawer** with separate controls for all 5 dimensions.
   - Click `[Cost Sheet]` to open the interactive calculator with role discount cap checks.
3. **Unit Inventory & Holds (`/inventory`)**: 
   - Real-time architectural floor matrix.
   - Click on available units to lock an exclusive **15-minute hold** with `SELECT ... FOR UPDATE` concurrency protection.
4. **Reports & Audit Trail (`/reports`)**: 
   - Strict separation of Gross Bookings (`WON`) from Net Converted Deals (`WON - CANCELLED`).
   - Append-only financial milestone ledger and compliance audit log.
5. **Login (`/login`)**: 
   - Demo Tenant Admin: `admin@acme.com` / `Password123!`
   - Demo CSE Agent: `agent1@acme.com` / `Password123!`

---

## 5. Running the Verification & Invariant Test Suite

Ralix CRM includes an automated suite verifying every non-negotiable architectural invariant:
```powershell
cd server
npm run test
```
**Expected Test Results**:
```text
✓ tests/invariants/inventory-concurrency.spec.ts (5 tests)
✓ tests/invariants/payment-invariants.spec.ts (5 tests)
✓ tests/invariants/lead-lifecycle.spec.ts (8 tests)
✓ tests/invariants/role-invariants.spec.ts (6 tests)
✓ tests/invariants/webhook-invariants.spec.ts (4 tests)
✓ tests/invariants/lead-assignment.spec.ts (5 tests)
✓ tests/invariants/tenant-isolation.spec.ts (5 tests)
✓ tests/invariants/channel-partner-and-comms.spec.ts (7 tests)
✓ tests/unit/auth-and-security.spec.ts (8 tests)
✓ tests/unit/normalize.spec.ts (10 tests)
✓ tests/unit/reporting.spec.ts (2 tests)
✓ tests/unit/foundation.spec.ts (6 tests)

Test Files: 12 passed (12) | Tests: 71 passed (71)
```

To run full TypeScript typechecking across both server and client:
```powershell
cd server
npm run typecheck   # 0 errors

cd ../client
npm run typecheck   # 0 errors
```

---

## 6. Troubleshooting Common Issues

### Issue A: `Error: listen EADDRINUSE: address already in use :::3005` or `:::5000`
Another process is already holding the port.
**Resolution**:
```powershell
# Find and terminate the process holding port 3005:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3005).OwningProcess | Stop-Process -Force

# Find and terminate the process holding port 5000:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Issue B: Browser tab stuck on `Loading...` with empty `<body>`
Occurs if the browser attempts to connect over IPv6 while the socket is bound only to IPv4, or vice versa.
**Resolution**:
Always navigate directly to **`http://127.0.0.1:3005`** and ensure `client/package.json` specifies `-H 0.0.0.0 -p 3005`.
