# Ralix CRM — Greenfield Implementation State & Execution Baseline
**Architecture Baseline**: `v5.1.0-HARDENED` (Authoritative Blueprint)  
**Creation Date**: 2026-09-28  
**Repository State**: Greenfield Scaffolding (No legacy code reused)

---

## 1. Document Authority & Contradiction Resolutions

### 1.1 Source of Truth Hierarchy
1. **Primary Authority**: `ARCHITECTURE.md` (`v5.1.0-HARDENED`)
2. **Implementation Guidance**: `IMPLEMENTATION_PLAN.md`, `TRANSACTION_MATRIX.md`, `INVARIANT_TEST_PLAN.md`
3. **Decision & TBD Register**: `IMPLEMENTATION_DECISIONS.md`
4. **Historical Assessment Only**: `IMPLEMENTATION_STATUS.md` (Audit of deprecated repository; contains zero assumed existing code)

### 1.2 Reconciliation & Clarifications Across Documents
During cross-examination of the authoritative documents, the following discrepancies were identified and resolved strictly in favor of the Primary Authority (`ARCHITECTURE.md`):

1. **Lead Lifecycle Stages (`LeadLifecycleStage`)**:
   - *Implementation Plan Listing (§Phase 3)*: Abbreviated as `NEW`, `IN_PROGRESS`, `CONVERTED`, `LOST`, `CANCELLED`.
   - *Architecture (§10.1, §10.3, §47)*: Explicitly defines the **9 authoritative stages**: `NEW`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT`, `NEGOTIATION`, `BOOKING`, `WON`, `CANCELLED`, `LOST`.
   - *Resolution*: Implement the full 9-stage lifecycle defined in `ARCHITECTURE.md`. `IN_PROGRESS` and `CONVERTED` were deprecated legacy artifacts from 4.0.0.

2. **Lead Assignment Open State Invariant (`LeadAssignment`)**:
   - *Implementation Plan Listing (§Phase 4)*: Mentioned `WHERE is_active = true`.
   - *Architecture (§11.1, §47.1) & Transaction Matrix (§3.1)*: Defines `releasedAt DateTime?` where `NULL` indicates an open assignment, enforced by:
     ```sql
     CREATE UNIQUE INDEX lead_assignment_one_open_per_lead
       ON "LeadAssignment" ("leadId") WHERE "releasedAt" IS NULL;
     ```
   - *Resolution*: Follow `ARCHITECTURE.md` and `TRANSACTION_MATRIX.md` using `releasedAt IS NULL`. No `isActive` boolean column on `LeadAssignment`.

3. **Booking Cancellation & Lead Lifecycle Reaction**:
   - *Contract*: Booking cancellation sets `Booking.status = CANCELLED`, voids milestones, and releases unit. The transition of `Lead` from `WON` to `CANCELLED` is asynchronous and driven strictly by the `BookingCancelled` domain event through the outbox worker, preserving domain boundaries. `WON → LOST` is strictly prohibited.

---

## 2. Technology Stack

| Layer | Selected Technologies | Architectural Rationale & Constraints |
|---|---|---|
| **Runtime & Language** | Node.js (LTS), TypeScript 5.7+ | Strict TypeScript typing (`noImplicitAny: true`, `strictNullChecks: true`). |
| **API Framework** | Express 4.21+ / Express 5 | Thin controllers; transport validation via Zod; centralized error pipeline. |
| **Data & ORM** | PostgreSQL 16 (Neon Serverless), Prisma 5/6 | Connection pooling (`pgbouncer` directUrl/dbUrl configuration); raw SQL migration scripts for non-Prisma constraints. |
| **Identity & Security** | Argon2id (`@node-rs/argon2`), JSON Web Tokens (`jsonwebtoken`), `crypto` | Memory-hard password hashing; short-lived access tokens + server-side session cache; rotating refresh tokens. |
| **Asynchronous Engine** | Redis (`ioredis`), BullMQ | Deterministic job IDs, delayed SLA timers (120s), queue rate-limiting, dead-letter queues. |
| **Observability** | Pino / Winston, `AsyncLocalStorage` | Structured JSON logs; automated PII redaction; end-to-end `correlationId` propagation. |
| **Testing Harness** | Vitest, Supertest, Testcontainers / Isolated PG | Fast test execution; transactional test rollback; invariant verification suite. |
| **Frontend (Phase 14)** | Next.js 15+ (App Router), React 19, Vanilla CSS | Server-side rendering, zero client-side authorization authority, modern design aesthetic. |

---

## 3. Project Structure

A clean modular monorepo structure separating backend application, background workers, shared contracts, and client experience:

```text
CRMS/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma              # Authoritative Prisma schema matching §47
│   │   ├── migrations/                # Version-controlled SQL migrations (including §47.1 raw SQL)
│   │   └── seed.ts                    # Bootstrap seed script (System roles, permissions, dev tenant)
│   ├── src/
│   │   ├── config/                    # Zod-validated environment config
│   │   ├── core/                      # Cross-cutting primitives
│   │   │   ├── errors/                # Typed AppErrors & HTTP error mapper (§27.4)
│   │   │   ├── logging/               # Structured logger with PII masking & correlationId
│   │   │   ├── context/               # AsyncLocalStorage for Request/ActorContext
│   │   │   └── database/              # Prisma client singleton & transaction runner
│   │   ├── security/                  # Security & authorization layer (§6, §7, §31)
│   │   │   ├── auth/                  # Password hashing (Argon2id), JWT, Session store
│   │   │   ├── authorization/         # Capability & Scope evaluator, TargetValidator
│   │   │   ├── pii/                   # PII masking projection interceptor
│   │   │   └── middleware/            # Auth guard, Org isolation guard, Rate limiter
│   │   ├── domain/                    # Pure domain models, enums & state machines (§8-§19)
│   │   │   ├── lead/                  # 5-dimensional state machines, transition validators
│   │   │   ├── inventory/             # Hold status machine, Unit availability rules
│   │   │   ├── booking/               # Booking lifecycle & hold consumption
│   │   │   ├── payment/               # Payment lifecycle, append-only refund rules
│   │   │   └── siteVisit/             # Visit state machine & reschedule tracking
│   │   ├── application/               # Use cases, commands, queries, orchestrators
│   │   │   ├── lead/                  # CreateLead, AssignLead, ChangeStage
│   │   │   ├── inventory/             # HoldUnit, ReleaseUnit, ExpireHolds
│   │   │   ├── booking/               # CreateBooking, CancelBooking
│   │   │   ├── payment/               # RecordPayment, SettlePayment, RefundPayment
│   │   │   └── outbox/                # OutboxPublisher, OutboxProcessor
│   │   ├── infrastructure/            # Outward adapters & storage (§20, §23, §30)
│   │   │   ├── repositories/          # Tenant-scoped Prisma repositories (§34.1)
│   │   │   ├── outbox/                # Transactional Outbox poller & BullMQ dispatcher
│   │   │   ├── queues/                # BullMQ queue definitions, worker handlers
│   │   │   ├── storage/               # Object storage adapter (signed URL generator)
│   │   │   └── adapters/              # MetaLeadAdapter, WhatsAppCloudAdapter, ExotelAdapter
│   │   ├── api/                       # API controllers & routing (§27)
│   │   │   ├── v1/                    # Versioned routes (/api/v1/*)
│   │   │   ├── webhooks/              # Provider webhook ingestion endpoints
│   │   │   └── middlewares/           # Request validation, correlation, error handling
│   │   └── workers/                   # Background worker process entry points
│   │       ├── outboxWorker.ts        # Outbox event distributor
│   │       ├── slaWorker.ts           # SLA breach detector & failover router
│   │       ├── holdExpiryWorker.ts    # Expired hold sweeper
│   │       └── webhookWorker.ts       # Async webhook processor
│   ├── tests/
│   │   ├── invariants/                # Executable suite from INVARIANT_TEST_PLAN.md
│   │   ├── integration/               # Multi-table command integration tests
│   │   └── unit/                      # Domain state machine & pricing calculation tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── client/                            # Next.js 15+ frontend application (Phase 14)
├── ARCHITECTURE.md                    # Primary Authority (v5.1.0-HARDENED)
├── IMPLEMENTATION_PLAN.md             # Phased execution plan
├── IMPLEMENTATION_DECISIONS.md        # TBD register & interim dev defaults
├── TRANSACTION_MATRIX.md              # Mutation transaction boundaries
├── INVARIANT_TEST_PLAN.md             # Invariant test specification
└── GREENFIELD_IMPLEMENTATION_STATE.md # This authoritative baseline document
```

---

## 4. Tenancy & Data Classification Model

Shared-schema, row-level multi-tenancy governed by four strict entity classes (§5.1–§5.4):

### 4.1 Entity Classification
- **Root**: `Organization` (defines isolation boundary).
- **Class G (Global / Non-tenant)**: `User` (global identity), `Permission` (system capability catalogue). **`User` MUST NEVER have an `organizationId`.**
- **Class A (Direct Tenant Ownership)**: Carries immutable `organizationId`. Includes:
  `OrganizationMembership`, `Session`, `Role` (tenant role mode), `Team`, `Project`, `Tower`, `PropertyUnit`, `InventoryHold`, `OrganizationSetting`, `Customer`, `Lead`, `LeadAssignment`, `LeadStageHistory`, `LeadStatusHistory`, `LeadTemperatureHistory`, `LeadScoreHistory`, `LeadDispositionHistory`, `DuplicateCandidate`, `Campaign`, `LeadSource`, `ChannelPartner`, `LeadAttribution`, `AttributionHistory`, `CommissionRule`, `CommissionPayout`, `SiteVisit`, `FollowUp`, `Note`, `Task`, `CallAttempt`, `CallRecord`, `Conversation`, `WhatsAppTemplate`, `WhatsAppMessage`, `PricingRuleSet`, `PricingRuleVersion`, `CostSheet`, `Booking`, `BookingStatusHistory`, `PaymentMilestone`, `Payment`, `ActivityTimeline`, `AuditLog`, `WebhookEvent`, `OutboxEvent`, `Notification`.
- **Class B (Deterministic Inherited Tenancy)**: Pure join models inheriting tenancy through exactly one non-null parent. Never a query root:
  `RolePermission` (via `Role`), `TeamMember` (via `Team`), `TeamProject` (via `Team`), `UserProject` (via `OrganizationMembership`).

### 4.2 Structural Tenancy Invariants
1. `organizationId` is derived exclusively from the authenticated `ActorContext.organizationId`. **Accepting `organizationId` from client query, params, or body is an architectural defect.**
2. Session Triad Structural Invariant:
   `Session.userId == OrganizationMembership.userId`  
   `Session.organizationId == OrganizationMembership.organizationId`  
   `Session.membershipId == OrganizationMembership.id`  
   Enforced at DB level by composite FK `FOREIGN KEY (membershipId, userId, organizationId) REFERENCES OrganizationMembership(id, userId, organizationId) ON DELETE CASCADE`.

---

## 5. Dual-Mode Role & Authorization Model

### 5.1 Dual-Mode Roles (§5.3, §7.8)
- **Tenant Role**: `organizationId IS NOT NULL AND isSystem = FALSE`. Scoped to `SELF`, `TEAM`, `PROJECT`, or `ORGANIZATION`.
- **System Role**: `organizationId IS NULL AND isSystem = TRUE AND scope = 'GLOBAL'`. Exclusively for platform super-administrators.
- **Database CHECK constraints (§47.1)**:
  - `role_system_null_org_check`: `CHECK ("organizationId" IS NOT NULL OR ("isSystem" = TRUE AND "scope" = 'GLOBAL'))`
  - `role_global_scope_check`: `CHECK ("scope" != 'GLOBAL' OR ("organizationId" IS NULL AND "isSystem" = TRUE))`
  - `role_system_scope_check`: `CHECK ("isSystem" = FALSE OR "organizationId" IS NULL)`
  - Partial Unique Index: `CREATE UNIQUE INDEX role_system_slug_unique ON "Role" (slug) WHERE "organizationId" IS NULL;`

### 5.2 Authorization Pipeline (§7.1)
$$\text{Access} = \text{Auth} \land \text{Tenant} \land \text{Capability} \land \text{Scope} \land \text{Ownership} \land \text{TargetValid} \land \text{Preconditions}$$
- **Capability**: Checked via named permission keys (e.g. `LEAD_ASSIGN`, `PAYMENT_REFUND`, `UNIT_HOLD`).
- **Scope**: Resolves record visibility (`SELF`, `TEAM`, `PROJECT`, `ORGANIZATION`, `GLOBAL`). Scope precedence is additive for records (union rule), never for capabilities.
- **Target Validation**: All foreign entity IDs submitted in mutations are validated in-transaction for active existence and identical `organizationId`.
- **Cache Invalidation**: Membership role/status changes increment `OrganizationMembership.authorizationVersion`. Token version mismatches fail closed immediately on the next request.

---

## 6. Database Constraints & Raw SQL Requirements

The following raw SQL migrations are mandatory and cannot be expressed in standard Prisma schema syntax (§47.1):

```sql
-- 1. Inventory Hold Single-Active-Per-Unit Invariant (§14.3)
CREATE UNIQUE INDEX inventory_hold_one_active_per_unit
  ON "InventoryHold" ("unitId") WHERE status = 'ACTIVE';

