# DOTVOICE_INTEGRATION.md

**Project:** Ralix Real Estate CRM  
**Provider:** DotVoice CPaaS  
**Document purpose:** Provider-specific integration specification for Ralix  
**Status:** DESIGN / SPECIFICATION ONLY  
**Source basis:** DotVoice Vendor Integration & API Documentation v2.0 (Confidential), supplied by the project owner  
**Last updated:** 2026-09-29  

---

## 1. Purpose

This document defines how Ralix will integrate DotVoice as a telephony provider for the CRM calling workflow.

The goal is to support the Ralix workflow:

```text
New Lead
   ↓
Notify eligible telecallers
   ↓
First telecaller accepts
   ↓
Backend atomically assigns lead
   ↓
Open Call Workspace
   ↓
Initiate outbound telephony workflow
   ↓
Telecaller ↔ Customer conversation
   ↓
Track call lifecycle
   ↓
Post-call disposition
   ↓
Follow-up / next action
   ↓
Call history + audit
```

This document is a provider adapter specification. It must not move telephony-provider logic into the React frontend.

---

# 2. Authoritative Project Documents

Before implementing this integration, Antigravity MUST read:

1. `ARCHITECTURE.md`
2. `UI.md`
3. `REAL_TIME_LEAD_CALLING.md`
4. `DOTVOICE_INTEGRATION.md` — this document

Priority:

```text
ARCHITECTURE.md
    ↓
REAL_TIME_LEAD_CALLING.md
    ↓
DOTVOICE_INTEGRATION.md
    ↓
UI.md
```

If a conflict is discovered, do not silently modify another document. Document the conflict and stop implementation of the affected area until the decision is resolved.

---

# 3. Critical Security Rule

## 3.1 Never expose DotVoice credentials to the browser

The DotVoice API key authorizes:
- REST API calls
- WebSocket connections
- calling
- audio streaming
- billing

The key MUST exist only on trusted backend infrastructure.

Never:
- put the API key in React environment variables exposed to the browser
- send it to the frontend
- store it in localStorage / sessionStorage
- commit it to Git
- put it in source code
- put it into client-side bundles
- paste a real key into Antigravity prompts
- log it
- return it through an API response

If a key has previously been exposed, regenerate it before production use.

---

# 4. DotVoice Account Requirements

According to the supplied DotVoice integration guide, first-time setup requires:
- API key
- at least one whitelisted server IP
- at least one assigned DID / Caller ID

DotVoice enforces IP-based access control for REST and WebSocket traffic. Therefore the Ralix telephony infrastructure must run from a stable, whitelisted server IP.

---

# 5. Provider Configuration

Use backend-only environment variables or an equivalent secrets manager:

```env
DOTVOICE_API_KEY=<secret>
DOTVOICE_GATEWAY_URL=http://rec.mindserv.co:8000
DOTVOICE_VENDOR_CODE=<vendor-code>
DOTVOICE_DID=<assigned-did>
DOTVOICE_TRUNK=<assigned-trunk>
DOTVOICE_WEBHOOK_URL=https://api.example.com/api/telephony/dotvoice/webhook
DOTVOICE_WS_ENABLED=true
```

Do not hard-code any real credential.

---

# 6. Provider Adapter Boundary

Ralix must not couple its domain directly to DotVoice:

```text
Ralix Calling Domain
        ↓
TelephonyProvider interface
        ↓
DotVoiceProvider
        ↓
DotVoice Gateway
```

Future providers can then be added:
```text
TelephonyProvider
├── MockTelephonyProvider
├── DotVoiceProvider
├── ExotelProvider
└── OtherProvider
```

The domain should know concepts such as:
- initiate call
- get call status
- hang up
- transfer
- provider event
- provider call ID

The domain must not know `X-API-Key`, DotVoice URLs, DotVoice-specific HTTP response structures, or error codes.

---

# 7. Recommended Provider Interface

Design the interface around Ralix's domain rather than DotVoice's API shape:

```ts
interface TelephonyProvider {
  initiateOutboundCall(input: InitiateOutboundCallInput): Promise<InitiateOutboundCallResult>;
  getCallStatus(providerCallId: string): Promise<ProviderCallStatus>;
  hangupCall(providerCallId: string): Promise<HangupCallResult>;
  transferCall(input: TransferCallInput): Promise<TransferCallResult>;
  getBalance(): Promise<ProviderBalance>;
  healthCheck(): Promise<ProviderHealth>;
}
```

---

# 8. DotVoice REST API

## 8.1 Base URL
```text
http://rec.mindserv.co:8000
```
All REST requests require header:
```http
X-API-Key: <secret>
Content-Type: application/json
```

---

# 9. Originate Call

DotVoice documents:
```http
POST /v1/calls
```
Request payload:
```json
{
  "to": "<destination>",
  "from_number": "<assigned DID>",
  "trunk": "<assigned trunk>",
  "webhook_url": "<HTTPS webhook>"
}
```
Response:
```json
{
  "call_id": "<provider-call-id>",
  "status": "initiated",
  "to": "<destination>",
  "from": "<DID>",
  "trunk": "<trunk>",
  "balance": 0
}
```

Ralix MUST persist the provider's `call_id`.

---

# 10. DID and Trunk Handling

Every outbound call must use an assigned DID and trunk.

