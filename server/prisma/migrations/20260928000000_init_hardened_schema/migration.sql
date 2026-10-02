-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('SELF', 'TEAM', 'PROJECT', 'ORGANIZATION', 'GLOBAL');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "LeadLifecycleStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKING', 'WON', 'CANCELLED', 'LOST');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'CALLBACK_PENDING', 'NO_RESPONSE', 'INVALID', 'DUPLICATE', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');

-- CreateEnum
CREATE TYPE "LeadSLAState" AS ENUM ('WITHIN_SLA', 'DUE_SOON', 'BREACHED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "LeadDisposition" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'NO_RESPONSE', 'WRONG_NUMBER', 'INVALID_LEAD', 'DUPLICATE', 'BUDGET_ISSUE', 'LOCATION_ISSUE', 'PRODUCT_MISMATCH', 'COMPETITOR', 'FUTURE_REQUIREMENT', 'RENTAL_REQUIREMENT', 'INVESTMENT_REQUIREMENT', 'PURCHASED', 'LOST_TO_COMPETITOR', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('META', 'PORTAL', 'WEBSITE', 'WALK_IN', 'CHANNEL_PARTNER', 'REFERRAL', 'IMPORT');

-- CreateEnum
CREATE TYPE "AssignmentReason" AS ENUM ('MANUAL', 'AUTO_ROUND_ROBIN', 'SLA_FAILOVER', 'REDISTRIBUTION', 'TEAM_TRANSFER', 'BACKUP', 'MANAGER_REASSIGN', 'UNASSIGNED');

-- CreateEnum
CREATE TYPE "ChangeSource" AS ENUM ('MANUAL', 'AUTOMATION', 'SCORING_ENGINE', 'SLA_WORKER', 'IMPORT', 'WEBHOOK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UnitAvailability" AS ENUM ('AVAILABLE', 'ON_HOLD', 'BLOCKED', 'BOOKING_IN_PROGRESS', 'BOOKED', 'SOLD');

-- CreateEnum
CREATE TYPE "HoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "SiteVisitStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CostSheetStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPROVED', 'SUPERSEDED', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('UPCOMING', 'DUE', 'INVOICED', 'PAID_PARTIAL', 'PAID_FULL', 'OVERDUE', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('TOKEN', 'MILESTONE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CallAttemptStatus" AS ENUM ('INITIATED', 'RINGING', 'CONNECTED', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallDisposition" AS ENUM ('CONNECTED', 'NO_ANSWER', 'BUSY', 'CALLBACK_REQUESTED', 'INTERESTED', 'NOT_INTERESTED', 'WRONG_NUMBER', 'INVALID');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AttributionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'TRANSFERRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('META_LEAD_ADS', 'WHATSAPP', 'EXOTEL', 'KNOWLARITY', 'PAYMENT_GATEWAY');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "DomainEventType" AS ENUM ('LeadCreated', 'LeadAssigned', 'LeadReassigned', 'LeadStageChanged', 'LeadStatusChanged', 'LeadTemperatureChanged', 'LeadDispositionChanged', 'LeadScoreChanged', 'LeadSLABreached', 'LeadSLAResolved', 'DuplicateDetected', 'DuplicateResolved', 'SiteVisitScheduled', 'SiteVisitConfirmed', 'SiteVisitCompleted', 'SiteVisitCancelled', 'SiteVisitNoShow', 'UnitHeld', 'UnitHoldExpired', 'UnitHoldReleased', 'UnitBookingStarted', 'UnitBooked', 'UnitSold', 'UnitBlocked', 'UnitReleased', 'CostSheetGenerated', 'CostSheetApproved', 'BookingCreated', 'BookingConfirmed', 'BookingCancelled', 'ConstructionStageAdvanced', 'PaymentCreated', 'PaymentReceived', 'PaymentFailed', 'PaymentRefunded', 'MilestoneDue', 'DemandNoticeIssued', 'ChannelPartnerAttributed', 'AttributionExpired', 'AttributionTransferred', 'CommissionGenerated', 'RolePermissionsChanged', 'MembershipSuspended', 'SessionRevoked');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "DuplicateMatchType" AS ENUM ('NORMALIZED_PHONE', 'NORMALIZED_EMAIL', 'NAME_SIMILARITY', 'EXTERNAL_LEAD_ID', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "DuplicateStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ActivityActionType" AS ENUM ('LEAD_CREATED', 'AUTO_ASSIGNED', 'REASSIGNED', 'STAGE_CHANGED', 'STATUS_CHANGED', 'TEMPERATURE_CHANGED', 'DISPOSITION_CHANGED', 'SCORE_CHANGED', 'SLA_BREACHED', 'SLA_RESOLVED', 'DUPLICATE_DETECTED', 'DUPLICATE_RESOLVED', 'CALL_MADE', 'CALL_MISSED', 'WHATSAPP_SENT', 'WHATSAPP_RECEIVED', 'NOTE_ADDED', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'UNIT_HOLD_PLACED', 'UNIT_HOLD_RELEASED', 'COST_SHEET_GENERATED', 'BOOKING_CREATED', 'PAYMENT_RECEIVED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "reraNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSetting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slaEscalationSeconds" INTEGER NOT NULL DEFAULT 120,
    "slaDueSoonSeconds" INTEGER NOT NULL DEFAULT 90,
    "distributionStrategy" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "maxLeadsPerUserPerDay" INTEGER,
    "maskCustomerPhoneForCSE" BOOLEAN NOT NULL DEFAULT true,
    "defaultPhoneRegion" TEXT,
    "unitHoldMaxHours" INTEGER NOT NULL DEFAULT 24,
    "defaultGstPercent" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "defaultStampDutyPercent" DECIMAL(5,2) NOT NULL DEFAULT 6.00,
    "cpAttributionWindowDays" INTEGER NOT NULL DEFAULT 60,
    "metaCredentialRef" TEXT,
    "whatsAppCredentialRef" TEXT,
    "telephonyCredentialRef" TEXT,
    "paymentCredentialRef" TEXT,
    "telephonyProvider" TEXT NOT NULL DEFAULT 'EXOTEL',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL DEFAULT 'Sales Executive',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "authorizationVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "authorizationVersion" INTEGER NOT NULL,
    "refreshTokenFamilyId" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "scope" "ScopeType" NOT NULL DEFAULT 'SELF',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "teamRole" TEXT NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamProject" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProject" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "builderName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "reraRegistration" TEXT,
    "minPrice" DECIMAL(14,2),
    "maxPrice" DECIMAL(14,2),
    "brochureRef" TEXT,
    "googleMapsUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tower" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "constructionStage" TEXT NOT NULL DEFAULT 'Plinth Work',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyUnit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "configuration" TEXT NOT NULL,
    "facing" TEXT NOT NULL,
    "carpetAreaSqFt" DECIMAL(10,2) NOT NULL,
    "superAreaSqFt" DECIMAL(10,2),
    "basePrice" DECIMAL(14,2) NOT NULL,
    "plcAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "availability" "UnitAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryHold" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "leadId" TEXT,
    "heldByUserId" TEXT NOT NULL,
    "status" "HoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "city" TEXT,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "LeadSourceType" NOT NULL,
    "provider" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'Meta Ads',
    "externalCampaignId" TEXT,
    "projectId" TEXT,
    "budget" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "assignedToId" TEXT,
    "teamId" TEXT,
    "sourceId" TEXT,
    "campaignId" TEXT,
    "channelPartnerId" TEXT,
    "externalLeadId" TEXT,
    "adReference" TEXT,
    "formReference" TEXT,
    "lifecycleStage" "LeadLifecycleStage" NOT NULL DEFAULT 'NEW',
    "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'WARM',
    "slaState" "LeadSLAState" NOT NULL DEFAULT 'WITHIN_SLA',
    "disposition" "LeadDisposition",
    "score" INTEGER NOT NULL DEFAULT 50,
    "budgetMin" DECIMAL(14,2),
    "budgetMax" DECIMAL(14,2),
    "preferredConfig" TEXT,
    "slaDueAt" TIMESTAMP(3),
    "slaBreachedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "hasCompletedSiteVisit" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "lifecycleCycle" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "fromTeamId" TEXT,
    "toTeamId" TEXT,
    "assignedById" TEXT,
    "reason" "AssignmentReason" NOT NULL DEFAULT 'MANUAL',
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStageHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "cycle" INTEGER NOT NULL DEFAULT 1,
    "fromStage" "LeadLifecycleStage",
    "toStage" "LeadLifecycleStage" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStatusHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTemperatureHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromTemperature" "LeadTemperature",
    "toTemperature" "LeadTemperature" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTemperatureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadScoreHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "previousScore" INTEGER,
    "score" INTEGER NOT NULL,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'SCORING_ENGINE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDispositionHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromDisposition" "LeadDisposition",
    "toDisposition" "LeadDisposition" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadDispositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "matchedLeadId" TEXT NOT NULL,
    "matchType" "DuplicateMatchType" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "status" "DuplicateStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "status" "SiteVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "rating" INTEGER,
    "rescheduledFromId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CALL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "leadId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CallAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "providerCallId" TEXT,
    "maskedCustomerNumber" TEXT,
    "agentExtension" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "CallAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "callAttemptId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "recordingRef" TEXT,
    "disposition" "CallDisposition",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "serviceWindowExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerTemplateId" TEXT,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "parameterSchema" JSONB,
    "body" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "leadId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "templateId" TEXT,
    "templateParameters" JSONB,
    "providerMessageId" TEXT,
    "content" TEXT NOT NULL,
    "mediaRef" TEXT,
    "deliveryStatus" "MessageDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "failureReason" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRuleSet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRuleVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pricingRuleSetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "rules" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostSheet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "pricingRuleVersionId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "CostSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "basePrice" DECIMAL(14,2) NOT NULL,
    "floorRiseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "plcAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "parkingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amenitiesAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountApplied" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "agreementValue" DECIMAL(14,2) NOT NULL,
    "gstAmount" DECIMAL(14,2) NOT NULL,
    "stampDutyAmount" DECIMAL(14,2) NOT NULL,
    "registrationAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "otherCharges" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAllInclusive" DECIMAL(14,2) NOT NULL,
    "pdfRef" TEXT,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "supersededById" TEXT,
    "concurrency_version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "channelPartnerId" TEXT,
    "costSheetId" TEXT NOT NULL,
    "costSheetVersion" INTEGER NOT NULL,
    "costSnapshot" JSONB NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAgreementValue" DECIMAL(14,2) NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMilestone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amountDue" DECIMAL(14,2) NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'UPCOMING',
    "invoiceNumber" TEXT,
    "triggerEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "type" "PaymentType" NOT NULL DEFAULT 'MILESTONE',
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerTransactionRef" TEXT,
    "idempotencyKey" TEXT,
    "reversalOfPaymentId" TEXT,
    "recordedById" TEXT,
    "settledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPartner" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firmName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "email" TEXT,
    "reraNumber" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'SILVER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAttribution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "channelPartnerId" TEXT NOT NULL,
    "status" "AttributionStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'CP_REGISTRATION',
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributionHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "fromStatus" "AttributionStatus",
    "toStatus" "AttributionStatus" NOT NULL,
    "fromPartnerId" TEXT,
    "toPartnerId" TEXT,
    "actorId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "baseRatePercent" DECIMAL(5,2) NOT NULL,
    "acceleratorRules" JSONB NOT NULL,
    "tierModifiers" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPayout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelPartnerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "commissionRuleId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTimeline" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "actionType" "ActivityActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "sessionId" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "source" "ChangeSource" NOT NULL DEFAULT 'MANUAL',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "provider" "WebhookProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payloadReference" TEXT NOT NULL,
    "signatureVerifiedAt" TIMESTAMP(3),
    "correlationId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "DomainEventType" NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "correlationId" TEXT,
    "causationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "linkUrl" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSetting_organizationId_key" ON "OrganizationSetting"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_status_idx" ON "OrganizationMembership"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_isAvailable_idx" ON "OrganizationMembership"("organizationId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_id_userId_organizationId_key" ON "OrganizationMembership"("id", "userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_id_organizationId_key" ON "OrganizationMembership"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Session_organizationId_userId_idx" ON "Session"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_refreshTokenFamilyId_idx" ON "Session"("refreshTokenFamilyId");

-- CreateIndex
CREATE INDEX "Role_organizationId_isActive_idx" ON "Role"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Role_organizationId_slug_key" ON "Role"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_resource_idx" ON "Permission"("resource");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "Team_organizationId_isActive_idx" ON "Team"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "TeamMember_membershipId_isActive_idx" ON "TeamMember"("membershipId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_membershipId_key" ON "TeamMember"("teamId", "membershipId");

-- CreateIndex
CREATE INDEX "TeamProject_projectId_idx" ON "TeamProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamProject_teamId_projectId_key" ON "TeamProject"("teamId", "projectId");

-- CreateIndex
CREATE INDEX "UserProject_projectId_idx" ON "UserProject"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProject_membershipId_projectId_key" ON "UserProject"("membershipId", "projectId");

-- CreateIndex
CREATE INDEX "Project_organizationId_isActive_idx" ON "Project"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_slug_key" ON "Project"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_organizationId_key" ON "Project"("id", "organizationId");

-- CreateIndex
CREATE INDEX "Tower_organizationId_projectId_idx" ON "Tower"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Tower_id_organizationId_key" ON "Tower"("id", "organizationId");

-- CreateIndex
CREATE INDEX "PropertyUnit_organizationId_availability_idx" ON "PropertyUnit"("organizationId", "availability");

-- CreateIndex
CREATE INDEX "PropertyUnit_organizationId_projectId_availability_idx" ON "PropertyUnit"("organizationId", "projectId", "availability");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyUnit_towerId_unitNumber_key" ON "PropertyUnit"("towerId", "unitNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyUnit_id_organizationId_key" ON "PropertyUnit"("id", "organizationId");

-- CreateIndex
CREATE INDEX "InventoryHold_organizationId_unitId_status_idx" ON "InventoryHold"("organizationId", "unitId", "status");

-- CreateIndex
CREATE INDEX "InventoryHold_status_expiresAt_idx" ON "InventoryHold"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Customer_organizationId_normalizedEmail_idx" ON "Customer"("organizationId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "Customer_organizationId_name_idx" ON "Customer"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_normalizedPhone_key" ON "Customer"("organizationId", "normalizedPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_organizationId_key" ON "Customer"("id", "organizationId");

-- CreateIndex
CREATE INDEX "LeadSource_organizationId_type_idx" ON "LeadSource"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_isActive_idx" ON "Campaign"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Lead_organizationId_lifecycleStage_idx" ON "Lead"("organizationId", "lifecycleStage");

-- CreateIndex
CREATE INDEX "Lead_organizationId_status_idx" ON "Lead"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Lead_organizationId_temperature_idx" ON "Lead"("organizationId", "temperature");

-- CreateIndex
CREATE INDEX "Lead_organizationId_slaState_idx" ON "Lead"("organizationId", "slaState");

-- CreateIndex
CREATE INDEX "Lead_organizationId_disposition_idx" ON "Lead"("organizationId", "disposition");

-- CreateIndex
CREATE INDEX "Lead_organizationId_assignedToId_idx" ON "Lead"("organizationId", "assignedToId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_teamId_idx" ON "Lead"("organizationId", "teamId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_projectId_idx" ON "Lead"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_campaignId_idx" ON "Lead"("organizationId", "campaignId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_createdAt_idx" ON "Lead"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_nextFollowUpAt_idx" ON "Lead"("organizationId", "nextFollowUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_id_organizationId_key" ON "Lead"("id", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_organizationId_sourceId_externalLeadId_key" ON "Lead"("organizationId", "sourceId", "externalLeadId");

-- CreateIndex
CREATE INDEX "LeadAssignment_organizationId_leadId_assignedAt_idx" ON "LeadAssignment"("organizationId", "leadId", "assignedAt");

-- CreateIndex
CREATE INDEX "LeadAssignment_organizationId_toUserId_idx" ON "LeadAssignment"("organizationId", "toUserId");

-- CreateIndex
CREATE INDEX "LeadAssignment_organizationId_toTeamId_idx" ON "LeadAssignment"("organizationId", "toTeamId");

-- CreateIndex
CREATE INDEX "LeadStageHistory_organizationId_leadId_createdAt_idx" ON "LeadStageHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadStageHistory_organizationId_leadId_cycle_idx" ON "LeadStageHistory"("organizationId", "leadId", "cycle");

-- CreateIndex
CREATE INDEX "LeadStageHistory_organizationId_toStage_createdAt_idx" ON "LeadStageHistory"("organizationId", "toStage", "createdAt");

-- CreateIndex
CREATE INDEX "LeadStatusHistory_organizationId_leadId_createdAt_idx" ON "LeadStatusHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadTemperatureHistory_organizationId_leadId_createdAt_idx" ON "LeadTemperatureHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadScoreHistory_organizationId_leadId_createdAt_idx" ON "LeadScoreHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadDispositionHistory_organizationId_leadId_createdAt_idx" ON "LeadDispositionHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_organizationId_status_idx" ON "DuplicateCandidate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_organizationId_matchedLeadId_idx" ON "DuplicateCandidate"("organizationId", "matchedLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateCandidate_organizationId_leadId_matchedLeadId_key" ON "DuplicateCandidate"("organizationId", "leadId", "matchedLeadId");

-- CreateIndex
CREATE INDEX "SiteVisit_organizationId_leadId_idx" ON "SiteVisit"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "SiteVisit_organizationId_status_scheduledAt_idx" ON "SiteVisit"("organizationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "SiteVisit_organizationId_projectId_scheduledAt_idx" ON "SiteVisit"("organizationId", "projectId", "scheduledAt");

-- CreateIndex
CREATE INDEX "FollowUp_organizationId_assignedToId_scheduledAt_idx" ON "FollowUp"("organizationId", "assignedToId", "scheduledAt");

-- CreateIndex
CREATE INDEX "FollowUp_organizationId_leadId_idx" ON "FollowUp"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "FollowUp_organizationId_status_scheduledAt_idx" ON "FollowUp"("organizationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Note_organizationId_leadId_createdAt_idx" ON "Note"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_organizationId_assignedToId_isCompleted_idx" ON "Task"("organizationId", "assignedToId", "isCompleted");

-- CreateIndex
CREATE INDEX "CallAttempt_organizationId_leadId_initiatedAt_idx" ON "CallAttempt"("organizationId", "leadId", "initiatedAt");

-- CreateIndex
CREATE INDEX "CallAttempt_organizationId_userId_initiatedAt_idx" ON "CallAttempt"("organizationId", "userId", "initiatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallAttempt_organizationId_providerCallId_key" ON "CallAttempt"("organizationId", "providerCallId");

-- CreateIndex
CREATE UNIQUE INDEX "CallRecord_callAttemptId_key" ON "CallRecord"("callAttemptId");

-- CreateIndex
CREATE INDEX "CallRecord_organizationId_leadId_createdAt_idx" ON "CallRecord"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "CallRecord_organizationId_userId_createdAt_idx" ON "CallRecord"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "CallRecord_organizationId_disposition_idx" ON "CallRecord"("organizationId", "disposition");

-- CreateIndex
CREATE INDEX "Conversation_organizationId_lastInboundAt_idx" ON "Conversation"("organizationId", "lastInboundAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_organizationId_customerId_channel_key" ON "Conversation"("organizationId", "customerId", "channel");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_organizationId_status_idx" ON "WhatsAppTemplate"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_organizationId_name_language_key" ON "WhatsAppTemplate"("organizationId", "name", "language");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_organizationId_providerTemplateId_key" ON "WhatsAppTemplate"("organizationId", "providerTemplateId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_organizationId_conversationId_sentAt_idx" ON "WhatsAppMessage"("organizationId", "conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_organizationId_leadId_idx" ON "WhatsAppMessage"("organizationId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_organizationId_providerMessageId_key" ON "WhatsAppMessage"("organizationId", "providerMessageId");

-- CreateIndex
CREATE INDEX "PricingRuleSet_organizationId_projectId_isActive_idx" ON "PricingRuleSet"("organizationId", "projectId", "isActive");

-- CreateIndex
CREATE INDEX "PricingRuleVersion_organizationId_effectiveFrom_idx" ON "PricingRuleVersion"("organizationId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRuleVersion_pricingRuleSetId_version_key" ON "PricingRuleVersion"("pricingRuleSetId", "version");

-- CreateIndex
CREATE INDEX "CostSheet_organizationId_leadId_idx" ON "CostSheet"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "CostSheet_organizationId_status_idx" ON "CostSheet"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CostSheet_organizationId_leadId_unitId_version_key" ON "CostSheet"("organizationId", "leadId", "unitId", "version");

-- CreateIndex
CREATE INDEX "Booking_organizationId_status_idx" ON "Booking"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Booking_organizationId_unitId_idx" ON "Booking"("organizationId", "unitId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_customerId_idx" ON "Booking"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Booking_organizationId_bookingDate_idx" ON "Booking"("organizationId", "bookingDate");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_id_organizationId_key" ON "Booking"("id", "organizationId");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_organizationId_bookingId_createdAt_idx" ON "BookingStatusHistory"("organizationId", "bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentMilestone_organizationId_status_dueDate_idx" ON "PaymentMilestone"("organizationId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMilestone_bookingId_sequence_key" ON "PaymentMilestone"("bookingId", "sequence");

-- CreateIndex
CREATE INDEX "Payment_organizationId_bookingId_paidAt_idx" ON "Payment"("organizationId", "bookingId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_organizationId_status_idx" ON "Payment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Payment_organizationId_status_createdAt_idx" ON "Payment"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_reversalOfPaymentId_idx" ON "Payment"("reversalOfPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_organizationId_provider_providerTransactionRef_key" ON "Payment"("organizationId", "provider", "providerTransactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_organizationId_idempotencyKey_key" ON "Payment"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ChannelPartner_organizationId_isActive_idx" ON "ChannelPartner"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPartner_organizationId_normalizedPhone_key" ON "ChannelPartner"("organizationId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "LeadAttribution_organizationId_channelPartnerId_status_idx" ON "LeadAttribution"("organizationId", "channelPartnerId", "status");

-- CreateIndex
CREATE INDEX "LeadAttribution_status_expiresAt_idx" ON "LeadAttribution"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AttributionHistory_organizationId_attributionId_createdAt_idx" ON "AttributionHistory"("organizationId", "attributionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_organizationId_version_key" ON "CommissionRule"("organizationId", "version");

-- CreateIndex
CREATE INDEX "CommissionPayout_organizationId_status_idx" ON "CommissionPayout"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPayout_organizationId_bookingId_channelPartnerId_key" ON "CommissionPayout"("organizationId", "bookingId", "channelPartnerId");

-- CreateIndex
CREATE INDEX "ActivityTimeline_organizationId_leadId_createdAt_idx" ON "ActivityTimeline"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityTimeline_organizationId_createdAt_idx" ON "ActivityTimeline"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_actorId_createdAt_idx" ON "AuditLog"("organizationId", "actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_action_createdAt_idx" ON "AuditLog"("organizationId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_status_idx" ON "WebhookEvent"("provider", "status");

-- CreateIndex
CREATE INDEX "WebhookEvent_organizationId_receivedAt_idx" ON "WebhookEvent"("organizationId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_providerEventId_key" ON "WebhookEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_createdAt_idx" ON "OutboxEvent"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_aggregateType_aggregateId_idx" ON "OutboxEvent"("organizationId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_userId_read_idx" ON "Notification"("organizationId", "userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_organizationId_dedupeKey_key" ON "Notification"("organizationId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "OrganizationSetting" ADD CONSTRAINT "OrganizationSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProject" ADD CONSTRAINT "TeamProject_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProject" ADD CONSTRAINT "TeamProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProject" ADD CONSTRAINT "UserProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tower" ADD CONSTRAINT "Tower_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyUnit" ADD CONSTRAINT "PropertyUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyUnit" ADD CONSTRAINT "PropertyUnit_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryHold" ADD CONSTRAINT "InventoryHold_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStageHistory" ADD CONSTRAINT "LeadStageHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTemperatureHistory" ADD CONSTRAINT "LeadTemperatureHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScoreHistory" ADD CONSTRAINT "LeadScoreHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDispositionHistory" ADD CONSTRAINT "LeadDispositionHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_matchedLeadId_fkey" FOREIGN KEY ("matchedLeadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteVisit" ADD CONSTRAINT "SiteVisit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallAttempt" ADD CONSTRAINT "CallAttempt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_callAttemptId_fkey" FOREIGN KEY ("callAttemptId") REFERENCES "CallAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsAppTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRuleSet" ADD CONSTRAINT "PricingRuleSet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRuleVersion" ADD CONSTRAINT "PricingRuleVersion_pricingRuleSetId_fkey" FOREIGN KEY ("pricingRuleSetId") REFERENCES "PricingRuleSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostSheet" ADD CONSTRAINT "CostSheet_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostSheet" ADD CONSTRAINT "CostSheet_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostSheet" ADD CONSTRAINT "CostSheet_pricingRuleVersionId_fkey" FOREIGN KEY ("pricingRuleVersionId") REFERENCES "PricingRuleVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMilestone" ADD CONSTRAINT "PaymentMilestone_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "PaymentMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversalOfPaymentId_fkey" FOREIGN KEY ("reversalOfPaymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttribution" ADD CONSTRAINT "LeadAttribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttribution" ADD CONSTRAINT "LeadAttribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAttribution" ADD CONSTRAINT "LeadAttribution_channelPartnerId_fkey" FOREIGN KEY ("channelPartnerId") REFERENCES "ChannelPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributionHistory" ADD CONSTRAINT "AttributionHistory_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "LeadAttribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_channelPartnerId_fkey" FOREIGN KEY ("channelPartnerId") REFERENCES "ChannelPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayout" ADD CONSTRAINT "CommissionPayout_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "CommissionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTimeline" ADD CONSTRAINT "ActivityTimeline_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



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