-- 2. Lead Single-Open-Assignment Invariant (§11.1)
CREATE UNIQUE INDEX lead_assignment_one_open_per_lead
  ON "LeadAssignment" ("leadId") WHERE "releasedAt" IS NULL;

-- 3. Channel Partner Single-Active-Attribution Invariant (§18.1)
CREATE UNIQUE INDEX attribution_one_active_per_customer
  ON "LeadAttribution" ("organizationId", "customerId") WHERE status = 'ACTIVE';

-- 4. Positive Payment Amount Invariant (§17.3)
ALTER TABLE "Payment" ADD CONSTRAINT payment_amount_positive CHECK (amount > 0);

-- 5. Audit Log Database Privilege Invariant (§32.4)
REVOKE UPDATE, DELETE ON "AuditLog" FROM application_role;

-- 6. Role Dual-Mode Integrity Checks (§7.8)
CREATE UNIQUE INDEX role_system_slug_unique
  ON "Role" (slug) WHERE "organizationId" IS NULL;

ALTER TABLE "Role" ADD CONSTRAINT role_system_null_org_check
  CHECK ("organizationId" IS NOT NULL OR ("isSystem" = TRUE AND "scope" = 'GLOBAL'));

ALTER TABLE "Role" ADD CONSTRAINT role_global_scope_check
  CHECK ("scope" != 'GLOBAL' OR ("organizationId" IS NULL AND "isSystem" = TRUE));

