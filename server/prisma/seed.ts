import { PrismaClient, ScopeType, MembershipStatus } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

// RFC 9106 Argon2id parameters (DEC-003 baseline)
const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  outputLen: 32,
  parallelism: 4,
};

export const SYSTEM_PERMISSIONS = [
  // Lead capabilities
  { key: 'LEAD_VIEW', resource: 'LEAD', action: 'VIEW', description: 'View leads within authorized scope' },
  { key: 'LEAD_CREATE', resource: 'LEAD', action: 'CREATE', description: 'Create new leads' },
  { key: 'LEAD_UPDATE', resource: 'LEAD', action: 'UPDATE', description: 'Update lead details' },
  { key: 'LEAD_ASSIGN', resource: 'LEAD', action: 'ASSIGN', description: 'Assign or reassign leads' },
  { key: 'LEAD_EXPORT', resource: 'LEAD', action: 'EXPORT', description: 'Export lead data to CSV/Excel' },
  { key: 'FOLLOWUP_CREATE', resource: 'FOLLOWUP', action: 'CREATE', description: 'Schedule callback or follow-up' },
  { key: 'FOLLOWUP_MANAGE', resource: 'FOLLOWUP', action: 'MANAGE', description: 'Manage scheduled follow-ups' },

  // Customer & PII capabilities
  { key: 'CUSTOMER_VIEW', resource: 'CUSTOMER', action: 'VIEW', description: 'View customer profile (masked)' },
  { key: 'CUSTOMER_CREATE', resource: 'CUSTOMER', action: 'CREATE', description: 'Create customer record' },
  { key: 'CUSTOMER_UPDATE', resource: 'CUSTOMER', action: 'UPDATE', description: 'Update customer details' },
  { key: 'CUSTOMER_VIEW_UNMASKED', resource: 'CUSTOMER', action: 'VIEW_UNMASKED', description: 'View unmasked customer phone and email' },

  // Site visits
  { key: 'SITE_VISIT_SCHEDULE', resource: 'SITE_VISIT', action: 'SCHEDULE', description: 'Schedule site visit' },
  { key: 'SITE_VISIT_COMPLETE', resource: 'SITE_VISIT', action: 'COMPLETE', description: 'Complete site visit with feedback' },
  { key: 'SITE_VISIT_CANCEL', resource: 'SITE_VISIT', action: 'CANCEL', description: 'Cancel scheduled site visit' },

  // Inventory & Pricing
  { key: 'UNIT_VIEW', resource: 'UNIT', action: 'VIEW', description: 'View inventory units and availability' },
  { key: 'UNIT_HOLD', resource: 'UNIT', action: 'HOLD', description: 'Place hold on property unit' },
  { key: 'UNIT_RELEASE', resource: 'UNIT', action: 'RELEASE', description: 'Release inventory hold' },
  { key: 'UNIT_BLOCK', resource: 'UNIT', action: 'BLOCK', description: 'Block unit for maintenance/management' },
  { key: 'COST_SHEET_CREATE', resource: 'COST_SHEET', action: 'CREATE', description: 'Generate cost sheet calculation' },
  { key: 'COST_SHEET_APPROVE', resource: 'COST_SHEET', action: 'APPROVE', description: 'Approve custom discounts on cost sheets' },

  // Booking & Financials
  { key: 'BOOKING_CREATE', resource: 'BOOKING', action: 'CREATE', description: 'Create draft booking from active hold' },
  { key: 'BOOKING_CONFIRM', resource: 'BOOKING', action: 'CONFIRM', description: 'Confirm verified booking' },
  { key: 'BOOKING_CANCEL', resource: 'BOOKING', action: 'CANCEL', description: 'Cancel booking and trigger release' },
  { key: 'PAYMENT_RECORD', resource: 'PAYMENT', action: 'RECORD', description: 'Record payment intention' },
  { key: 'PAYMENT_RECONCILE', resource: 'PAYMENT', action: 'RECONCILE', description: 'Reconcile gateway settlement' },
  { key: 'PAYMENT_REFUND', resource: 'PAYMENT', action: 'REFUND', description: 'Authorize append-only compensating refund' },

  // Partners & Attribution
  { key: 'ATTRIBUTION_MANAGE', resource: 'ATTRIBUTION', action: 'MANAGE', description: 'Manage channel partner attributions' },
  { key: 'COMMISSION_APPROVE', resource: 'COMMISSION', action: 'APPROVE', description: 'Approve brokerage commission payout' },

  // Administration & Audit
  { key: 'REPORT_VIEW', resource: 'REPORT', action: 'VIEW', description: 'View operational and financial reports' },
  { key: 'REPORT_EXPORT', resource: 'REPORT', action: 'EXPORT', description: 'Export analytical reports' },
  { key: 'ROLE_MANAGE', resource: 'ROLE', action: 'MANAGE', description: 'Create and modify tenant roles' },
  { key: 'MEMBER_MANAGE', resource: 'MEMBER', action: 'MANAGE', description: 'Invite and manage organization memberships' },
  { key: 'ORGANIZATION_MANAGE', resource: 'ORGANIZATION', action: 'MANAGE', description: 'Manage organization settings and policies' },
  { key: 'AUDIT_VIEW', resource: 'AUDIT', action: 'VIEW', description: 'Search and inspect immutable audit trail' },
];

