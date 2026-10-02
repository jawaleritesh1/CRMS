# Ralix CRM — Unresolved Decisions & Business Parameter Blocker List
**Target Architecture**: `v5.1.0-HARDENED`  
**Status**: Authoritative Register of Architecture TBDs & Proposed Items  

---

## 1. Executive Summary & Policy Rule

In accordance with architectural invariant Principle 11 ("Do not invent missing business decisions"), items designated as **`TBD`** or **`Status: Proposed`** within `ARCHITECTURE.md` are documented below. 

Engineers and automated agents **MUST NOT** commit arbitrary production defaults into code or production configuration for these items without explicit sign-off from designated stakeholders (Security Officer, Legal Counsel, Head of Product, Infrastructure Lead).

For local test execution and unblocking development of decoupled subsystems, safe interim defaults are defined strictly under isolated development configuration flags.

---

## 2. Unresolved Security & Authentication Decisions

### DEC-001: Access Token & Refresh Token Lifetimes
- **Architecture Reference**: §6.3, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Security Officer / Lead Architect
- **Context & Impact**: Dictates the balance between session revocation latency and token verification overhead. A short access token lifetime reduces stale permission windows; a long lifetime increases window of exposure if `authorizationVersion` cache is bypassed.
- **Interim Development Strategy**: In local dev/test environment only, configure `ACCESS_TOKEN_TTL=15m` and `REFRESH_TOKEN_TTL=7d`. Production deployments are blocked on formal sign-off.

### DEC-002: Credential Lockout Thresholds & Failure Cooldown
- **Architecture Reference**: §6.3, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Security Officer
- **Context & Impact**: Defines maximum consecutive failed login attempts before account lock, lockout duration, and whether lockout triggers tenant-level alerts or CAPTCHA challenges.
- **Interim Development Strategy**: Interim mock: 5 failed attempts within 15 minutes locks account for 30 minutes; reset on successful verification.

### DEC-003: Argon2id Hashing Parameters
- **Architecture Reference**: §6.3, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Infrastructure & Security Lead
- **Context & Impact**: Hardware memory cost (`m`), time cost (`t`), and parallelism (`p`) must be calibrated against server CPU capacity on target hosting instances (e.g. Neon serverless backend) to prevent denial-of-service via concurrent authentication calls.
- **Interim Development Strategy**: Use RFC 9106 minimum recommended parameters for memory-constrained environments (`m=65536`, `t=3`, `p=4`) in testing.

### DEC-004: Global Platform Break-Glass Workflow
- **Architecture Reference**: §7.8, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Head of Security & Compliance
- **Context & Impact**: `GLOBAL`-scoped system roles bypass tenant boundaries for emergency operations. Multi-party authorization, hardware token requirements, time-bounded elevation, and external SIEM alert triggers must be specified before enabling `scope = GLOBAL` in production.
- **Interim Development Strategy**: Prohibit `GLOBAL` scope in standard login. Restrict system role activation in local development to seeded seed scripts.

---

## 3. Unresolved Compliance, Legal & Data Retention Decisions

### DEC-005: Regulatory Data Retention Periods
- **Architecture Reference**: §34.4, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Legal Counsel / Compliance Officer
- **Context & Impact**: Governs exact retention schedules across jurisdictions (e.g., RERA in India requires keeping transaction and booking records for 5–10 years). Specifies when `ActivityTimeline`, application logs, and soft-deleted leads can be permanently pruned or archived to cold storage.
- **Interim Development Strategy**: Retain all records indefinitely during development. Soft deletion sets `deletedAt` without physical purge.

### DEC-006: PII Anonymization & Right-to-be-Forgotten Policy
- **Architecture Reference**: §31.4, §34.4
- **Status**: `TBD`
- **Stakeholder**: Legal Counsel
- **Context & Impact**: When a customer exercises right-to-be-forgotten, financial bookings cannot be deleted under tax/RERA laws. The policy must enumerate the exact replacement masks (e.g., `phone -> 'REDACTED'`, `name -> 'ANONYMIZED_CUSTOMER_#ID'`) and determine whether lead attribution history is dissociated.
- **Interim Development Strategy**: Support non-destructive placeholder masking; maintain booking total integrity.

---

## 4. Unresolved Infrastructure, Disaster Recovery & Scale Decisions

### DEC-007: Recovery Point Objective (RPO) & Recovery Time Objective (RTO)
- **Architecture Reference**: §40, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Infrastructure Lead / CTO
- **Context & Impact**: Determines database replication topologies, point-in-time recovery log archiving frequency on Neon PostgreSQL, and automated failover mechanics between primary and secondary regions.
- **Interim Development Strategy**: Document PostgreSQL automated daily backup and WAL archiving configuration.