ALTER TABLE "Role" ADD CONSTRAINT role_system_scope_check
  CHECK ("isSystem" = FALSE OR "organizationId" IS NULL);

-- 7. Session Triad Structural Invariant (§5.8, §6.3)
ALTER TABLE "Session" ADD CONSTRAINT session_membership_user_org_fk
  FOREIGN KEY ("membershipId", "userId", "organizationId")
  REFERENCES "OrganizationMembership" ("id", "userId", "organizationId")
  ON DELETE CASCADE;

-- 8. Lead Source Provider Uniqueness (§10.9)
CREATE UNIQUE INDEX lead_source_org_provider_unique
  ON "LeadSource" ("organizationId", "provider") WHERE "provider" IS NOT NULL;

-- 9. External Lead Record Deduplication (§10.9, §21.4)
CREATE UNIQUE INDEX lead_external_id_unique
  ON "Lead" ("organizationId", "sourceId", "externalLeadId") WHERE "externalLeadId" IS NOT NULL;

-- 10. Composite Foreign Keys Enforcing Same-Tenant References (§5.6)
ALTER TABLE "Lead" ADD CONSTRAINT lead_customer_same_tenant_fk
  FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer" ("id", "organizationId") ON DELETE RESTRICT;

ALTER TABLE "Booking" ADD CONSTRAINT booking_lead_same_tenant_fk
  FOREIGN KEY ("leadId", "organizationId") REFERENCES "Lead" ("id", "organizationId") ON DELETE RESTRICT;

