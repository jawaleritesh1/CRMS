# Ralix CRM — Invariant Test Suite Specification
**Target Architecture**: `v5.1.0-HARDENED`  
**Target Test Directory**: `server/tests/invariants/`  
**Purpose**: Direct executable test definitions for the non-negotiable architectural invariants (§44, §38.2).

---

## 1. Tenant Isolation Invariant Suite (`tenant-isolation.spec.ts`)

### Objective
Ensure that cross-tenant data referencing is physically and logically impossible at both database constraint and application repository layers.

### Test Cases

#### INV-TEN-001: Cross-Tenant Lead Customer Association
- **Setup**: Create `Org_A`, `Customer_A` in `Org_A`, `Org_B`, `Customer_B` in `Org_B`.
- **Action**: Attempt to insert `Lead` with `organizationId = Org_A.id` and `customerId = Customer_B.id`.
- **Expected Outcome**: Transaction rejects with foreign key constraint violation (`lead_customer_same_tenant_fk`). Database mutation aborted.

#### INV-TEN-002: Cross-Tenant Booking Unit Association
- **Setup**: Create `Unit_B` in `Org_B`, `Lead_A` in `Org_A`.
- **Action**: Attempt to create `Booking` in `Org_A` referencing `unitId = Unit_B.id`.
- **Expected Outcome**: Foreign key constraint `booking_unit_same_tenant_fk` rejects mutation.

#### INV-TEN-003: Cross-Tenant Payment Booking Association
- **Setup**: Create `Booking_B` in `Org_B`.
- **Action**: Attempt to insert `Payment` with `organizationId = Org_A.id` and `bookingId = Booking_B.id`.
- **Expected Outcome**: Foreign key constraint `payment_booking_same_tenant_fk` fails.

#### INV-TEN-004: Cross-Tenant Session Membership Hijack
- **Setup**: `User_A` has membership in `Org_A`. `User_B` has membership in `Org_B`.
- **Action**: Attempt to create `Session` row with `userId = User_A.id`, `organizationId = Org_B.id`, `membershipId = Membership_B.id`.
- **Expected Outcome**: Composite foreign key `session_membership_user_org_fk` fails.

#### INV-TEN-005: Cross-Tenant Lead Assignment
- **Setup**: `Lead_A` in `Org_A`, `Membership_B` in `Org_B`.
- **Action**: Execute `assignLead(actorInOrgA, { leadId: Lead_A.id, toUserId: User_B.id })`.
- **Expected Outcome**: Target Validation throws `TenantScopeError` ("Target user does not belong to this organization"). No assignment row created.

#### INV-TEN-006: Cross-Tenant Team Project Association
- **Setup**: `Team_A` in `Org_A`, `Project_B` in `Org_B`.
- **Action**: Attempt to create `TeamProject` joining `Team_A.id` and `Project_B.id`.
- **Expected Outcome**: Transaction boundary rejects with cross-tenant domain violation.

---

## 2. Session Integrity Invariant Suite (`session-invariants.spec.ts`)

### Objective
Verify that user identity, tenant membership, and session claims remain structurally bound and cannot drift (§5.8, §6.3).

### Test Cases

#### INV-SES-001: Structural Triad Identity Constraint
- **Action**: Verify `Session` record constraint:
  `Session.userId == OrganizationMembership.userId`  
  `Session.organizationId == OrganizationMembership.organizationId`  
  `Session.membershipId == OrganizationMembership.id`
- **Assertion**: Any session creation where `(membershipId, userId, organizationId)` does not match an exact existing `OrganizationMembership` tuple is rejected by database foreign key.

#### INV-SES-002: Session Invalidation on Authorization Version Bump
- **Setup**: Active session with `authorizationVersion = 3`.
- **Action**: Modify user role permissions, incrementing `OrganizationMembership.authorizationVersion` to 4.
- **Request**: Client attempts authenticated request using cached access token with `authVer = 3`.
- **Expected Outcome**: Middleware checks `authorizationVersion`, detects mismatch, revokes access token immediately, and returns `401 UNAUTHORIZED` with `TOKEN_STALE`.

---

## 3. Dual-Mode Role Invariant Suite (`role-invariants.spec.ts`)

### Objective
Enforce the dual-mode role invariant (§6.1, §6.2) preventing privilege escalation and tenant pollution.

### Test Cases

#### INV-ROL-001: Tenant Role Structural Integrity
- **Action**: Attempt to insert `Role` with `organizationId = Org_A.id` and `isSystem = true`.
- **Expected Outcome**: CHECK constraint `role_system_scope_check` or `role_system_null_org_check` fails.
- **Assertion**: Tenant roles must strictly satisfy `organizationId IS NOT NULL AND isSystem = FALSE`.

