# Ralix CRM — Transaction Boundary Matrix
**Target Architecture**: `v5.1.0-HARDENED`  
**Governing Section**: §35 (Transaction Boundaries) & §36 (Concurrency Architecture)  

---

## 1. Architectural Invariant Rules for Mutations

Every state-mutating command in Ralix CRM must execute through a single, strictly ordered pipeline:

```text
1. Actor Authorization (Capability + Scope)
   ↓
2. Target Validation (Tenant cross-reference check)
   ↓
3. Business Preconditions (State machine legality, balance checks)
   ↓
4. Domain Mutation (Atomic SQL write)
   ↓
5. Historical Audit Record (Dedicated history table)
   ↓
6. Security Audit Log (Immutable AuditLog row)
   ↓
7. Transactional Outbox (OutboxEvent row from DomainEventType registry)
```

### Critical Concurrency & Isolation Invariants
1. **Zero External Calls Inside Domain Transactions**: Provider HTTP requests (Meta, WhatsApp, Payment Gateway, Telephony) or slow I/O (PDF generation) MUST NOT run inside a database transaction. External effects are driven exclusively via the Transactional Outbox (§35.2).
2. **Lock Acquisition Order**: Multi-row locks must be acquired in canonical topological order (`PropertyUnit` → `InventoryHold` → `Booking` → `Payment`) to prevent deadlocks.
3. **Pessimistic Locking**: Contended physical resources (`PropertyUnit`) require row-level `SELECT ... FOR UPDATE` (§14.3, §36.2).
4. **Optimistic Versioning**: Long-lived editing forms require checking `version` on update (§36.1).

---

## 2. Master Command Transaction Matrix

| Command | Transaction Scope | Database Lock / Concurrency | History Recorded | AuditLog Action | OutboxEvent Type | External Call Boundary |
|---|---|---|---|---|---|---|
| **Assign Lead** | Atomic DB Tx | `Lead` row lock (`FOR UPDATE`) | `LeadAssignment` (close previous via `releasedAt`, insert new) | `lead.assigned` | `LeadAssigned` | None (Async worker triggers notification via Outbox) |
| **Create Lead** | Atomic DB Tx | None (Unique check on normalized phone/email) | `LeadStageHistory` (initial stage = `NEW`, cycle = 1) | `lead.created` | `LeadCreated` | None (Async worker routes distribution via Outbox) |
| **Change Lead Stage** | Atomic DB Tx | `Lead` version check / row lock | `LeadStageHistory` (tracks `fromStage`, `toStage`, `cycle`, `reason`) | `lead.stage_changed` | `LeadStageChanged` | None |
| **Hold Unit** | Atomic DB Tx | `PropertyUnit` row lock (`SELECT ... FOR UPDATE`) | `InventoryHold` (insert `ACTIVE` row, partial unique index enforces exclusivity) | `inventory.unit_held` | `UnitHeld` | None |
| **Release Unit** | Atomic DB Tx | `PropertyUnit` + `InventoryHold` row lock | `InventoryHold` (`status` → `RELEASED`, `releasedAt` set) | `inventory.unit_released` | `UnitHoldReleased` | None |
| **Create Booking** | Atomic DB Tx | `PropertyUnit` row lock | `InventoryHold` (`status` → `CONSUMED`), `BookingStatusHistory` (initial `DRAFT`) | `booking.created` | `UnitBookingStarted` | None (PDF rendering & invoice generation queued via Outbox) |
| **Cancel Booking** | Atomic DB Tx | `Booking` + `PropertyUnit` row lock | `BookingStatusHistory` (`CANCELLED`), `PaymentMilestone` (`status` → `VOIDED`), `PropertyUnit` (`AVAILABLE`) | `booking.cancelled` | `BookingCancelled` | None (Async worker transitions `Lead` `WON` → `CANCELLED`, claws back commission) |
| **Record Payment** | Atomic DB Tx | `Booking` row lock (`FOR UPDATE`) | `Payment` (insert `PENDING`, reserve `idempotencyKey` locally before upstream call) | `payment.created` | `PaymentCreated` | Intent-first: DB tx commits BEFORE calling gateway |
| **Settle Payment** | Atomic DB Tx | `Payment` row lock | `Payment` (`SUCCEEDED`, `settledAt`), `PaymentMilestone` aggregate update | `payment.received` | `PaymentReceived` | Webhook receiver commits tx; sends receipt async |
| **Refund Payment** | Atomic DB Tx | Original `Payment` + `Booking` row lock | Original `Payment` (`REFUND_PENDING`), NEW compensating `Payment` (`reversalOfPaymentId`), milestone recalc | `payment.refunded` | `PaymentRefunded` | Provider refund invoked AFTER compensating row committed |
| **Confirm Duplicate** | Atomic DB Tx | Both `Lead` records locked | `DuplicateCandidate` (`CONFIRMED`), losing `Lead.status` → `DUPLICATE`, `LeadStatusHistory` on both | `lead.duplicate_confirmed` | `DuplicateResolved` | None |
| **Change Role Permissions** | Atomic DB Tx | `Role` row lock | `OrganizationMembership.authorizationVersion` incremented on all affected members | `role.permissions_changed` | `RolePermissionsChanged` | None (Tokens invalidated on next request via version check) |
| **Revoke Membership** | Atomic DB Tx | `OrganizationMembership` row lock | `OrganizationMembership` (`SUSPENDED`/`REMOVED`), `Session` (`revokedAt` = `NOW()`) | `membership.revoked` | `MembershipSuspended` | None |
| **Process Webhook** | Atomic DB Tx | `WebhookEvent` row lock (`provider`, `providerEventId`) | `WebhookEvent` (`status` → `PROCESSING` → `PROCESSED`) + target domain entity creation | `webhook.processed` | Domain-specific event (e.g., `LeadCreated`, `PaymentReceived`) | None (Synchronous 200 OK returned immediately upon ingestion) |