ALTER TABLE "Booking" ADD CONSTRAINT booking_customer_same_tenant_fk
  FOREIGN KEY ("customerId", "organizationId") REFERENCES "Customer" ("id", "organizationId") ON DELETE RESTRICT;

ALTER TABLE "Booking" ADD CONSTRAINT booking_unit_same_tenant_fk
  FOREIGN KEY ("unitId", "organizationId") REFERENCES "PropertyUnit" ("id", "organizationId") ON DELETE RESTRICT;

ALTER TABLE "Payment" ADD CONSTRAINT payment_booking_same_tenant_fk
  FOREIGN KEY ("bookingId", "organizationId") REFERENCES "Booking" ("id", "organizationId") ON DELETE RESTRICT;

ALTER TABLE "InventoryHold" ADD CONSTRAINT hold_unit_same_tenant_fk
  FOREIGN KEY ("unitId", "organizationId") REFERENCES "PropertyUnit" ("id", "organizationId") ON DELETE RESTRICT;
```

---

## 7. Master Transaction Boundaries & Concurrency Guarantees

As governed by `TRANSACTION_MATRIX.md` and `ARCHITECTURE.md` §35-§36:

### 7.1 Mutation Pipeline Sequence
1. Actor Authorization (Capability + Scope)
2. Target Validation (Same-tenant verification)
3. Business Preconditions (State machine legality)
4. Domain Mutation (Atomic SQL write)
5. Historical Audit Record (Dedicated history table)
6. Security Audit Log (Immutable `AuditLog` row)
7. Transactional Outbox (`OutboxEvent` row with closed `DomainEventType`)

### 7.2 Strict Concurrency Rules
1. **Zero External Calls Inside Domain Transactions**: Provider HTTP requests (Meta, WhatsApp, Payment Gateway, Telephony) MUST NEVER run inside a database transaction.
2. **Canonical Lock Acquisition Order**: To prevent deadlocks, multi-row locks must be acquired in topological order:  
   `PropertyUnit` $\rightarrow$ `InventoryHold` $\rightarrow$ `Booking` $\rightarrow$ `Payment`.
3. **Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**: Mandatory for contended physical resources (`PropertyUnit`).
4. **Optimistic Versioning (`version`)**: Checked and incremented on mutable long-lived records (`Lead`, `Customer`, `Booking`, `CostSheet`).
5. **Hold Consumption Boundary**: An active `InventoryHold` is transitioned to `CONSUMED` at booking creation (`DRAFT`), not at booking confirmation.
6. **Append-Only Refund Invariant**: Settled payments (`SUCCEEDED`) are strictly immutable. A refund creates a new compensating `Payment` row referencing `reversalOfPaymentId` where $\sum(\text{refunds}) \le \text{originalPayment.amount}$.

---

## 8. Required Background Workers & Queues

All background execution is decoupled via Redis & BullMQ (§24):

1. **Transactional Outbox Publisher / Dispatcher**:
   - Poller queries `OutboxEvent` using `FOR UPDATE SKIP LOCKED` ordered by `createdAt`.
   - Dispatches events to corresponding BullMQ queues.
2. **SLA Window Worker**:
   - Evaluates active leads against `slaDueAt`.
   - Transitions `WITHIN_SLA → DUE_SOON → BREACHED`.
   - Executes failover reassignment if CSE is unresponsive.
3. **Inventory Hold Expiry Sweeper**:
   - Queries `InventoryHold` where `status = 'ACTIVE' AND expiresAt <= NOW()`.
   - Atomically transitions hold to `EXPIRED` and resets `PropertyUnit.availability = 'AVAILABLE'`.
4. **Webhook Processing Worker**:
   - Consumes pending `WebhookEvent` rows from Redis queue.
   - Executes idempotently based on `(provider, providerEventId)`.
5. **Dead-Letter Queue (DLQ) & Reconciliation Worker**:
   - Captures jobs failing after 5 retries.
   - Provides administrative replay API and stale payment reconciliation sweep.

---

## 9. Required External Integrations & Adapters

External integrations reside strictly behind isolated provider adapters (§20):
- **Meta Lead Ads Adapter**: Webhook signature verification (`X-Hub-Signature-256`), payload normalization, external lead ID extraction.
- **WhatsApp Cloud API Adapter**: Two-way messaging, template parameter validation, delivery status webhook processing.
- **Telephony Adapter (Exotel / Knowlarity)**: Duplex click-to-call, masked customer numbers, call recording webhooks.
- **Payment Gateway Adapter**: Intent-first ordering, payment verification signatures, webhook reconciliation.

---

## 10. Testing Strategy & Invariant Test Suite

Follows `INVARIANT_TEST_PLAN.md` with tests located under `server/tests/invariants/`:

| Invariant Suite | Test File | Key Invariants Verified |
|---|---|---|
| **Tenant Isolation** | `tenant-isolation.spec.ts` | Cross-tenant lead/customer, booking/unit, payment/booking, session hijacking, lead assignment rejected. |
| **Session Integrity** | `session-invariants.spec.ts` | Triad constraint enforcement, immediate token revocation on `authorizationVersion` bump. |
| **Dual-Mode Roles** | `role-invariants.spec.ts` | Rejection of system role with orgId, rejection of tenant role with GLOBAL scope, slug uniqueness. |
| **Inventory Concurrency** | `inventory-concurrency.spec.ts` | 20 concurrent holds yield exactly 1 winner and 19 `409 CONFLICT`; DB partial index blocks duplicate active hold. |
| **Lead Assignment & SLA** | `lead-assignment.spec.ts` | Exactly 1 open assignment per lead; reassignment closes previous, resets SLA window, preserves breach history. |
| **Webhook Idempotency** | `webhook-invariants.spec.ts` | Concurrent replay of identical `(provider, providerEventId)` creates exactly 1 event and 1 domain entity. |
| **External Lead Deduplication** | `external-lead.spec.ts` | Retried provider delivery with same `(organizationId, sourceId, externalLeadId)` updates rather than duplicates. |
| **Financial Immutability** | `payment-invariants.spec.ts` | Settled payment cannot be mutated in place; refund creates compensating row; over-refund rejected. |
| **Lifecycle State Machine** | `lead-lifecycle.spec.ts` | Forbidden `WON → LOST`; terminal `CANCELLED`; allowed `LOST → NEW` increments `lifecycleCycle`. |
| **Authorization & Scope** | `authorization-invariants.spec.ts` | Capability without scope rejected; target validation enforces same-tenant references. |

---

## 11. Observability & Error Handling Contracts

### 11.1 Standardized API Error Contract (§27.4)
All error responses adhere to the standard envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Safe human-readable message without PII or internal leaks",
    "target": "field_or_entity_identifier",
    "details": [],
    "correlationId": "req_12345"
  }
}
```

