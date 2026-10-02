# Ralix CRM — Implementation Status Audit
**Target Architecture**: `v5.1.0-HARDENED`  
**Inspection Date**: 2026-09-28  
**Scope**: Full repository analysis (`server/`, `client/`, `prisma/`, configuration, tests)

---

## 1. Summary Matrix

| Domain / Subsystem | Status | Key Findings |
|---|---|---|
| Project Structure & Config | **PARTIAL** | Express + Next.js exist; missing test runner, linter/typecheck pipelines, Redis config |
| Tenancy & Identity Schema | **CONFLICT** | `User` holds `organizationId` directly (legacy single-org). `OrganizationMembership` missing. |
| Role & RBAC Schema | **CONFLICT** | Roles lack dual-mode isolation (`isSystem`, `organizationId NULL`), capability/scope missing |
| Lead Schema & Dimensions | **PARTIAL** | 4 of 5 dimensions present in Prisma; `LeadLifecycleStage` missing `CANCELLED`; `cycle` missing |
| Lead History & Auditing | **PARTIAL** | History models exist but lack atomic outbox and structured immutable audit event binding |
| Lead Distribution & SLA | **PARTIAL** | `LeadAssignment` exists; lacks partial unique index for single-open invariant, lacks failover engine |
| Site Visits | **PARTIAL** | `SiteVisit` model exists; missing state machine enforcement, rescheduling history, geofencing |
| Inventory & Holds | **PARTIAL** | `PropertyUnit` & `InventoryHold` exist; lacks raw SQL partial unique index, lock semantics, and hold consumption boundary |
| Pricing & Cost Sheets | **MISSING** | `PricingRuleSet`, `PricingRuleVersion`, approval workflow missing; only static `CostSheet` model |
| Bookings | **PARTIAL** | `Booking` model exists; missing state machine history, cancellation hold release atomic boundary |
| Payments & Refunds | **CONFLICT** | `Payment` has `status` but permits reversal in-place; lacks `reversalOfPaymentId` append-only refund invariant |
| Integrations & Adapters | **PARTIAL** | Basic webhook receiver and mock WhatsApp/call routes exist; provider-isolated adapters missing |
| Outbox & Queues | **MISSING** | No `OutboxEvent` table, no BullMQ, no worker daemon, no replay/dead-letter engine |
| Authentication & Sessions | **MISSING** | No credential hashing (Argon2id), no JWT/session store, no refresh rotation, no `authorizationVersion` |
| Authorization Middleware | **CONFLICT** | Controller reads `organizationId` from query/params; no `ActorContext`, no capability/scope resolver |
| Reporting & Search | **PARTIAL** | Static aggregations in `reports.routes.ts`; funnel does not query historical transitions |
| Invariant Test Suite | **MISSING** | No `tests/invariants/` directory, no Jest/Vitest setup in `server/package.json` |

---

## 2. Detailed Categorization

### EXISTING (Implemented and Compatible)
- **Core Runtime & Languages**: Node.js, TypeScript 5.7.3, Express 4.21.2, Next.js 15.5.0, React 19.
- **Normalization Utilities**: Phone, email, name normalization in `server/src/lib/normalize.ts` matches architectural data hygiene invariants.
- **Lead Multi-Dimensional Enum Shells**:
  - `LeadStatus` (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `COMMITTED`, `LOST`).
  - `LeadTemperature` (`HOT`, `WARM`, `COLD`).
  - `LeadDisposition` (`CONNECTED`, `BUSY`, `RINGING_NO_ANSWER`, `INVALID_NUMBER`, `WRONG_NUMBER`, `CALL_BACK_REQUESTED`, `DO_NOT_CALL`).
  - `LeadSLAState` (`WITHIN_SLA`, `BREACHED_RESPONSE`, `BREACHED_FOLLOWUP`, `BREACHED_SITE_VISIT`).
- **Core Domain Entities**: `Project`, `Tower`, `Floor`, `PropertyUnit`, `Customer`, `SiteVisit`, `Team`, `TeamMember`, `AuditLog`.
- **Frontend App Structure**: Rich UI pages in `client/app/` covering dashboard, pipeline, leads, projects, site visits, and reports.

---

