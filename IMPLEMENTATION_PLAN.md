# Ralix CRM — Implementation Roadmap
**Target Architecture**: `v5.1.0-HARDENED`  
**Status**: Authoritative Phased Execution Plan  

---

## Overview

The Ralix CRM architecture is frozen at **v5.1.0-HARDENED**. Implementation follows strict dependency ordering where data model guarantees, tenancy boundaries, and transactional guarantees precede application features and UI screens.

---

## Phase 0 — Foundation & Infrastructure Scaffolding

### Goals
Establish core project layout, environment configuration validation, logging, correlation tracking, error handling contracts, and testing harness.

### Key Deliverables
- **Environment & Config**:
  - Zod-validated environment schema (`DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`).
  - Configuration failure aborts server boot with explicit missing/invalid variable reporting.
- **Observability Primitives**:
  - Structured JSON logger (Pino or Winston) with automatic `correlationId` and `tenantId` injection.
  - Correlation ID middleware (`X-Correlation-ID`) propagating across async execution contexts (`AsyncLocalStorage`).
  - Standardized API Error contract: `{ success: false, error: { code, message, target, details, correlationId } }`.
- **Database Engine Setup**:
  - Prisma client singleton with connection pooling tuned for Neon PostgreSQL.
  - Raw SQL migration directory scaffolding (`server/prisma/migrations/`).
- **Testing Harness**:
  - Vitest / Jest setup with database migration lifecycle hooks for invariant verification.

---

## Phase 1 — Database & Tenancy Architecture

### Goals
Implement the physical data schema and raw SQL constraints enforcing Class G / Class T / Class E domain separation and the tenancy matrix (§5.6).

### Key Deliverables
- **Core Identity Models**:
  - `User`: Global identity (Class G) without `organizationId`.
  - `Organization`: Global organization tenant entity.
  - `OrganizationMembership`: Tenancy boundary (Class T) with composite unique `@@unique([userId, organizationId])`.
  - `Role` & `Permission` & `RolePermission`: Dual-mode roles (`isSystem=true, organizationId=null` vs `isSystem=false, organizationId!=null`).
  - `Session`: Class T/G session model carrying `userId`, `organizationId`, `membershipId`, and `authorizationVersion`.
- **Raw SQL Migration Constraints (§47.1)**:
  - Role CHECK constraint: `(is_system = true AND organization_id IS NULL AND scope = 'GLOBAL') OR (is_system = false AND organization_id IS NOT NULL)`.
  - System role unique slug index: `CREATE UNIQUE INDEX uq_system_role_slug ON "Role"(slug) WHERE is_system = true;`.
  - Tenant role unique slug index: `CREATE UNIQUE INDEX uq_tenant_role_slug ON "Role"(organization_id, slug) WHERE is_system = false;`.
  - OrganizationMembership foreign key and status checks.
- **Tenancy Matrix Verification**:
  - Verification that Class T models require composite foreign keys `(id, organizationId)` where referenced across tenant boundaries.

---

## Phase 2 — Authentication, Authorization & Actor Context

### Goals
Implement secure credential verification, token lifecycle, session revocation, and capability/scope resolution without controller-level authorization logic.

### Key Deliverables
- **Authentication Subsystem**:
  - Password hashing via Argon2id (parameters aligned to architectural baseline).
  - Login endpoint issuing access token (JWT) and rotating refresh token family.
  - Session revocation API and session state checks.
- **Actor Context Resolution Pipeline**:
  - Middleware extracting JWT, loading `Session`, checking `revokedAt` and `authorizationVersion`.
  - Construction of immutable `ActorContext`:
    ```ts
    interface ActorContext {
      userId: string;
      organizationId: string;
      membershipId: string;
      capabilities: Set<string>;
      scope: AuthorizationScope; // GLOBAL, ORG, TEAM, INDIVIDUAL
      teamIds: string[];
      isSystemActor: boolean;
      correlationId: string;
    }
    ```