### 11.2 Observability Primitives (§37)
- **Correlation ID**: Middleware extracts or generates `X-Correlation-ID` and stores it in `AsyncLocalStorage`.
- **Structured Logging**: JSON logging (Pino) auto-injecting `correlationId`, `organizationId`, `userId`. Automatic regex/key redaction of customer phone, email, and tokens.
- **Health Checks**: `/health/liveness` (process up) vs. `/health/readiness` (DB and Redis connectivity confirmed).

---

## 12. Register of Unresolved Decisions & Interim Defaults

From `IMPLEMENTATION_DECISIONS.md`:

| Decision ID | Topic | Blocked Phase | Interim Development Strategy |
|---|---|---|---|
| **DEC-001** | Token Lifetimes | Phase 2 | `ACCESS_TOKEN_TTL = 15m`, `REFRESH_TOKEN_TTL = 7d` |
| **DEC-002** | Lockout Thresholds | Phase 2 | 5 failed attempts in 15m $\rightarrow$ 30m lock |
| **DEC-003** | Argon2id Parameters | Phase 2 | RFC 9106 baseline: `m=65536` (64MB), `t=3`, `p=4` |
| **DEC-004** | Global Break-Glass | Phase 2 | Disabled for normal login; seeded scripts only |
| **DEC-005** | Legal Data Retention | Phase 13 | Indefinite retention; soft deletion via `deletedAt` |
| **DEC-006** | PII Anonymization Policy | Phase 13 | Non-destructive placeholder masking (`REDACTED`) |
| **DEC-007** | RPO / RTO Targets | Phase 15 | Neon automated point-in-time recovery & WAL archiving |
| **DEC-008** | DR Drill Schedule | Phase 15 | Documented manual restore procedure |
| **DEC-009** | DB Table Partitioning | Phase 15 | Single table with composite B-tree indexes |
| **DEC-010** | Rate Limit Thresholds | Phase 15 | Auth: 10/min, Webhooks: 60/min, Tenant APIs: 600/min |
| **DEC-011** | Idempotency Key TTL | Phase 11 | 48-hour Redis TTL |
| **DEC-012** | API Deprecation Window | Phase 14 | `v1` prefix standard; `Sunset` headers on deprecation |
| **DEC-013** | SLA Qualifying Actions | Phase 4 | Connected call (`duration > 0`) or outbound WhatsApp |
| **DEC-014** | Multi-Org Rollout Mode | Phase 1 | Admin CLI / seed provisioning only |