#### INV-ROL-002: Platform System Role Integrity
- **Action**: Attempt to insert `Role` with `organizationId = NULL` and `scope = 'TEAM'`.
- **Expected Outcome**: CHECK constraint `role_global_scope_check` fails.
- **Assertion**: System roles must strictly satisfy `organizationId IS NULL AND isSystem = TRUE AND scope = 'GLOBAL'`.

#### INV-ROL-003: System Role Slug Uniqueness
- **Setup**: Create system role `platform_super_admin` (`organizationId = NULL, isSystem = true`).
- **Action**: Attempt to insert another system role with identical slug `platform_super_admin` (`organizationId = NULL, isSystem = true`).
- **Expected Outcome**: Partial unique index `role_system_slug_unique` rejects insert.

---

## 4. Inventory Concurrency Invariant Suite (`inventory-concurrency.spec.ts`)

### Objective
Verify that concurrent hold attempts on the same property unit guarantee exactly one winner and zero over-allocations (§14.3, §36.3).

### Test Cases

#### INV-INV-001: Simultaneous High-Concurrency Hold Race
- **Setup**: `PropertyUnit_1` with `availability = AVAILABLE`.
- **Action**: Spawn 20 concurrent async workers attempting to hold `PropertyUnit_1` simultaneously via `holdUnit()`.
- **Expected Outcome**:
  - Exactly 1 worker succeeds (HTTP 200 / hold created).
  - 19 workers fail with `409 CONFLICT` ("Unit is not available").
  - `SELECT COUNT(*) FROM "InventoryHold" WHERE "unitId" = PropertyUnit_1.id AND status = 'ACTIVE'` returns **exactly 1**.
  - `PropertyUnit_1.availability` is `ON_HOLD`.

#### INV-INV-002: Active Hold Exclusivity Index
- **Action**: Attempt direct raw SQL insert of two `InventoryHold` rows for same `unitId` with `status = 'ACTIVE'`.
- **Expected Outcome**: Raw SQL partial unique index `inventory_hold_one_active_per_unit` throws unique constraint violation on second insert.

---

## 5. Lead Assignment Invariant Suite (`lead-assignment.spec.ts`)

### Objective
Verify that every lead has at most one open assignment at any instant, and reassignments restart SLA tracking (§11.1, §11.6).

### Test Cases

#### INV-ASN-001: Single Open Assignment Structural Guarantee
- **Action**: Attempt direct SQL insert of two `LeadAssignment` rows for `Lead_1` with `releasedAt = NULL`.
- **Expected Outcome**: Partial unique index `lead_assignment_one_open_per_lead` rejects second row.

#### INV-ASN-002: Atomic Reassignment and SLA Reset
- **Setup**: `Lead_1` assigned to `Agent_A` with `slaState = BREACHED`, `slaBreachedAt = T0`.
- **Action**: Reassign `Lead_1` to `Agent_B`.
- **Expected Outcome**:
  - `LeadAssignment` for `Agent_A` updated with `releasedAt = NOW()`.
  - New `LeadAssignment` inserted for `Agent_B` with `releasedAt = NULL`.
  - `Lead.slaState` reset to `WITHIN_SLA`.
  - `Lead.slaDueAt` recomputed to new window (`NOW() + 120s`).
  - Historical `slaBreachedAt = T0` is **NOT cleared**.

---

## 6. Webhook Idempotency & Ingestion Invariant Suite (`webhook-invariants.spec.ts`)

### Objective
Ensure at-most-once processing for external provider webhook deliveries (§21.1, §25.1).

### Test Cases

#### INV-WHK-001: Concurrent Webhook Replay
- **Setup**: Webhook payload with `provider = 'META_LEAD_ADS'` and `providerEventId = 'meta_evt_999'`.
- **Action**: Send identical webhook payload 10 times concurrently to `/api/webhooks/meta`.
- **Expected Outcome**:
  - Exactly 1 `WebhookEvent` record created.
  - Exactly 1 `Lead` record created in target organization.
  - 9 duplicate requests return `200 OK` (idempotent receipt acknowledgement) without triggering downstream mutations.

---

## 7. External Lead Ingestion Deduplication Suite (`external-lead.spec.ts`)

### Objective
Prevent duplicate leads when external providers deliver retried lead records with different transport delivery IDs (§10.9).

### Test Cases