- **Capability & Scope Middleware Guard**:
  - Declarative capability evaluator: `requireCapability(Capability.LEAD_READ, TargetType.LEAD)`.
  - Scope resolver enforcing `INDIVIDUAL` (own assigned), `TEAM` (user's teams), `ORG` (entire tenant).
  - Automatic tenant parameter stripping from `req.query`, `req.body`, and `req.params`.
- **PII Protection Filter**:
  - Phone and email masking utility for read projections based on `ActorContext` capabilities.

---

## Phase 3 — Core CRM & Five-Dimensional Lead Domain

### Goals
Implement customer, team, project relationships, and the 5 independent Lead dimensions without collapsing states.

### Key Deliverables
- **Customer & Organization Relationships**:
  - `Customer` model scoped by `(id, organizationId)`.
  - Phone/email normalization on ingestion via `server/src/lib/normalize.ts`.
- **Five Lead Dimensions Implementation**:
  1. `LeadLifecycleStage`: `NEW`, `IN_PROGRESS`, `CONVERTED`, `LOST`, `CANCELLED`.
  2. `LeadStatus`: Operational sub-status (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `NEGOTIATION`, `COMMITTED`, `LOST`).
  3. `LeadTemperature`: `HOT`, `WARM`, `COLD`.
  4. `LeadDisposition`: `CONNECTED`, `BUSY`, `RINGING_NO_ANSWER`, `INVALID_NUMBER`, `WRONG_NUMBER`, `CALL_BACK_REQUESTED`, `DO_NOT_CALL`.
  5. `LeadScore`: Integer score (0–100) reflecting engagement.
- **Cycle & History Tracking**:
  - `lifecycleCycle` counter on `Lead` incremented when transitioning `LOST → NEW`.
  - Dedicated history models: `LeadStageHistory`, `LeadStatusHistory`, `LeadTemperatureHistory`, `LeadScoreHistory`, `LeadDispositionHistory`.
- **Project & Team Scope Mappings**:
  - `Team`, `TeamMember`, `Project`, `TeamProject`, `UserProject`.
- **Duplicate Detection**:
  - `DuplicateCandidate` detection engine matching normalized phone and email.

---

## Phase 4 — Lead Distribution, Assignment & SLA Engine

### Goals
Enforce single-open assignment invariant, failover routing, and SLA measurement per assignment window.

### Key Deliverables
- **Assignment Engine**:
  - `LeadAssignment` model with raw SQL partial unique index:
    `CREATE UNIQUE INDEX uq_open_lead_assignment ON "LeadAssignment"(lead_id) WHERE is_active = true;`.
  - Atomic reassignment transaction: close previous assignment (`isActive=false`, `endedAt=NOW()`) and insert new open assignment.
- **SLA Window Management**:
  - Every assignment creates a distinct SLA timer window.
  - Failover queue for offline/unresponsive CSEs with configurable breach escalation.
  - Background cron/worker updating `LeadSLAState` (`WITHIN_SLA`, `BREACHED_RESPONSE`, `BREACHED_FOLLOWUP`, `BREACHED_SITE_VISIT`).

---

## Phase 5 — Site Visit Management & Geofencing

### Goals
Implement site visit scheduling, state transitions, rescheduling audit trail, and verification.

### Key Deliverables
- **Site Visit State Machine**:
  - States: `SCHEDULED`, `RESCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
  - Allowed transitions and precondition validations.
- **Rescheduling & History**:
  - Atomic tracking of previous schedule times, reasons, and requesting party.
- **Completion Verification**:
  - Geofence coordinate verification or direct OTP confirmation on completion.

---

## Phase 6 — Inventory Management & Concurrency Control

### Goals
Implement high-concurrency unit holds and releases with guaranteed elimination of read-then-write race conditions.

### Key Deliverables
- **Inventory Domain Model**:
  - `Project`, `Tower`, `Floor`, `PropertyUnit`, `InventoryHold`.
  - Unit statuses: `AVAILABLE`, `HOLD`, `BOOKED`, `BLOCKED`, `SOLD`.
- **Concurrency & Locking Invariants (§34)**:
  - Database row locking (`SELECT * FROM "PropertyUnit" WHERE id = $1 FOR UPDATE`).
  - Active hold partial unique index:
    `CREATE UNIQUE INDEX uq_active_unit_hold ON "InventoryHold"(unit_id) WHERE status = 'ACTIVE';`.
  - Atomic Hold Creation:
    ```sql
    -- Atomic hold boundary
    BEGIN;
    SELECT * FROM "PropertyUnit" WHERE id = $1 AND organization_id = $2 FOR UPDATE;
    -- Verify status is AVAILABLE
    UPDATE "PropertyUnit" SET status = 'HOLD' WHERE id = $1;
    INSERT INTO "InventoryHold" (id, organization_id, unit_id, membership_id, expires_at, status) VALUES (...);
    INSERT INTO "AuditLog" (...);
    INSERT INTO "OutboxEvent" (...);
    COMMIT;
    ```
- **Hold Expiration Daemon**:
  - Periodic worker sweeping expired `ACTIVE` holds, atomically resetting unit to `AVAILABLE`, and logging release history.

---

## Phase 7 — Pricing Rules, Versions & Cost Sheets

### Goals
Deliver dynamic pricing calculation with immutable historical snapshots and discount approval workflows.

### Key Deliverables
- **Pricing Rule Engine**:
  - `PricingRuleSet` and `PricingRuleVersion` (immutable versioning).
  - Base price per sq.ft, floor rise charges, preferred location charges (PLC), parking charges, GST, and stamp duty calculation.
- **CostSheet Generation**:
  - Point-in-time calculation generating immutable breakdown.
- **Discount & Approval Workflow**:
  - Pricing adjustments above defined member thresholds trigger `DiscountApprovalRequest` requiring Manager/Admin capability.
  - CostSheet remains un-bookable until approvals are granted.

---

## Phase 8 — Booking Lifecycle & Hold Consumption

### Goals
Execute the critical booking transaction boundary (§35), transitioning inventory holds to confirmed bookings.

### Key Deliverables
- **Booking Creation Transaction**:
  - Atomic transition: active `InventoryHold` consumed -> unit status becomes `BOOKED` -> `Booking` created -> `BookingStatusHistory` recorded -> `OutboxEvent` queued.
- **Booking State Machine**:
  - States: `DRAFT`, `SUBMITTED`, `VERIFIED`, `CONFIRMED`, `CANCELLED`.
- **Cancellation & Release Boundary**:
  - Cancellation reverts unit from `BOOKED` to `AVAILABLE` (or blocks for inspection), voiding uncollected payment milestones.

---

## Phase 9 — Payments, Milestones & Append-Only Refunds

### Goals
Maintain absolute financial integrity: intent-first ordering, immutable settled payments, and append-only compensating refunds.

### Key Deliverables
- **Payment Domain Model**:
  - `Payment`, `PaymentMilestone`, `PaymentMethod`.
  - Payment states: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`.
- **Append-Only Refund Invariant (§36, §37)**:
  - Settled `SUCCESS` payment records are strictly immutable.
  - A refund creates a NEW compensating `Payment` record with negative or compensating amount, linked via `reversalOfPaymentId`.
  - Invariant constraint: `SUM(refunds) <= originalPayment.amount`.
- **Payment Reconciliation**:
  - Payment webhook receiver verifying payment signatures and updating milestones atomically.

---

## Phase 10 — Communication & External Integrations

### Goals
Integrate external platforms (Meta, WhatsApp, telephony, email, SMS) through decoupled provider adapters.

### Key Deliverables
- **Integration Boundary Architecture**:
  - Strict isolation: no provider-specific payloads or SDK calls inside core domain services.
  - Dedicated adapters: `MetaLeadAdapter`, `WhatsAppCloudAdapter`, `ExotelTelephonyAdapter`, `SendGridEmailAdapter`.
- **Normalizers & Data Sanitation**:
  - All incoming webhooks converted to domain-standard command DTOs.

---

## Phase 11 — Webhooks, Transactional Outbox & Background Queues

### Goals
Guarantee at-least-once outbox processing, duplicate-safe webhook ingestion, and resilient asynchronous execution.

### Key Deliverables
- **Webhook Ingestion Pipeline (§39)**:
  - Deduplication via `(provider, providerEventId)` unique constraint.
  - Raw payload stored in `WebhookEvent` with state `PENDING`.
  - Immediate synchronous `200 OK` return; async worker processes event.
- **Transactional Outbox Engine**:
  - `OutboxEvent` table (`id`, `aggregateType`, `aggregateId`, `eventType`, `payload`, `status`, `retryCount`).
  - Worker using BullMQ or row-locking polling (`FOR UPDATE SKIP LOCKED`).
  - Event dispatch to Redis Pub/Sub, Kafka, or internal subscribers.
- **Resilience & DLQ**:
  - Exponential backoff with jitter.
  - Dead-letter queue (DLQ) after 5 failed retries; administrative replay API.

---

## Phase 12 — Reporting, Funnel Analytics & Audit Search

### Goals
Provide operational, analytical, and financial reports querying point-in-time historical records.

### Key Deliverables
- **Historical Funnel Conversion**:
  - Queries `LeadStageHistory` and `LeadStatusHistory` across time intervals.
  - Multi-cycle reporting separating Cycle 1 conversions from Re-engaged Cycle 2+ conversions.
- **Financial & Unit Reports**:
  - Collections, outstanding milestones, refund totals, inventory velocity.
- **Audit Trail Search**:
  - Filterable audit logs by actor, organization, date range, entity type, and operation.

---

## Phase 13 — Security, Auditability & Observability

### Goals
Enforce zero-trust multi-tenancy audit compliance, PII protection, metrics, and health diagnostics.

### Key Deliverables
- **Audit Logging Subsystem**:
  - Immutable `AuditLog` records containing `actorId`, `organizationId`, `action`, `entityType`, `entityId`, `beforeState`, `afterState`, `ipAddress`, `userAgent`.
- **PII Scrubbing & Data Protection**:
  - Automatic redaction of sensitive credentials and unmasked numbers in application logs.
- **Health & Readiness Endpoints**:
  - Deep health check: PostgreSQL connection, Redis availability, queue worker heartbeats.

---

## Phase 14 — Frontend Modernization & Contract Alignment

### Goals
Align Next.js frontend pages with strict backend capability schemas and remove client-side authorization assumptions.

### Key Deliverables
- **Session & Identity Handling**:
  - Token refresh management in Axios/Fetch interceptors; handling forced re-login on `authorizationVersion` changes.
  - Multi-organization membership switcher UI.
- **Domain Screen Refactoring**:
  - Lead view reflecting 5 independent dimensions.
  - Inventory grid with real-time hold countdown and lock indicators.
  - Booking & Cost Sheet builder displaying breakdown and approval banners.
  - Payment and refund ledger with compensating refund visualization.

---

## Phase 15 — Production Hardening & Operational Readiness

### Goals
Prepare for production deployment with load verification, rate limiting, and failure testing.

### Key Deliverables
- **Rate Limiting & Throttling**:
  - Redis-backed rate limiter on public routes (auth, webhooks).
- **Pagination Contracts**:
  - Cursor-based pagination on high-volume feeds (`AuditLog`, `LeadHistory`, `WebhookEvent`).
- **Backup & Disaster Recovery**:
  - Point-in-time recovery verification on Neon PostgreSQL.
- **End-to-End Stress & Invariant Verification**:
  - Chaos test suite: concurrent holds, duplicate webhooks, network drops during payment callbacks.