---

## 3. Detailed Command Transaction Specifications

### 3.1 Assign Lead
```text
BEGIN TRANSACTION;
  1. SELECT * FROM "Lead" WHERE id = $leadId AND organization_id = $orgId FOR UPDATE;
  2. Verify actor holds LEAD_ASSIGN capability within scope;
  3. Verify target assignee belongs to same organization (Target Validation);
  4. UPDATE "LeadAssignment" SET "releasedAt" = NOW() 
     WHERE "leadId" = $leadId AND "releasedAt" IS NULL;
  5. INSERT INTO "LeadAssignment" ("id", "organizationId", "leadId", "toUserId", "reason", "assignedAt")
     VALUES ($newId, $orgId, $leadId, $toUserId, $reason, NOW());
  6. UPDATE "Lead" SET 
       "assignedToId" = $toUserId, 
       "slaState" = 'WITHIN_SLA', 
       "slaDueAt" = NOW() + INTERVAL '120 seconds',
       "version" = "version" + 1 
     WHERE id = $leadId;
  7. INSERT INTO "AuditLog" (...);
  8. INSERT INTO "OutboxEvent" (eventType = 'LeadAssigned', ...);
COMMIT;
```

### 3.2 Hold Unit
```text
BEGIN TRANSACTION;
  1. SELECT * FROM "PropertyUnit" WHERE id = $unitId AND organization_id = $orgId FOR UPDATE;
  2. Assert "availability" = 'AVAILABLE';
  3. UPDATE "PropertyUnit" SET "availability" = 'ON_HOLD', "version" = "version" + 1 WHERE id = $unitId;
  4. INSERT INTO "InventoryHold" ("id", "organizationId", "unitId", "heldByUserId", "status", "expiresAt")
     VALUES ($holdId, $orgId, $unitId, $userId, 'ACTIVE', NOW() + INTERVAL '24 hours');
     -- Protected by raw SQL partial unique index:
     -- CREATE UNIQUE INDEX inventory_hold_one_active_per_unit ON "InventoryHold"("unitId") WHERE status = 'ACTIVE';
  5. INSERT INTO "AuditLog" (...);
  6. INSERT INTO "OutboxEvent" (eventType = 'UnitHeld', ...);
COMMIT;
```

### 3.3 Create Booking (Hold Consumption Boundary)
```text
BEGIN TRANSACTION;
  1. SELECT * FROM "PropertyUnit" WHERE id = $unitId AND organization_id = $orgId FOR UPDATE;
  2. Assert "availability" = 'ON_HOLD';
  3. UPDATE "InventoryHold" SET "status" = 'CONSUMED' 
     WHERE "unitId" = $unitId AND "status" = 'ACTIVE' AND "heldByUserId" = $userId;
  4. UPDATE "PropertyUnit" SET "availability" = 'BOOKING_IN_PROGRESS', "version" = "version" + 1 WHERE id = $unitId;
  5. INSERT INTO "Booking" ("id", "organizationId", "leadId", "customerId", "unitId", "costSheetId", "costSnapshot", "status")
     VALUES ($bookingId, $orgId, $leadId, $customerId, $unitId, $costSheetId, $snapshotJson, 'DRAFT');
  6. INSERT INTO "BookingStatusHistory" ("bookingId", "fromStatus", "toStatus") VALUES ($bookingId, NULL, 'DRAFT');
  7. INSERT INTO "AuditLog" (...);
  8. INSERT INTO "OutboxEvent" (eventType = 'UnitBookingStarted', ...);
COMMIT;
```

### 3.4 Refund Payment (Append-Only Compensating Invariant)
```text
BEGIN TRANSACTION;
  1. SELECT * FROM "Payment" WHERE id = $originalPaymentId AND organization_id = $orgId FOR UPDATE;
  2. Assert "status" = 'SUCCEEDED';
  3. Assert $refundAmount <= ("amount" - COALESCE((SELECT SUM(amount) FROM "Payment" WHERE "reversalOfPaymentId" = $originalPaymentId AND "status" != 'FAILED'), 0));
  4. UPDATE "Payment" SET "status" = 'REFUND_PENDING' WHERE id = $originalPaymentId;
  5. INSERT INTO "Payment" (
       "id", "organizationId", "bookingId", "milestoneId", "type", "amount", 
       "paymentMode", "status", "reversalOfPaymentId", "paidAt"
     ) VALUES (
       $refundPaymentId, $orgId, $bookingId, $milestoneId, 'REFUND', $refundAmount, 
       $mode, 'PENDING', $originalPaymentId, NOW()
     );
  6. INSERT INTO "AuditLog" (...);
  7. INSERT INTO "OutboxEvent" (eventType = 'PaymentRefunded', ...);
COMMIT;
```