### DEC-008: Disaster Recovery Drill Schedule
- **Architecture Reference**: §40, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: DevOps / Reliability Lead
- **Context & Impact**: Mandates cadence of production failover simulations, read-replica promotion verification, and tenant restore integrity audits.
- **Interim Development Strategy**: Define procedure in documentation; test restore script manually in staging.

### DEC-009: Database Partitioning Trigger Thresholds
- **Architecture Reference**: §42.2, Checklist §45
- **Status**: `Status: Proposed`
- **Stakeholder**: Database Architect
- **Context & Impact**: Table partitioning for high-velocity tables (`AuditLog`, `OutboxEvent`, `WebhookEvent`, `LeadStageHistory`) based on row count thresholds (e.g., 50M rows) or time range (monthly/quarterly).
- **Interim Development Strategy**: Implement single-table schemas with appropriate composite indexes first. Scaffolding remains ready for declarative PostgreSQL table partitioning.

---

## 5. Unresolved API, Rate Limiting & Integration Decisions

### DEC-010: Tiered Rate-Limiting Thresholds
- **Architecture Reference**: §27.6, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: API Gateway / Security Architect
- **Context & Impact**: Specific rate limits per IP, per tenant, and per authenticated user across route classifications (e.g., `/api/auth/login`, `/api/webhooks/*`, standard CRM endpoints).
- **Interim Development Strategy**: Apply conservative dev limits: 10 req/min for auth, 60 req/min for public webhooks, 600 req/min for authenticated tenant APIs.

### DEC-011: Idempotency Key Retention Window
- **Architecture Reference**: §25.3, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Backend Architect
- **Context & Impact**: Expiry window after which payment and mutation `idempotencyKey` values are pruned from Redis / DB. Setting this too short risks duplicate execution on delayed retries; setting it too long wastes storage.
- **Interim Development Strategy**: Default to 48 hours for development and testing.

### DEC-012: API Version Deprecation & Support Window
- **Architecture Reference**: §27.2, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Product Manager / Partner Lead
- **Context & Impact**: Sunset schedule for legacy webhook payloads, mobile app client versions, and partner CRM integrations before endpoint retirement.
- **Interim Development Strategy**: Follow semantic versioning (`v1`); mark deprecated endpoints with `Sunset` HTTP headers.

---

## 6. Unresolved Business Process & SLA Rules

### DEC-013: SLA-Qualifying First-Response Action Set
- **Architecture Reference**: §11.4, Checklist §45
- **Status**: `TBD`
- **Stakeholder**: Head of Sales Operations
- **Context & Impact**: Defines which agent actions formally satisfy and stop the initial SLA timer: does sending an automated WhatsApp template qualify, or does it require an outbound phone call with duration > 0 seconds, or a manual note?
- **Interim Development Strategy**: For Phase 4 testing, classify any connected call (`durationSeconds > 0`) or agent-initiated WhatsApp outbound interaction as SLA-qualifying.

### DEC-014: Multi-Organization Rollout Strategy
- **Architecture Reference**: §5.2, ADR-011
- **Status**: `Status: Proposed`
- **Stakeholder**: Executive Product Council
- **Context & Impact**: Whether users can self-serve create multiple organizations or if organization provisioning is strictly managed by platform administrators.
- **Interim Development Strategy**: Support organization creation via platform seed/admin CLI scripts; users join organizations via invitation.

---

## 7. Blocker Matrix

| Decision ID | Area | Blocks Phase | Safe Interim Strategy in Dev? |
|---|---|---|:---:|
| **DEC-001** | Token Lifetimes | Phase 2 | YES (15m access / 7d refresh) |
| **DEC-002** | Lockout Thresholds | Phase 2 | YES (5 attempts / 30m lock) |
| **DEC-003** | Argon2 Parameters | Phase 2 | YES (m=64MB, t=3, p=4) |
| **DEC-004** | Global Break-Glass | Phase 2 | YES (Disabled for normal auth) |
| **DEC-005** | Legal Retention | Phase 13 | YES (Indefinite soft-delete) |
| **DEC-006** | PII Anonymization | Phase 13 | YES (Standard redaction mask) |
| **DEC-007** | RPO / RTO | Phase 15 | YES (Neon point-in-time recovery) |
| **DEC-008** | DR Drill Schedule | Phase 15 | YES (Documented manual script) |
| **DEC-009** | Table Partitioning | Phase 15 | YES (Single table + B-tree indexes) |
| **DEC-010** | Rate Limits | Phase 15 | YES (Conservative dev Redis limiter) |
| **DEC-011** | Idempotency Window | Phase 11 | YES (48-hour Redis TTL) |
| **DEC-012** | API Deprecation | Phase 14 | YES (v1 prefix standard) |
| **DEC-013** | SLA Action Set | Phase 4 | YES (Connected call / outbound WA) |
| **DEC-014** | Multi-Org Creation | Phase 1 | YES (Admin-only creation) |