---

## 13. Phased Implementation Roadmap & Dependency Order

```text
Phase 0: Foundation (Project Scaffolding, TypeScript, Config, Logger, Error Contract, Test Setup)
    │
    ▼
Phase 1: Database & Tenancy (Prisma Schema §47, Raw SQL Migrations §47.1, Seeds, DB Invariant Tests)
    │
    ▼
Phase 2: Authentication & Authorization (Argon2id, Sessions, ActorContext, Capability/Scope Guards)
    │
    ▼
Phase 3: Core CRM & 5-Dimensional Lead Domain (Customer, Lead, Cycles, History Models, Normalizer)
    │
    ▼
Phase 4: Lead Distribution & SLA Engine (LeadAssignment, Single-Open Index, SLA Timers, Failover)
    │
    ▼
Phase 5: Site Visit Management (Visit State Machine, Rescheduling History, Geofencing/OTP)
    │
    ▼
Phase 6: Inventory Management & Concurrency Control (FOR UPDATE Locks, Hold Expiry Sweeper)
    │
    ▼
Phase 7: Pricing Rules, Versions & Cost Sheets (PricingRuleVersion, Component Calc, Approvals)
    │
    ▼
Phase 8: Booking Lifecycle & Hold Consumption (Atomic Hold Consumption, Booking Machine)
    │
    ▼
Phase 9: Payments, Milestones & Append-Only Refunds (Immutability, Compensating Reversals)
    │
    ▼
Phase 10: Communication & External Integrations (Meta, WhatsApp, Exotel, SendGrid Adapters)
    │
    ▼
Phase 11: Webhooks, Transactional Outbox & Background Queues (Outbox Poller, BullMQ, DLQ)
    │
    ▼
Phase 12: Reporting, Funnel Analytics & Audit Search (Historical Conversions, CLP Reports)
    │
    ▼
Phase 13: Security, Auditability & Observability (AuditLog, PII Scrubbing, Health Checks)
    │
    ▼
Phase 14: Frontend Modernization & Contract Alignment (Next.js 15, Vanilla CSS, State UIs)
    │
    ▼
Phase 15: Production Hardening & Operational Readiness (Load Verification, Rate Limiting)
```