#### INV-EXT-001: Provider Lead ID Deduplication
- **Setup**: Ingest lead with `organizationId = Org_A.id`, `sourceId = Source_Meta.id`, `externalLeadId = 'leadgen_form_888'`.
- **Action**: Ingest subsequent lead payload with identical `(organizationId, sourceId, externalLeadId)`.
- **Expected Outcome**: Partial unique index `lead_external_id_unique` prevents duplicate insertion; ingestion logic links data to existing lead.

---

## 8. Financial Immutability & Append-Only Refund Suite (`payment-invariants.spec.ts`)

### Objective
Enforce the absolute immutability of settled payments and prevent in-place reversals (§17.3, §17.4).

### Test Cases

#### INV-PAY-001: Settled Payment State Immutability
- **Setup**: `Payment_1` with `status = 'SUCCEEDED'`, `amount = 500000.00`.
- **Action**: Attempt to execute `UPDATE "Payment" SET status = 'FAILED' WHERE id = Payment_1.id`.
- **Expected Outcome**: Database trigger / application repository rejects mutation. Settled payments can never transition backwards.

#### INV-PAY-002: Append-Only Compensating Refund
- **Setup**: Settled `Payment_1` (`amount = 100000.00`).
- **Action**: Execute `refundPayment(Payment_1.id, { amount: 40000.00, reason: "Customer request" })`.
- **Expected Outcome**:
  - `Payment_1.status` transitions to `REFUND_PENDING`.
  - A NEW `Payment` record is created: `type = 'REFUND'`, `amount = 40000.00`, `reversalOfPaymentId = Payment_1.id`.
  - Net received balance on `Booking` decreases by exactly `40000.00`.

#### INV-PAY-003: Over-Refund Prevention
- **Setup**: Settled `Payment_1` (`amount = 50000.00`). Existing refund of `30000.00`.
- **Action**: Attempt secondary refund of `25000.00` against `Payment_1`.
- **Expected Outcome**: Transaction rejects with `FinancialIntegrityError` ("Refund amount exceeds unrefunded settled balance of 20000.00").

---

## 9. Lead Lifecycle State Machine Suite (`lead-lifecycle.spec.ts`)

### Objective
Verify that illegal lifecycle transitions are rejected and terminal statuses are respected (§10.3).

### Test Cases

#### INV-LIF-001: Forbidden WON → LOST Transition
- **Setup**: `Lead_1` with `lifecycleStage = WON`.
- **Action**: Attempt transition `changeLeadStage(Lead_1.id, 'LOST')`.
- **Expected Outcome**: Rejection with `IllegalStateTransitionError` ("WON leads cannot transition to LOST. To cancel a converted lead, cancel its active booking").

#### INV-LIF-002: Terminal CANCELLED Stage Invariant
- **Setup**: `Lead_1` with `lifecycleStage = CANCELLED` (resulting from booking cancellation).
- **Action**: Attempt transition to `IN_PROGRESS` or `WON`.
- **Expected Outcome**: Rejection with `IllegalStateTransitionError` ("CANCELLED is a terminal post-conversion stage").

#### INV-LIF-003: Allowed LOST → NEW Re-Engagement Cycle
- **Setup**: `Lead_1` in `LOST` stage, `lifecycleCycle = 1`.
- **Action**: New customer inquiry arrives. Execute re-engagement transition to `NEW`.
- **Expected Outcome**:
  - Transition succeeds.
  - `Lead.lifecycleStage` becomes `NEW`.
  - `Lead.lifecycleCycle` increments to **2**.
  - `LeadStageHistory` records new entry with `cycle = 2`, `fromStage = 'LOST'`, `toStage = 'NEW'`.
  - Historical records for Cycle 1 remain intact in `LeadStageHistory`.

---

## 10. Authorization & Scope Invariant Suite (`authorization-invariants.spec.ts`)

### Objective
Ensure that capability, scope, target ownership, and tenant boundary are evaluated concurrently before permitting any mutation (§7.4, §7.5).

### Test Cases

#### INV-AUT-001: Capability Without Scope Rejection
- **Setup**: User has `LEAD_ASSIGN` capability with `Scope = INDIVIDUAL`.
- **Action**: User attempts to assign a lead belonging to another teammate in the same organization.
- **Expected Outcome**: Authorization engine throws `ForbiddenScopeError`.

#### INV-AUT-002: Target Validation Enforcement
- **Setup**: User has `SITE_VISIT_SCHEDULE` with `Scope = ORG`.
- **Action**: User attempts to schedule site visit for a `Lead` in their org, but inputs a `projectId` belonging to a competitor organization.
- **Expected Outcome**: Target Validator rejects mutation before writing to database.