export async function seed() {
  console.log('🌱 Starting Ralix CRM Database Seed...');

  // 1. Seed Global Capabilities Catalogue (Class G)
  console.log('Seeding Permissions Catalogue...');
  const permissionMap = new Map<string, string>();
  for (const perm of SYSTEM_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
    permissionMap.set(perm.key, record.id);
  }

  // 2. Seed Platform System Role (Dual-Mode: isSystem = true, organizationId = null, scope = GLOBAL)
  console.log('Seeding Platform System Super Admin Role...');
  let superAdminRole = await prisma.role.findFirst({
    where: { isSystem: true, organizationId: null, slug: 'platform_super_admin' },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'Platform Super Administrator',
        slug: 'platform_super_admin',
        description: 'Global system administrator across all tenants (break-glass role)',
        scope: ScopeType.GLOBAL,
        isSystem: true,
        organizationId: null,
      },
    });
  }

  // Attach all permissions to System Super Admin
  for (const permId of permissionMap.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permId,
      },
    });
  }

  // 3. Seed Default Tenant (Acme Real Estate Developers)
  console.log('Seeding Default Organization...');
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-realty' },
    update: {},
    create: {
      name: 'Acme Real Estate Developers',
      slug: 'acme-realty',
      phone: '+91 22 1234 5678',
      email: 'contact@acmerealty.com',
      city: 'Mumbai',
      reraNumber: 'MAHARERA-REG-12345678',
      settings: {
        create: {
          slaEscalationSeconds: 120,
          slaDueSoonSeconds: 90,
          maskCustomerPhoneForCSE: true,
          unitHoldMaxHours: 24,
          defaultGstPercent: 5.0,
          defaultStampDutyPercent: 6.0,
          cpAttributionWindowDays: 60,
        },
      },
    },
  });

  // 4. Seed Tenant Roles for Acme Realty
  console.log('Seeding Tenant Roles for Acme Realty...');
  const tenantRoles = [
    {
      name: 'Organization Administrator',
      slug: 'org_admin',
      scope: ScopeType.ORGANIZATION,
      permissions: Array.from(permissionMap.keys()), // all tenant capabilities
    },
    {
      name: 'Sales Manager',
      slug: 'sales_manager',
      scope: ScopeType.TEAM,
      permissions: [
        'LEAD_VIEW',
        'LEAD_CREATE',
        'LEAD_UPDATE',
        'LEAD_ASSIGN',
        'FOLLOWUP_CREATE',
        'FOLLOWUP_MANAGE',
        'CUSTOMER_VIEW',
        'CUSTOMER_UPDATE',
        'CUSTOMER_VIEW_UNMASKED',
        'SITE_VISIT_SCHEDULE',
        'SITE_VISIT_COMPLETE',
        'SITE_VISIT_CANCEL',
        'UNIT_VIEW',
        'UNIT_HOLD',
        'UNIT_RELEASE',
        'COST_SHEET_CREATE',
        'COST_SHEET_APPROVE',
        'BOOKING_CREATE',
        'BOOKING_CONFIRM',
        'PAYMENT_RECORD',
        'REPORT_VIEW',
      ],
    },
    {
      name: 'Sales Executive (CSE)',
      slug: 'cse',
      scope: ScopeType.SELF,
      permissions: [
        'LEAD_VIEW',
        'LEAD_CREATE',
        'LEAD_UPDATE',
        'FOLLOWUP_CREATE',
        'FOLLOWUP_MANAGE',
        'CUSTOMER_VIEW',
        'SITE_VISIT_SCHEDULE',
        'SITE_VISIT_COMPLETE',
        'UNIT_VIEW',
        'UNIT_HOLD',
        'COST_SHEET_CREATE',
        'BOOKING_CREATE',
      ],
    },
    {
      name: 'Inventory Manager',
      slug: 'inventory_manager',
      scope: ScopeType.ORGANIZATION,
      permissions: [
        'UNIT_VIEW',
        'UNIT_HOLD',
        'UNIT_RELEASE',
        'UNIT_BLOCK',
        'COST_SHEET_CREATE',
        'BOOKING_CREATE',
        'REPORT_VIEW',
      ],
    },
  ];

  const roleMap = new Map<string, string>();
  for (const roleDef of tenantRoles) {
    const roleRecord = await prisma.role.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: roleDef.slug,
        },
      },
      update: { name: roleDef.name, scope: roleDef.scope },
      create: {
        organizationId: org.id,
        name: roleDef.name,
        slug: roleDef.slug,
        scope: roleDef.scope,
        isSystem: false,
      },
    });
    roleMap.set(roleDef.slug, roleRecord.id);

    // Bind permissions
    for (const permKey of roleDef.permissions) {
      const permId = permissionMap.get(permKey);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // 5. Seed Users & Memberships
  console.log('Seeding Demo Users & Memberships...');
  const defaultPasswordHash = await hash('SecurePassword123!', ARGON2_OPTIONS);

  const demoUsers = [
    {
      email: 'admin@acmerealty.com',
      name: 'Aarav Sharma',
      roleSlug: 'org_admin',
      jobTitle: 'Managing Director',
    },
    {
      email: 'manager@acmerealty.com',
      name: 'Pooja Verma',
      roleSlug: 'sales_manager',
      jobTitle: 'Senior Sales Manager',
    },
    {
      email: 'cse@acmerealty.com',
      name: 'Rohan Mehta',
      roleSlug: 'cse',
      jobTitle: 'Sales Executive',
    },
  ];

  for (const userDef of demoUsers) {
    // 5a. Global User identity (Class G - NO organizationId)
    const user = await prisma.user.upsert({
      where: { email: userDef.email },
      update: { name: userDef.name },
      create: {
        email: userDef.email,
        passwordHash: defaultPasswordHash,
        name: userDef.name,
        isActive: true,
      },
    });

    // 5b. OrganizationMembership (Class A - Tenancy Boundary)
    const roleId = roleMap.get(userDef.roleSlug)!;
    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: { roleId, jobTitle: userDef.jobTitle },
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId,
        jobTitle: userDef.jobTitle,
        status: MembershipStatus.ACTIVE,
        isAvailable: true,
      },
    });
  }

  console.log('✅ Ralix CRM Database Seed completed successfully.');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .catch((e) => {
      console.error('❌ Seed execution failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
