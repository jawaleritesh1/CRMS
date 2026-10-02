import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverDir = path.resolve(__dirname, '..');

const baseSql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
  cwd: serverDir,
  encoding: 'utf8',
});

const rawSql47 = `
-- ======================================================================
-- ARCHITECTURE §47.1 INVARIANTS REQUIRING RAW SQL
-- ======================================================================

-- Invariant #6: at most one active hold per unit (§14.3)
CREATE UNIQUE INDEX IF NOT EXISTS inventory_hold_one_active_per_unit
  ON "InventoryHold" ("unitId") WHERE status = 'ACTIVE';

-- One open assignment per lead (§11.1)
CREATE UNIQUE INDEX IF NOT EXISTS lead_assignment_one_open_per_lead
  ON "LeadAssignment" ("leadId") WHERE "releasedAt" IS NULL;

-- One active channel-partner attribution per customer (§18.1)
CREATE UNIQUE INDEX IF NOT EXISTS attribution_one_active_per_customer
  ON "LeadAttribution" ("organizationId", "customerId") WHERE status = 'ACTIVE';

-- Payment amounts are always positive; direction is expressed by type (§17.3)
ALTER TABLE "Payment" ADD CONSTRAINT payment_amount_positive CHECK (amount > 0);

-- System role global slug uniqueness & integrity checks (§7.8)
CREATE UNIQUE INDEX IF NOT EXISTS role_system_slug_unique
  ON "Role" (slug) WHERE "organizationId" IS NULL;

ALTER TABLE "Role" ADD CONSTRAINT role_system_null_org_check
  CHECK ("organizationId" IS NOT NULL OR ("isSystem" = TRUE AND "scope" = 'GLOBAL'));

ALTER TABLE "Role" ADD CONSTRAINT role_global_scope_check
  CHECK ("scope" != 'GLOBAL' OR ("organizationId" IS NULL AND "isSystem" = TRUE));

ALTER TABLE "Role" ADD CONSTRAINT role_system_scope_check
  CHECK ("isSystem" = FALSE OR "organizationId" IS NULL);

-- Session membership, user identity, and tenant boundary structural guarantee (§5.8, §6.3)
ALTER TABLE "Session" ADD CONSTRAINT session_membership_user_org_fk
  FOREIGN KEY ("membershipId", "userId", "organizationId")
  REFERENCES "OrganizationMembership" ("id", "userId", "organizationId")
  ON DELETE CASCADE;

-- Canonical LeadSource per external provider within an organization (§10.9)
CREATE UNIQUE INDEX IF NOT EXISTS lead_source_org_provider_unique
  ON "LeadSource" ("organizationId", "provider") WHERE "provider" IS NOT NULL;

-- Non-null external lead record deduplication (§10.9, §21.4)
CREATE UNIQUE INDEX IF NOT EXISTS lead_external_id_unique
  ON "Lead" ("organizationId", "sourceId", "externalLeadId") WHERE "externalLeadId" IS NOT NULL;

-- Composite foreign keys enforcing same-tenant references on Class A entities (§5.6)
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
`;

const fullMigration = baseSql + '\n' + rawSql47;
const migrationDir = path.join(serverDir, 'prisma', 'migrations', '20260928000000_init_hardened_schema');
fs.mkdirSync(migrationDir, { recursive: true });
fs.writeFileSync(path.join(migrationDir, 'migration.sql'), fullMigration);
console.log('Successfully written migration.sql of size:', fullMigration.length, 'bytes');