### PARTIAL (Exists but Requires Modification)
- **`server/prisma/schema.prisma`**:
  - `LeadLifecycleStage` enum lacks `CANCELLED` (currently only `NEW`, `IN_PROGRESS`, `CONVERTED`, `LOST`).
  - `Lead` model lacks `lifecycleCycle` counter required for cycle tracking in `LOST → NEW` re-engagement.
  - `MilestoneStatus` enum lacks `VOIDED`.
  - `SiteVisit` lacks rescheduling tracking and explicit state machine enum.
  - `LeadAssignment` lacks tracking for SLA window restarts on reassignment.
  - `InventoryHold` missing explicit lock semantics and expiry worker indexing.
- **`server/src/services/leadLifecycle.service.ts`**:
  - Contains basic stage transition logic, but updates stage directly without atomic Transactional Outbox insertion.
  - Generates plain JSON string audit log entries rather than structured `AuditLog` domain entities.
- **`server/src/routes/reports.routes.ts`**:
  - Queries current lead stage state instead of querying `LeadStageHistory` point-in-time entries for funnel conversion analytics.
- **`server/package.json`**:
  - Lacks test framework (`vitest` or `jest`), Redis client (`ioredis`), queue system (`bullmq`), and password hasher (`argon2` or `@node-rs/argon2`).

---

### MISSING (Must Be Implemented)
- **Tenancy Boundary Table**: `OrganizationMembership` model linking `User` and `Organization` with membership status, roles, and invitation states.
- **Session & Identity Management**: `Session` model with `authorizationVersion`, device hash, token family, revoked timestamps.
- **Transactional Outbox Engine**: `OutboxEvent` model, outbox poller/worker, BullMQ integration, exponential backoff, DLQ, and replay mechanics.
- **Webhook Deduplication**: `(provider, providerEventId)` unique constraint and `WebhookEvent` lifecycle state machine (`PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`, `DEAD_LETTER`).
- **Pricing & Cost Snapshots**: `PricingRuleSet`, `PricingRuleVersion`, rule calculation engine, and immutable booking cost sheet snapshots.
- **Repositories**: True organization-scoped repositories deriving tenant isolation solely from `ActorContext`.
- **Authorization Engine**: Unified Capability + Scope evaluator (`UserContext`, `ActorContext`, `Capability`, `TargetValidator`).
- **Raw SQL Migration Scripts**: `server/prisma/migrations/` directory is completely empty. Database constraints must be formalized via SQL migrations.
- **Automated Test Suite**: Zero automated tests exist in `server/`. `tests/invariants/` is completely absent.

---

### CONFLICT (Contradicts Architecture v5.1.0-HARDENED)

1. **User Tenancy Model Conflict**:
   - *Existing*: `User` in `server/prisma/schema.prisma` has `organizationId String` and `roleId String` directly on the User model.
   - *Architecture (§5.1, §5.2)*: `User` is Class G (Global Identity). A user has NO direct `organizationId` foreign key. Tenancy is strictly realized through `OrganizationMembership` (Class T).
   - *Impact*: Cross-tenant membership, multi-organization access, and system-level administrative actors are impossible without removing `organizationId` from `User`.

2. **Controller-Supplied Tenancy Injection Conflict**:
   - *Existing*: `leads.routes.ts` and `orgGuard.ts` accept `organizationId` from `req.query`, `req.params`, or request body.
   - *Architecture (§5.8)*: *"Any endpoint that accepts organizationId as request input is a defect."* Tenancy scope must be derived exclusively from the authenticated `ActorContext`.

3. **Role Tenancy & System Scoping Conflict**:
   - *Existing*: `Role` has a mandatory foreign key `organizationId String`.
   - *Architecture (§6.1, §6.2)*: `Role` must support dual-mode tenancy: System roles have `organizationId = NULL`, `isSystem = true`, and `scope = GLOBAL`. Tenant roles have `organizationId != NULL` and `isSystem = false`.

4. **Payment Reversal Conflict**:
   - *Existing*: `Payment` has a generic `status` that can be updated in-place to refunded/failed.
   - *Architecture (§36, §37)*: Settled payments are immutable. Refunds must be append-only compensating `Payment` records linked via `reversalOfPaymentId`, maintaining financial history integrity.

5. **Webhook Deduplication Key Conflict**:
   - *Existing*: `WebhookEvent` has `eventId @unique` as a single column.
   - *Architecture (§39.2)*: Webhook deduplication key must be `(provider, providerEventId)`. Single-column `eventId` creates cross-provider collisions and prevents identical provider event IDs across distinct upstream vendors.