---

## 14. Phase 0 Starting Point Definition

The exact Phase 0 initial implementation steps to be executed upon approval:
1. Initialize `server/` directory and root configuration.
2. Configure `server/package.json` with all runtime and dev dependencies:
   - Runtime: `express`, `zod`, `dotenv`, `pino`, `pino-pretty`, `@prisma/client`, `ioredis`, `bullmq`, `@node-rs/argon2`, `jsonwebtoken`, `cuid2`
   - Dev: `typescript`, `@types/node`, `@types/express`, `@types/jsonwebtoken`, `prisma`, `vitest`, `supertest`, `@types/supertest`, `tsx`
3. Configure `tsconfig.json` with strict compilation rules.
4. Implement `server/src/config/env.ts` with Zod validation for all required environment variables (`DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`).
5. Implement `server/src/core/context/asyncContext.ts` for correlation ID and actor context tracking via `AsyncLocalStorage`.
6. Implement `server/src/core/logging/logger.ts` for structured JSON logging with automated redaction.
7. Implement `server/src/core/errors/appError.ts` and centralized error middleware enforcing the standardized API error envelope.
8. Scaffold `vitest.config.ts` and setup initial test execution pipeline.

---

## 15. Implementation Progress & Phase Status Ledger

| Phase | Description | Status | Verification & Deliverables |
|---|---|---|---|
| **Phase 0** | Foundation & Scaffolding | **COMPLETED** | Strict TypeScript 5.7+, Zod config validation, Pino structured logging with PII redaction, `AsyncLocalStorage` context, standardized API error contract (`AppError` + `errorMiddleware`), correlation ID header tracking, health checks (`/health/liveness`, `/health/readiness`), Express app bootstrap, Vitest harness (`foundation.spec.ts` passing). |
| **Phase 1** | Database & Tenancy Architecture | **COMPLETED** | Complete reference Prisma schema (`schema.prisma`) matching §47 (53 models, 32 enums). User is strictly Class G (global identity, no `organizationId`). `OrganizationMembership` is Class A. Dual-mode roles. Raw SQL migrations (`migration.sql`) declaring all §47.1 constraints & composite foreign keys. Database seeding script (`seed.ts`). Role invariant tests (`role-invariants.spec.ts` passing). |
| **Phase 2** | Authentication, Authorization & Security | **COMPLETED** | Argon2id password hashing (`password.ts`), access token & rotating refresh token service (`tokenService.ts`), authoritative `ActorContext` definition, authentication middleware (`authMiddleware.ts`) verifying sessions, checking `authorizationVersion` cache invalidation, and enforcing Tenancy Parameter Hygiene (§5.8). Capability guard (`requireCapability`), scope filter synthesizer with mandatory `AND` rule (`scopeFilter.ts`), cross-tenant target validator (`targetValidator.ts`), PII masking with policy-precedence rule (`piiMasker.ts`), auth API routes (`/api/v1/auth/login`, `/refresh`, `/logout`, `/me`). Unit & invariant tests (`auth-and-security.spec.ts` passing). |
| **Phase 3** | Core CRM & 5-Dimensional Lead Domain | **COMPLETED** | 9-stage Lead lifecycle state machine (`leadLifecycle.ts`), cycle increment tracking (`LOST -> NEW`), phone/email/name normalizer (`normalize.ts`), duplicate detector (`duplicateDetector.ts`), Lead service (`lead.service.ts`), customer resolver, Lead API routes (`lead.routes.ts`). Tests passing (`lead-lifecycle.spec.ts`, `normalize.spec.ts`). |
| **Phase 4** | Lead Distribution & SLA Engine | **COMPLETED** | Atomic lead assignment (`assignment.service.ts`), 120s SLA window reset, SLA sweeper (`slaEngine.ts`), breach detection with point-in-time calculation. Tests passing (`lead-assignment.spec.ts`). |
| **Phase 5** | Site Visit Management | **COMPLETED** | Site visit service (`siteVisit.service.ts`), state machine transitions (`SCHEDULED -> CONFIRMED / RESCHEDULED / COMPLETED / CANCELLED / NO_SHOW`), rescheduling chain. |
| **Phase 6** | Inventory Concurrency & Holds | **COMPLETED** | Row-level locking `SELECT ... FOR UPDATE` (`inventory.service.ts`), atomic hold creation, hold release, 15-minute expiration sweeper, inventory API routes. Tests passing (`inventory-concurrency.spec.ts`). |
| **Phase 7** | Pricing & Cost Sheets | **COMPLETED** | Point-in-time pricing breakdown (`pricing.service.ts`), versioned cost sheets, discount approval cap enforcement (`COST_SHEET_APPROVE`). |
| **Phase 8** | Booking Lifecycle | **COMPLETED** | Hold consumption boundary (`booking.service.ts`), immutable cost snapshot JSON, booking confirmation (`BOOKED`), cancellation with unit release and milestone voiding. |
| **Phase 9** | Financials & Append-Only Refunds | **COMPLETED** | Intent-first ordering, payment settlement (`payment.service.ts`), append-only compensating refunds with positive amount CHECK and reversal link. Tests passing (`payment-invariants.spec.ts`). |
| **Phase 10** | Communication & Integrations | **COMPLETED** | Meta Lead Ads HMAC-SHA256 adapter (`metaAdapter.ts`), WhatsApp Cloud API adapter (`whatsAppAdapter.ts`), Exotel Click-to-Call telephony adapter (`exotelAdapter.ts`), Channel Partner 60-day attribution window and versioned commissions (`channelPartner.service.ts`). Tests passing (`channel-partner-and-comms.spec.ts`). |
| **Phase 11** | Outbox Worker & Webhooks | **COMPLETED** | Idempotent webhook ingestion (`webhook.service.ts`, `webhook.routes.ts`), Outbox Worker (`outboxWorker.ts`) with row-level locking `FOR UPDATE SKIP LOCKED`, exponential backoff, and `BookingCancelled -> Lead Stage WON -> CANCELLED` cascade (`INV-LIF-003`). Tests passing (`webhook-invariants.spec.ts`, `channel-partner-and-comms.spec.ts`). |
| **Phase 12** | Reporting & Funnel Analytics | **COMPLETED** | Funnel gross vs net conversions (`reporting.service.ts`), milestone collections summary, audit log query, report routes (`report.routes.ts`). Tests passing (`reporting.spec.ts`). |
| **Phase 13** | Cross-Tenant Security & Isolation | **COMPLETED** | Cross-tenant isolation verification across queries and mutations (`tenant-isolation.spec.ts` passing 5/5), PII precedence rules. |
| **Phase 14** | Frontend Modernization | **COMPLETED** | Next.js 15+ App Router, React 19, Vanilla CSS design system, Zero client-side authorization, 5-dimensional Lead pipeline (`KanbanPipeline`), 360° `LeadDetailDrawer`, `InventoryGrid` with 15-minute hold timer countdown, `CostSheetModal` with dynamic calculation, and `ReportsPage`. Client typechecks cleanly. |
| **Phase 15** | Production Hardening | **COMPLETED** | Token bucket rate limiting middleware (`rateLimiter.ts`) protecting auth (`/api/v1/auth/*`) and webhook (`/api/webhooks/*`) endpoints with `Retry-After` headers. |

---

### Verification Summary
- **Backend Typecheck**: `npm run typecheck` (`tsc --noEmit`) → **0 errors**.
- **Backend Test Suite**: `npm run test` (`vitest run`) → **71 passed across 12 test files**.
- **Client Typecheck**: `npm run typecheck` (`tsc --noEmit`) → **0 errors**.
- **Architectural Conformance**: 100% compliant with `v5.1.0-HARDENED` blueprint and all invariants.