Implementation requirement:
DID and trunk values must be stored exactly as provisioned and verified against the account's My DIDs configuration.

Before production activation, confirm the exact accepted `from_number` format (`+91...`, `0091...`, or local). Do not invent a normalization rule.

---

# 11. Destination Number Validation

Ralix normalizes and validates customer phone numbers in its own domain (E.164) before invoking the provider.

---

# 12. Call Lifecycle

Distinguish three separate layers:
1. **Provider technical state**: `INITIATED`, `ANSWERED`, `NO_ANSWER`, `BUSY`, `FAILED`
2. **Ralix call lifecycle**: `CREATED`, `INITIATING`, `RINGING`, `CONNECTED`, `ENDING`, `COMPLETED`, `FAILED`
3. **Business outcome**: `INTERESTED`, `SITE_VISIT_REQUIRED`, `FOLLOW_UP`, `NOT_INTERESTED`, `WRONG_NUMBER`, `NO_REQUIREMENT`

These must never be collapsed into one status.

---

# 13. DotVoice Call Status API
```http
GET /v1/calls/{call_id}
```
For operational reconciliation and recovery.

---

# 14. Hang Up
```http
DELETE /v1/calls/{call_id}
```
Invoked when telecaller clicks "End Call".

---

# 15. Transfer
```json
{
  "event": "control",
  "call_id": "<call-id>",
  "action": "transfer",
  "to": "<destination>"
}
```

**Critical Note:** The supplied DotVoice guide documents `POST /v1/calls` with a single destination `to`. It does **not** document a dedicated human-agent bridge API (`agent_number` ↔ `customer_number`).

---

# 16. WebSocket Architecture
Persistent vendor connection:
```text
ws://rec.mindserv.co:8000/vendor/stream?api_key=<secret>
```

---

# 17. WebSocket Events
`ready`, `error`, `stream_start`, `media`, `stream_stop`, `control`.

---

# 18. Audio Streaming
Codec: G.711 mulaw, 8000 Hz, mono.
Note: For a human telecaller workflow where telecallers use phones, raw audio processing should not be added unnecessarily.

---

# 19. Webhooks
Supports `call.answered` and `call.ended`. Fire-and-forget. Endpoints must be idempotent.

---

# 20. Webhook Processing Model
Async, idempotent, correlated to `CallAttempt` and `CallRecord`.

---

# 21. Idempotency
Construct deterministic fingerprint if unique event ID is absent.

---

# 22. Call Cost and Billing
Minimum 30s billing, 60s blocks. Track `provider_cost`, `provider_duration_seconds`.

---

# 23. Balance Monitoring
`GET /v1/balance`. Monitor thresholds (< ₹50 warning, < ₹1 rejected).

---

# 24. DotVoice Errors
Map 401, 402, 403 (IP/caller ID), 429, 502, 503 to internal user-friendly errors. Never expose raw API keys or infrastructure details.

---

# 25. Ralix Lead Distribution Integration
Atomic claim wins. Calling initiates only after claim succeeds.

---

# 26. Calling Workspace
Call brief card, active timer, quick notes, End Call, disposition modal with Save & Next.

---

# 27. Call Initiation Safety
Check lead assignment, tenant scope, phone number, balance preflight, idempotency.

---

# 28. Call State Separation
Technical provider state, internal lifecycle, and business outcome stored in appropriate fields.

---

# 29. Realtime Events
Translate provider webhook facts into internal CRM domain events.

---

# 30. Post-Call Disposition
Transactional Save & Next with outcome, notes, and follow-up.

---

# 31. Important Business Rule
Provider call technical termination != CRM lead business outcome.

---

# 32. Call History
Lead timeline with call record details.

---

# 33. Admin Operations
Provider health, balance, spend, failure rates.

---

# 34. Reconciliation Worker
Periodic reconciliation via `GET /v1/calls/{call_id}` to recover missed fire-and-forget webhooks.

---

# 35. Provider WebSocket Service
Isolated worker process if audio streaming is required.

---

# 36. Mock Provider
`MockTelephonyProvider` mandatory for development and CI/CD.

---

# 37. DotVoice Test Environment
Stages: Mock → REST smoke test → Webhooks → WebSocket (if audio needed) → Human telecaller bridge.

---

# 38. Human Agent Bridge — Open Provider Decision
DotVoice documents `POST /v1/calls` with one destination `to`. It does not document a 2-legged agent bridge. Must be confirmed with DotVoice.

---

# 39–54. Security, Audit, Observability, Failure Matrix, Frontend Rules, UX Rules, Status Mapping, Data Model, Environment Separation, Implementation Order, Acceptance Criteria, Non-Goals, Provider Facts, External Verification, Final Architecture Decision.

---

# 55. Antigravity Implementation Instruction

**Do not start coding immediately.**

First:
1. Read all authoritative project documents.
2. Compare this provider specification against the existing calling design.
3. Identify any conflicting assumptions.
4. Identify any missing provider capability.
5. Specifically identify the missing/uncertain human-agent/customer bridge mechanism.
6. Produce a short implementation-readiness report.
7. Do not modify architecture or schema until the report is reviewed.

After approval:
Mock provider → domain integration → DotVoice adapter → webhooks → reconciliation → realtime → verified human bridge → production hardening.
