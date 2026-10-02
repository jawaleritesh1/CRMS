# Ralix CRM — UI Architecture & Design Plan (v2 — Production UI/UX Architecture)

> **Document Version**: 2.0.0-PRODUCTION  
> **Document Status**: Production-Ready UI/UX Architecture Specification  
> **Last Updated**: 2026-09-29  
> **Tech Stack**: Next.js 15 · React 19 · TypeScript · Lucide Icons · Vanilla CSS  
> **Design Philosophy**: Simple · Modern · Premium · Sober · Effortless · Enterprise-Grade  
> **Authoritative Alignment**: Strictly compliant with `ARCHITECTURE.md` (v5.1.0-HARDENED)

---

## Table of Contents

**I. Foundations & Design System**
- [1. Design Philosophy & Principles](#1-design-philosophy--principles)
- [2. Design System & CSS Tokens](#2-design-system--css-tokens)
- [3. Typography System](#3-typography-system)
- [4. Color System & Semantic Mapping](#4-color-system--semantic-mapping)
- [5. Spacing, Grid & Content Dimensions](#5-spacing-grid--content-dimensions)
- [6. Component Library](#6-component-library)
- [7. Interaction Patterns & Explicit Command Transitions](#7-interaction-patterns--explicit-command-transitions)

**II. Personas, Workspaces & Shell**
- [8. User Personas & UX Modes](#8-user-personas--ux-modes)
- [9. Shell & Global Navigation](#9-shell--global-navigation)
- [10. Responsive Strategy & Device Adaptations](#10-responsive-strategy--device-adaptations)
- [11. Authentication & Workspace Session Handling](#11-authentication--workspace-session-handling)

**III. High-Velocity Lead Operations & Telecalling**
- [12. Telecaller Experience & Calling Workstations](#12-telecaller-experience--calling-workstations)
- [13. Leads Module & Next Action Architecture](#13-leads-module--next-action-architecture)
- [14. Communication Center & Post-Call Workflow](#14-communication-center--post-call-workflow)
- [15. Site Visits Module](#15-site-visits-module)

**IV. Inventory & Plotted Development**
- [16. Constructed Inventory (Units) & Hold Workflow](#16-constructed-inventory-units--hold-workflow)
- [17. Plotted Development Inventory & Interactive Map](#17-plotted-development-inventory--interactive-map)
- [18. Inventory Concurrency & Locking UX Rules](#18-inventory-concurrency--locking-ux-rules)

**V. Commercial Operations & Finance**
- [19. Cost Sheets & Versioning Architecture](#19-cost-sheets--versioning-architecture)
- [20. Booking Workflow & Six-Step Stepper](#20-booking-workflow--six-step-stepper)
- [21. Payments, Ledger & Financial Integrity](#21-payments-ledger--financial-integrity)
- [22. Channel Partners & Attributions](#22-channel-partners--attributions)

**VI. Administration & Platform Governance**
- [23. Admin Operations & "Attention Required" Center](#23-admin-operations--attention-required-center)
- [24. Audit Trail & Compliance Viewer](#24-audit-trail--compliance-viewer)
- [25. Reports & Analytics](#25-reports--analytics)
- [26. Security UX & Data Governance](#26-security-ux--data-governance)

**VII. Resilience, Standards & Execution**
- [27. Error Handling for Business Transactions](#27-error-handling-for-business-transactions)
- [28. Accessibility Standards (WCAG 2.1 AA)](#28-accessibility-standards-wcag-21-aa)
- [29. Performance Targets & Core Web Vitals](#29-performance-targets--core-web-vitals)
- [30. Empty States & Zero-Data UX](#30-empty-states--zero-data-ux)
- [31. Implementation Order & Phased Roadmap](#31-implementation-order--phased-roadmap)
- [32. UX Acceptance Criteria](#32-ux-acceptance-criteria)
- [33. V2 Change Summary](#33-v2-change-summary)

---

# 1. Design Philosophy & Principles

The Ralix CRM serves real estate sales executives, telecallers/CSEs, closing managers, inventory managers, and organization administrators operating in **high-velocity, high-stakes environments**. A telecaller dials 80–150 prospects per shift; an inventory controller arbitrates high-demand unit releases during festival launches; sales managers run weekend site-visit drives across sprawling township layouts.

### Core Design Principles

| Principle | Architectural Meaning & UI Realization |
| :--- | :--- |
| **Simple** | Every screen has exactly one visually prominent primary action. Workflows require zero unnecessary page hops. Information hierarchy is instantly scannable without deciphering dense nested cards. |
| **Modern** | Precise geometry, generous whitespace, subtle depth via layered shadows and crisp borders. No skeuomorphic faux-leather, no heavy drop-shadows, and no gratuitous micro-interactions. |
| **Premium** | Refined typography (`Inter` and `JetBrains Mono`), muted slate tonal palette, and measured 150–200ms easing curves. The interface feels like an enterprise financial terminal designed for luxury asset transactions, not a generic mass-market SaaS dashboard. |
| **Sober** | Muted, desaturated background tones. Color is exclusively semantic (signaling availability, SLA condition, financial health, or urgent operational action), never purely decorative. |
| **Effortless** | High-velocity workstations: telecallers process calls, record dispositions, and schedule next actions directly from a unified continuous surface without round-trip list navigation. |
| **Authoritative** | The UI never acts as an independent business or authorization layer. UI representations are honest previews of server-authoritative state; concurrency-sensitive mutations require backend confirmation. |

### Anti-Patterns (Explicitly Forbidden)

- ❌ **Rainbow status badges**: Never use saturated primary hues; use muted pastel backgrounds with high-contrast text.
- ❌ **Modal-inside-modal**: Never stack modals; use slide-over drawers or inline wizard steps.
- ❌ **Dense, unconfigurable tables**: Provide configurable column sets, sticky headers, and clear row heights (52px comfortable).
- ❌ **Floating action buttons (FABs)**: Use docked header actions or contextual row actions.
- ❌ **Blinking or vibrating indicators**: Pulsing is reserved solely for active telephony connection states.
- ❌ **Full-page blocking loaders**: Use layout-matching skeleton screens to prevent layout shifts.
- ❌ **Generic inline auto-save on lifecycle states**: Domain state transitions require explicit user confirmation commands.
- ❌ **Generic "Undo" on inventory holds**: Concurrency-sensitive transactions must never imply optimistic rollback.
- ❌ **Unconfirmed Kanban drops**: Dragging cards across stage gates must wait for backend validation.

---

# 2. Design System & CSS Tokens

All visual properties are specified via CSS custom properties defined at `:root`. Component stylesheets never hardcode magic pixels or hex codes.

```css
:root {
  /* ─── Radius ─── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ─── Layered Elevation Shadows ─── */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 8px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 12px 24px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.04);
  --shadow-xl: 0 20px 40px rgba(15, 23, 42, 0.12);

  /* ─── Motion & Timing Curves ─── */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Z-Index Scale ─── */
  --z-base: 0;
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-drawer-backdrop: 300;
  --z-drawer: 310;
  --z-modal-backdrop: 400;
  --z-modal: 410;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

---

# 3. Typography System

**Primary Typeface**: [Inter](https://fonts.google.com/specimen/Inter) — engineered for UI legibility, tabular data, and high-density information displays.  
**Monospace Typeface**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — applied to transaction IDs, plot parcel numbers, monetary amounts, and SLA timers.

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ─── Type Scale ─── */
  --text-xs:   0.75rem;    /* 12px — badges, timestamps, micro-captions */
  --text-sm:   0.8125rem;  /* 13px — table headers, secondary labels, helper text */
  --text-base: 0.875rem;   /* 14px — body copy, table cells, form inputs */
  --text-md:   0.9375rem;  /* 15px — primary list items, emphasized body */
  --text-lg:   1.0625rem;  /* 17px — modal headers, card titles, drawer headers */
  --text-xl:   1.25rem;    /* 20px — page headers, major section titles */
  --text-2xl:  1.5rem;     /* 24px — KPI stat numbers, milestone totals */
  --text-3xl:  1.875rem;   /* 30px — hero dashboard metrics */

  /* ─── Weights ─── */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* ─── Line Heights ─── */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Type Application Rules

| UI Element | Token Size | Weight | Color Token | Font Family |
| :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `--text-xl` | `--weight-semibold` | `--color-text-primary` | `--font-sans` |
| **Drawer / Section Title**| `--text-lg` | `--weight-semibold` | `--color-text-primary` | `--font-sans` |
| **Table Header** | `--text-sm` | `--weight-medium` | `--color-text-tertiary` | `--font-sans` |
| **Table Body Cell** | `--text-base` | `--weight-regular` | `--color-text-primary` | `--font-sans` |
| **Monetary Amount** | `--text-base` | `--weight-semibold` | `--color-text-primary` | `--font-mono` |
| **Identifier / Plot Code**| `--text-sm` | `--weight-medium` | `--color-text-secondary` | `--font-mono` |
| **SLA Countdown Timer** | `--text-xs` | `--weight-bold` | Contextual semantic | `--font-mono` |
| **Status Badge** | `--text-xs` | `--weight-medium` | Contextual semantic | `--font-sans` |

---

# 4. Color System & Semantic Mapping

Built upon neutral slate-indigo undertones. High-contrast, WCAG AA compliant (minimum 4.5:1 for body copy, 3:1 for large headers).

```css
:root {
  /* ─── Surfaces ─── */
  --color-bg-primary:     #FFFFFF;
  --color-bg-secondary:   #F8F9FB;
  --color-bg-tertiary:    #F1F3F7;
  --color-bg-elevated:    #FFFFFF;
  --color-bg-overlay:     rgba(15, 23, 42, 0.48);

  /* ─── Typography & Icons ─── */
  --color-text-primary:   #1A1F36;
  --color-text-secondary: #5E6687;
  --color-text-tertiary:  #8792A8;
  --color-text-disabled:  #B8C0D0;
  --color-text-inverse:   #FFFFFF;

  /* ─── Structural Borders ─── */
  --color-border-light:   #E8ECF1;
  --color-border-default: #D5DBE5;
  --color-border-strong:  #B8C0D0;
  --color-border-focus:   #5B6BD5;

  /* ─── Brand & Primary Action (Restrained Indigo) ─── */
  --color-accent-50:      #F0F1FE;
  --color-accent-100:     #E0E3FD;
  --color-accent-200:     #C7CCFB;
  --color-accent-500:     #5B6BD5;
  --color-accent-600:     #4A59C7;
  --color-accent-700:     #3D49A8;

  /* ─── Semantic Tonal Variants ─── */
  /* Success: Available, Completed, Succeeded, Within SLA */
  --color-success-bg:     #ECFDF3;
  --color-success-text:   #16794A;
  --color-success-border: #A6F0C6;

  /* Warning: On Hold, Holding..., Due Soon, Callback Pending, Warm */
  --color-warning-bg:     #FFFAEB;
  --color-warning-text:   #93570A;
  --color-warning-border: #FEDF89;

  /* Error / Danger: Breached SLA, Hot Lead, Blocked, Cancelled, Overdue */
  --color-error-bg:       #FEF3F2;
  --color-error-text:     #B42318;
  --color-error-border:   #FECDCA;

  /* Info: Booking in Progress, Cold, Scheduled */
  --color-info-bg:        #EFF8FF;
  --color-info-text:      #175CD3;
  --color-info-border:    #B2DDFF;

  /* Neutral: Sold, Closed, Suspended, Superseded */
  --color-neutral-bg:     #F2F4F7;
  --color-neutral-text:   #475467;
  --color-neutral-border: #D0D5DD;
}
```

### Domain Status Mapping Matrix

| Domain Category | Status Value | Background Token | Text Token | Border Token |
| :--- | :--- | :--- | :--- | :--- |
| **Inventory** | `AVAILABLE` | `--color-success-bg` | `--color-success-text` | `--color-success-border` |
| **Inventory** | `HOLDING...` (transient) | `--color-warning-bg` | `--color-warning-text` | `--color-warning-border` |
| **Inventory** | `ON_HOLD` | `--color-warning-bg` | `--color-warning-text` | `--color-warning-border` |
| **Inventory** | `BOOKING_IN_PROGRESS` | `--color-info-bg` | `--color-info-text` | `--color-info-border` |
| **Inventory** | `BOOKED` | `--color-accent-50` | `--color-accent-700` | `--color-accent-200` |
| **Inventory** | `SOLD` | `--color-neutral-bg` | `--color-neutral-text` | `--color-neutral-border` |
| **Inventory** | `BLOCKED` | `--color-error-bg` | `--color-error-text` | `--color-error-border` |
| **Lead Temperature** | `HOT` | `--color-error-bg` | `--color-error-text` | `--color-error-border` |
| **Lead Temperature** | `WARM` | `--color-warning-bg` | `--color-warning-text` | `--color-warning-border` |
| **Lead Temperature** | `COLD` | `--color-info-bg` | `--color-info-text` | `--color-info-border` |
| **Lead SLA State** | `WITHIN_SLA` | `--color-success-bg` | `--color-success-text` | `--color-success-border` |
| **Lead SLA State** | `DUE_SOON` | `--color-warning-bg` | `--color-warning-text` | `--color-warning-border` |
| **Lead SLA State** | `BREACHED` | `--color-error-bg` | `--color-error-text` | `--color-error-border` |
| **Lead SLA State** | `RESOLVED` | `--color-neutral-bg` | `--color-neutral-text` | `--color-neutral-border` |
| **Cost Sheet** | `DRAFT` | `--color-neutral-bg` | `--color-neutral-text` | `--color-neutral-border` |
| **Cost Sheet** | `ISSUED` | `--color-success-bg` | `--color-success-text` | `--color-success-border` |
| **Cost Sheet** | `SUPERSEDED` | `--color-neutral-bg` | `--color-neutral-text` | `--color-neutral-border` |
| **Cost Sheet** | `CONSUMED` | `--color-accent-50` | `--color-accent-700` | `--color-accent-200` |

---

# 5. Spacing, Grid & Content Dimensions

Base 4px increment scale for layout harmony.

```css
:root {
  /* ─── Spacing Scale ─── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ─── Structural Widths ─── */
  --width-sidebar:            240px;
  --width-sidebar-collapsed:  64px;
  --width-drawer-sm:          400px;
  --width-drawer-md:          560px;
  --width-drawer-lg:          720px;
  --width-drawer-xl:          960px;
  --width-modal-sm:           420px;
  --width-modal-md:           560px;
  --width-content-max:        1440px;
}
```

### Layout Grid Parameters

- **Page Horizontal Padding**: `--space-6` (24px) desktop; `--space-4` (16px) tablet/mobile.
- **Card Gutter**: `--space-5` (20px).
- **Section Vertical Gap**: `--space-8` (32px).
- **Table Row Height**: 52px fixed height; provides touch target safety and tabular alignment.
- **Form Field Gap**: `--space-4` (16px) vertical stacking.

---

# 6. Component Library

### 6.1 Buttons

| Variant | Purpose | Visual Tokens | Disabled State |
| :--- | :--- | :--- | :--- |
| **Primary** | Major affirmative action (`Call Lead`, `Place Hold`, `Create Booking`) | Solid `--color-accent-500`, white text, `--radius-md` | 50% opacity, `cursor: not-allowed` |
| **Secondary** | Supporting operations (`Reschedule`, `New Version`, `Export`) | White bg, `--color-border-default`, accent text | 50% opacity, gray border |
| **Ghost** | Table row actions, toolbar buttons | Transparent bg, `--color-text-secondary`, hover bg tint | 40% opacity |
| **Danger** | Destructive / irreversible commands (`Cancel Booking`, `Release Hold`) | `--color-error-bg`, `--color-error-text`, red border | 50% opacity |
| **Icon-Only** | Compact row utility (`Edit`, `Copy Link`, `More`) | 36×36px square, ghost base, tooltip on focus/hover | Disabled icon tint |

### 6.2 Form Inputs

- **Top Labels**: Form labels reside permanently above inputs (`--text-xs`, `--weight-medium`, `--color-text-secondary`). Never use floating labels (fails cognitive ergonomics during scanning).
- **Focus Rings**: Focused input gains `--color-border-focus` plus a 2px outer ring in `--color-accent-100`.
- **Field Validation**: Error message appears directly beneath input in `--text-xs`, `--color-error-text`, with input border switching to `--color-error-border`.

### 6.3 Dropdowns & Multi-Selects

- Native `<select>` used only for low-complexity 2–4 option choices.
- Filterable Popover used for entities with > 8 options (Assignees, Projects, Dispositions) with real-time text filter and keyboard arrow navigation.

### 6.4 Tables

- **Sticky Header**: `position: sticky; top: 0; background: var(--color-bg-secondary); z-index: var(--z-sticky)`.
- **Interactive Rows**: Row click slides open detail drawer. Hover applies subtle tint `--color-bg-secondary`.
- **Monospace Alignment**: All numbers, dates, IDs, and financial values right-aligned and rendered in `--font-mono`.

### 6.5 Badges & Pills

- Height: 22px; Radius: `--radius-full`; Padding: `0 8px`; Font: `--text-xs`, `--weight-medium`.
- Leading Status Dot (6×6px solid circle) where instant chromatic differentiation is critical.

### 6.6 Drawers (Slide-Over Sheets)

- Enter from right edge via 200ms ease-out.
- Backdrop with `--color-bg-overlay`.
- Structure: Sticky header (Title, Badge, Close 'X'), Scrollable content body, Sticky action footer.

### 6.7 Modals & Confirmation Dialogs

- Reserved for explicit business commands, destructive operations, or stage gate validations.
- Trap focus; backdrop click prohibited for destructive flows; `Escape` key cancels.

### 6.8 Steppers & Wizards

- Multi-step forms (e.g. Booking creation) render a horizontal progress bar with step number, title, and state (`completed`, `active`, `pending`, `error`). Prevents step jumping until validation passes.

---

# 7. Interaction Patterns & Explicit Command Transitions

### 7.1 Navigation Model

- **Sidebar**: Primary module navigation (collapsible from 240px to 64px icon rail).
- **Breadcrumbs**: Hierarchical paths (`Project > Phase > Sector > Plot B-12`).
- **Contextual Drawers**: Primary mechanism to inspect/edit without losing list scroll context or call state.

### 7.2 Data Interaction: Domain State ≠ Generic Inline Edit

> **CRITICAL ARCHITECTURAL DIRECTIVE**: Business state transitions are NEVER generic auto-save dropdowns.

In Ralix CRM, domain lifecycle transitions trigger downstream financial, concurrency, and compliance side-effects. The UI strictly bifurcates operations:

| Category | Interaction Model | Examples |
| :--- | :--- | :--- |
| **Simple Metadata** | Inline edit permitted (click → input → auto-save on blur with checkmark icon) | Lead budget range, preferred location note, secondary phone label, personal notes |
| **Domain Lifecycle Transition** | **Explicit Command Action** (Click command button → Validation check → Confirmation drawer/modal → Backend commit → Response update) | `Advance Lead Stage`, `Record Disposition`, `Mark Site Visit Complete`, `Assign Lead` |
| **Concurrency Asset State** | **Asynchronous Command Flow** (Click action → Immediate transition to progress state `Holding...` → Backend response → Confirmed state or conflict modal) | `Place Hold`, `Release Hold`, `Block Asset`, `Create Booking` |
| **Financial / Commercial Document** | **Versioned Command Flow** (Immutable document; click `Create New Version` → Draft builder → Validation → Issue) | `Issue Cost Sheet`, `Supersede Cost Sheet`, `Record Payment`, `Approve Discount` |

### 7.3 Kanban Drag-and-Drop Rules

The Kanban board provides pipeline visualization, but **drag/drop must never silently bypass backend business rules**:

```
[ User drags card: QUALIFIED -> SITE_VISIT ]
                  │
                  ▼
  UI checks local transition validity
                  │
        ┌─────────┴─────────┐
     Allowed?             Not Allowed
        │                   │
       Yes                  └── Card springs back immediately
        │                       Toast: "Direct skip to Site Visit requires scheduled visit"
        ▼
Is confirmation / precondition required? (e.g. Site Visit must exist)
        │
       Yes ──▶ Open "Schedule Site Visit to Advance Stage" Drawer
        │      (User fills visit details & confirms)
        ▼
Send command: POST /api/v1/leads/:id/stage
Card displays pulsing border: "Updating..."
        │
   ┌────┴──────────────────────────┐
200 OK                          409 CONFLICT / 422 ERROR
   │                               │
Card settles in new column      Card snaps back to original column
Toast: "Stage updated"          Actionable Error Modal: "Precondition failed: [Reason]"
```

- Drag/drop is an affordance to initiate a transition; the backend remains authoritative.
- Never optimistically settle a card before the HTTP 200 response returns.

### 7.4 Confirmation & Command Patterns (No Generic "Undo" for Holds)

- **Standard non-destructive action**: Inline feedback with auto-dismiss toast.
- **Reversible non-transactional action (e.g. archiving a filter preset)**: Toast with 5-second "Undo".
- **Inventory Hold / Commercial Action**: **GENERIC UNDO IS STRICTLY FORBIDDEN**.
  - Placing a hold acquires an exclusive database lock.
  - A hold is never "undone" via toast; it can only be explicitly released via an authoritative `Release Hold` command with capability gating.

### 7.5 Keyboard Shortcuts

| Key Binding | Global Scope Action |
| :--- | :--- |
| `/` or `Cmd+K` | Focus Global Omni-Search |
| `Escape` | Close top-most Drawer / Modal |
| `C` | Open Call Workstation (when Lead is selected) |
| `J` / `K` | Move selection down / up in Lead table |
| `Enter` | Open detail drawer for highlighted row |
| `?` | Display Keyboard Shortcut cheat-sheet modal |

---

# 8. User Personas & UX Modes

Ralix CRM adapts its information architecture based on the active user's role and capability profile defined in `ARCHITECTURE.md` §7.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER PERSONA UX MATRIX                          │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Persona            │ Default Landing    │ Core Operational UX Mode     │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Telecaller / CSE   │ Telecaller My Day  │ Continuous Calling Station   │
│ Sales Executive    │ Sales Dashboard    │ Opportunity & Visit Pipeline │
│ Inventory Manager  │ Inventory Layout   │ Asset Allocation & Controls  │
│ Organization Admin │ Admin Overview     │ "Attention Required" Center  │
│ Super Admin        │ Platform Console   │ Tenant Governance & Audit    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### 8.1 Telecaller / Customer Support Executive (CSE)

- **Job Function**: High-volume prospect engagement, first qualifying call, requirement discovery, visit scheduling.
- **Primary UX Goal**: Continuous calling with zero context switching. No navigating `List → Detail → Dial → Back → Follow-up`.
- **Permissions**: Scope: `SELF`. Capabilities: `LEAD_VIEW`, `LEAD_UPDATE`, `FOLLOWUP_CREATE`, `SITE_VISIT_SCHEDULE`, `INVENTORY_HOLD`. Masked phone numbers by default.

### 8.2 Sales Executive & Sales Manager

- **Job Function**: In-person site visits, negotiation, cost-sheet presentation, deal closure, team pipeline oversight.
- **Primary UX Goal**: Track qualified prospects, manage weekend visit schedules, issue quotes, initiate token bookings.
- **Permissions**: Scope: `SELF` (Exec) or `TEAM` (Manager). Capabilities: `LEAD_ASSIGN`, `SITE_VISIT_COMPLETE`, `COST_SHEET_GENERATE`, `BOOKING_CREATE`.

### 8.3 Inventory Manager

- **Job Function**: Inventory availability arbitration, hold lifecycle supervision, layout release management, pricing rules.
- **Primary UX Goal**: Instant visibility into unit/plot states, concurrency lock resolutions, block/release execution.
- **Permissions**: Scope: `PROJECT`. Capabilities: `INVENTORY_HOLD`, `INVENTORY_BLOCK`, `PLOT_UPDATE`, `PLOT_BLOCK`, `PLOT_RELEASE`, `PLOT_IMPORT` (Dual-Auth).

### 8.4 Organization Administrator

- **Job Function**: Operational health, SLA breach remediation, user provisioning, revenue ledger oversight, policy setup.
- **Primary UX Goal**: Actionable operational exception monitoring via the "Attention Required" command center.
- **Permissions**: Scope: `ORGANIZATION`. Capabilities: `USER_MANAGE`, `ROLE_MANAGE`, `PAYMENT_REFUND`, `ATTRIBUTION_MANAGE`, `AUDIT_VIEW`.

### 8.5 Platform Super Administrator

- **Job Function**: Multi-tenant isolation enforcement, system role governance, platform telemetry, break-glass audit.
- **Primary UX Goal**: Tenant provisioning, cross-organization support via audited break-glass procedures.
- **Permissions**: Scope: `GLOBAL`. Capabilities: System-wide with strict logging.

---

# 9. Shell & Global Navigation

```
+------------------------------------------------------------------------------------+
| [Logo] Ralix CRM   | Project: [Green Hills Township v] | Search (Cmd+K) | (Bell) [Avatar] |
+--------------------+-----------------------------------+----------------+-----------+
| OVERVIEW           |                                                                |
|   Dashboard        |   Page Header: Title + Primary Action Button                   |
|   My Day (CSE)     |   +----------------------------------------------------------+ |
| SALES              |   | Metric Strip / KPI Cards                                 | |
|   Today's Calls    |   +----------------------------------------------------------+ |
|   Leads            |   |                                                          | |
|   Follow-ups       |   | Main Workspace Area (Tables, Layout Maps, Workstations)  | |
|   Site Visits      |   |                                                          | |
| INVENTORY          |   |                                                          | |
|   Units            |   |                                                          | |
|   Plot Layout      |   |                                                          | |
| COMMERCIAL         |   +----------------------------------------------------------+ |
|   Cost Sheets      |                                                                |
|   Bookings         |                                                                |
|   Payments         |                                                                |
| ADMIN              |                                                                |
|   Attention Center |                                                                |
|   Audit Trail      |                                                                |
+--------------------+----------------------------------------------------------------+
| Org: Park Developers Pvt. Ltd. | Env: Production | v5.1.0-HARDENED                          |
+------------------------------------------------------------------------------------+
```

### 9.1 Top Bar Architecture (56px)

- **Left**: Product Logo + Tenant Project Switcher (scoped to authorized projects).
- **Center**: Global Omni-Search (`Cmd+K` or `/`) with category pill filters (`Leads`, `Plots`, `Bookings`, `Units`).
- **Right**: Notification Center (unread SLA breaches, incoming callbacks) and User Profile Menu (Active Role, Scope badge, Session Timeout indicator, Sign Out).

### 9.2 Sidebar Navigation Structure

Items are conditionally rendered based on user capabilities:

- **Overview**: Dashboard, Telecaller "My Day" (gated to CSE/Telecaller roles).
- **Sales Execution**: Today's Calls, Leads Pipeline, My Follow-ups, Site Visits.
- **Inventory Management**: Constructed Units (Tower/Floor matrix), Plotted Layouts (Interactive SVG Map), Projects.
- **Commercial & Finance**: Cost Sheets, Bookings, Payments Ledger.
- **Partners**: Channel Partners, Brokerage Attributions, Commission Payouts.
- **Governance**: Attention Required Center, Team Management, Roles & Scopes, Audit Trail.

---

# 10. Responsive Strategy & Device Adaptations

| Device Class | Viewport Range | Shell Behavior | Primary UI Adaptations |
| :--- | :--- | :--- | :--- |
| **Desktop** | ≥ 1280px | Full sidebar (240px), multi-pane workspaces | 3-column calling workstation; side-by-side plot layout & detail drawer. |
| **Compact Desktop** | 1024px – 1279px | Collapsed sidebar (64px icon rail) | 2-column layouts; drawers expand to 60% viewport width. |
| **Tablet** | 768px – 1023px | Off-canvas drawer sidebar via hamburger | Full-screen detail drawers; plot map enables touch pinch-to-zoom. |
| **Mobile** | < 768px | Bottom navigation bar (5 core items) | Stacked card view for leads; bottom sheet modal for post-call disposition. |

---

# 11. Authentication & Workspace Session Handling

### 11.1 Login Experience

- Centered, minimalist card (460px) on slate neutral background.
- Corporate SSO and standard email/password authentication.
- **Session Policy**: Revocable server-managed sessions with sliding idle expiration (30 minutes default). No persistent "Remember Me" checkboxes.

### 11.2 Multi-Organization Workspace Selector

For users with active memberships across multiple organizations:

```
+-----------------------------------------------------------+
|  Select Active Workspace                                  |
|  You hold authorized credentials in multiple developer orgs|
|                                                           |
|  [ Park Developers Pvt. Ltd.                            ] |
|    Role: Sales Manager  ·  Scope: TEAM (West Zone)        |
|                                                           |
|  [ Sunrise Infra Land Holdings                          ] |
|    Role: Inventory Controller  ·  Scope: PROJECT          |
+-----------------------------------------------------------+
```

### 11.3 Session Expiration & Re-Authentication UX

When session expires while a user is drafting a cost sheet or post-call notes:
- Instead of kicking user to `/login` and destroying draft state, a **Re-Authentication Modal** overlays the current screen:
  `"Session Expired due to inactivity. Enter password to resume without losing work."`
- On successful credentials check, session token refreshes and the user completes the pending submission.

---

# 12. Telecaller Experience & Calling Workstations

High-velocity calling workstation designed to eliminate page-to-page navigation.

### 12.1 Continuous Calling Workstation Philosophy

```
Traditional Anti-Pattern:
Lead List ──▶ Lead Detail ──▶ Click Dial ──▶ Back ──▶ Open Follow-up ──▶ Lead List
(5 page hops per prospect = 500 hops per day)

Ralix Continuous Calling Workstation:
[ Today's Calls Queue ] ──▶ [ Active Call HUD ] ──▶ [ Post-Call Disposition ] ──▶ [ Next Call Ready ]
(0 page hops; 100% focused workflow within a single integrated surface)
```

### 12.2 Telecaller "My Day" Operational Dashboard

```
+----------------------------------------------------------------------------------------+
| MY DAY  ·  Monday, 29 Sep 2026                               [ Start Continuous Queue ]|
+----------------------------------------------------------------------------------------+
| [ Calls Due: 34 ] [ Completed: 18 ] [ Callbacks: 6 ] [ Visits Today: 2 ] [ SLA Breaches: 1! ] |
+----------------------------------------------------------------------------------------+
| CALL QUEUE (PRIORITIZED)             | ACTIVE PROSPECT CONTEXT                          |
| [Filter: All v] [Sort: SLA Urgency v]| Amit Sharma  ·  +91 98•••• 4512  ·  Park Avenue  |
|                                      | Temp: [HOT]  ·  SLA: [DUE SOON: 18m]             |
| > Amit Sharma       Park Ave  [DIAL] | ------------------------------------------------ |
|   Due: 11:30 AM  ·  HOT · SLA: 18m   | REQUIREMENT: 2 BHK / 1200 Sq Ft / Budget: 75L    |
|                                      | LAST INTERACTION: Call 24 Sep: "Needs loan info" |
|   Priya Patel       Green H.  [DIAL] | ------------------------------------------------ |
|   Due: 12:00 PM  ·  WARM · SLA: OK   | NEXT ACTION: Call to confirm banker meeting      |
|                                      |                                                  |
|   Vikram Malhotra   Green H.  [DIAL] | [ DIAL NOW ]   [ OPEN FULL DETAIL DRAWER ]       |
+----------------------------------------------------------------------------------------+
```

- **Top KPI Strip**: Real-time counter of Calls Due, Completed Calls, Pending Callbacks, Scheduled Visits, and Imminent SLA Breaches.
- **Priority Attention Queue**: Highlights overdue calls and leads where `slaState = DUE_SOON` or `BREACHED`.
- **Integrated Context Rail**: Displays prospect requirement, historical interaction notes, and primary next action before dialing.

### 12.3 "Today's Calls" Operational Workspace

- Filterable by Project, Lead Source, Temperature, and Callback Slot (Morning, Afternoon, Evening).
- Immediate **[DIAL]** action button on every row triggers duplex click-to-call.
- Preserves table scroll position when call finishes; automatically advances selection to the next lead in queue.

### 12.4 "My Follow-ups" Workspace

Dedicated queue grouped into four distinct operational tabs:
1. **Overdue** (Red badge): Scheduled callback time has passed without recorded outcome.
2. **Due Today**: Scheduled callbacks partitioned by hourly slots.
3. **Upcoming**: Future scheduled touchpoints for the current week.
4. **Site Visit Follow-ups**: Prospects who attended a visit and require post-visit negotiation calls.

Quick Actions on each follow-up card: **[Call]**, **[Reschedule]**, **[Mark Complete]**, **[Open Lead]**.

---

# 13. Leads Module & Next Action Architecture

### 13.1 Leads List (Table View)

```
+------------------------------------------------------------------------------------+
| Leads (342 Active)                    [+ New Lead] [Export (Dual-Auth)] [Columns]  |
+------------------------------------------------------------------------------------+
| Search name, phone... | Stage: [All v] | Status: [All v] | Temp: [All v] | SLA: [All v] |
+------------------------------------------------------------------------------------+
| [ ] Name          Phone       Project     Stage       Status   Temp  SLA   Next Action |
| [ ] Amit Sharma   98••••4512  Park Ave.   QUALIFIED   ACTIVE   HOT   18m   Today 11:30 |
| [ ] Priya Patel   87••••9832  Green H.    SITE_VISIT  ACTIVE   WARM  OK    Tomorrow    |
| [ ] Rajesh Kumar  99••••1122  Sunrise     NEW         ACTIVE   COLD  BR!   Immediate   |
+------------------------------------------------------------------------------------+
```

- Phone numbers are masked by default (`98••••4512`). Unmasking requires `CUSTOMER_VIEW_UNMASKED` capability + organization setting (§26.3).
- SLA indicators: `OK` (Within SLA), `18m` (Due Soon countdown), `BR!` (Breached badge).

### 13.2 Leads Kanban View (Controlled Stage Gates)

Columns represent the linear commercial journey defined in `ARCHITECTURE.md` §10.3:
`NEW` → `CONTACTED` → `QUALIFIED` → `SITE_VISIT` → `NEGOTIATION` → `BOOKING` → `WON`.

- Each column displays active lead count and total pipeline value.
- Card dragging validates stage preconditions server-side:
  - Moving to `SITE_VISIT` requires an existing scheduled `SiteVisit` record.
  - Moving to `NEGOTIATION` requires completed site visit.
  - Moving to `BOOKING` requires active `InventoryHold` and issued `CostSheet`.
- **`LOST` and `CANCELLED`**:
  - `LOST` is accessible from any pre-conversion stage via an explicit "Disqualify / Mark Lost" command.
  - `CANCELLED` is reachable ONLY post-conversion from `WON` via authoritative `BookingCancelled` domain event. The UI never provides a manual "Mark Cancelled" button on a lead.

### 13.3 Lead Detail Drawer & "Next Action" Command Center

The top 30% of the Lead Detail drawer is dedicated to answering: **"What must I do right now to move this lead forward?"**

```
+-----------------------------------------------------------------------+
| Lead: Amit Sharma  (#LD-9824)                                    [ X ]|
| Assigned: Rajesh (Sales Exec)  ·  Project: Park Avenue                |
+-----------------------------------------------------------------------+
| NEXT ACTION: Scheduled Follow-up Call                                 |
| Due Today at 11:30 AM (In 18 minutes) · Response SLA: WITHIN_SLA     |
| [ DIAL PROSPECT ]   [ RESCHEDULE ]   [ COMPLETE ]   [ ADD NOTE ]      |
+-----------------------------------------------------------------------+
| FIVE-DIMENSIONAL SYSTEM STATE                                         |
| Lifecycle: [ QUALIFIED      v ] (Requires confirmation to advance)    |
| Status:    [ CALLBACK_PENDING ] (Authoritative from Follow-up)        |
| Temp:      [ HOT            v ] (Command transition)                  |
| SLA:       [ WITHIN_SLA       ] (Calculated by SLA engine)            |
| Dispos:    [ INTERESTED       ] (Derived from last call record)       |
+-----------------------------------------------------------------------+
| [Overview]  [Timeline & Calls]  [Visits]  [Cost Sheets]  [Documents]  |
+-----------------------------------------------------------------------+
```

### 13.4 Five-Dimensional State Presentation

The UI strictly renders the five independent dimensions specified in `ARCHITECTURE.md` §10.1:
1. **`lifecycleStage`**: Commercial stage (`NEW`, `CONTACTED`, `QUALIFIED`, `SITE_VISIT`, `NEGOTIATION`, `BOOKING`, `WON`, `CANCELLED`, `LOST`).
2. **`status`**: Operational condition (`ACTIVE`, `ON_HOLD`, `CALLBACK_PENDING`, `NO_RESPONSE`, `INVALID`, `DUPLICATE`, `CLOSED`).
3. **`temperature`**: Buyer intent level (`HOT`, `WARM`, `COLD`).
4. **`slaState`**: Response timer state (`WITHIN_SLA`, `DUE_SOON`, `BREACHED`, `RESOLVED`).
5. **`disposition`**: Reason/outcome from last interaction (`INTERESTED`, `BUDGET_ISSUE`, etc.).

---

# 14. Communication Center & Post-Call Workflow

### 14.1 Unified Communication Timeline

Chronological activity stream consolidating all prospect touchpoints:
- Telephony Call Records (Duration, Call Outcome, Telecaller Name, Audio Recording link if authorized).
- WhatsApp Conversations (Template deliveries, inbound inquiries, delivery receipts).
- Follow-up Schedules (Created, rescheduled, completed).
- Internal Collaboration Notes (Pinned notes, manager audit comments).

### 14.2 Click-to-Call & Masked Telephony UX (Knowlarity SuperReceptionist)

Telephony calls are bridged via **Knowlarity SuperReceptionist** (`sr.knowlarity.com`) using duplex MakeCall dispatch (§19.1):
1. When an agent clicks **[DIAL PROSPECT]** / **[Call Now]**:
   - Client dispatches `POST /api/v1/telephony/call` with `{ leadId }`.
   - Backend creates an immutable `CallAttempt` technical record and requests a duplex call via Knowlarity SuperReceptionist API (`https://sr.knowlarity.com/vr/call/makecall`).
   - Knowlarity rings the agent's phone/extension first, and bridges the customer upon pick-up with PII number masking.
2. A **Floating Call HUD** docks to the bottom-right corner:
   - Prospect Name, Masked Phone (`+91 98•••• 4512`), and Project.
   - Provider Status Indicator: `DIALING VIA KNOWLARITY` (amber pulse) → `LIVE CALL CONNECTED` (green pulse).
   - Live Call Timer (`00:42`).
   - Knowlarity SuperReceptionist pilot reference banner.
   - Mute / Keypad / Hang Up controls.
3. Post-call Call Detail Records (CDR) post automatically to `POST /api/webhooks/knowlarity` with call duration, terminal status (`CallAttemptStatus`), and encrypted audio recording URLs.

### 14.3 Post-Call Disposition Workflow

When the call terminates, the HUD immediately transitions into an inline **Post-Call Disposition Modal** without navigating away:

```
+---------------------------------------------------------------+
| Call Ended (Duration: 03m 14s)  ·  Amit Sharma                |
+---------------------------------------------------------------+
| 1. Select Disposition (Architecture Enum):                    |
|    (*) INTERESTED             ( ) CALLBACK_REQUESTED          |
|    ( ) BUDGET_ISSUE           ( ) LOCATION_ISSUE              |
|    ( ) NO_ANSWER              ( ) NOT_INTERESTED              |
|    ( ) PRODUCT_MISMATCH       ( ) OTHER...                    |
|                                                               |
| 2. Call Notes & Interaction Summary:                          |
|    [ Customer liked 2BHK layout. Requested morning site visit]|
|                                                               |
| 3. Immediate Next Action:                                     |
|    [X] Schedule Site Visit    [ ] Schedule Callback           |
|    Date: [ 2026-10-02 ]  Time: [ 11:00 AM ]  Agent: [ Rajesh ]|
|                                                               |
| [ SUBMIT DISPOSITION & SCHEDULE NEXT ACTION ]                 |
+---------------------------------------------------------------+
```

**Architecture Consistency Enforcement**:
- Dispositions strictly match `LeadDisposition` enum (`INTERESTED`, `NOT_INTERESTED`, `NO_RESPONSE`, `WRONG_NUMBER`, `INVALID_LEAD`, `DUPLICATE`, `BUDGET_ISSUE`, `LOCATION_ISSUE`, `PRODUCT_MISMATCH`, `COMPETITOR`, `FUTURE_REQUIREMENT`, `RENTAL_REQUIREMENT`, `INVESTMENT_REQUIREMENT`, `PURCHASED`, `LOST_TO_COMPETITOR`, `OTHER`).
- Cross-dimension side effects execute according to §10.2:
  - Choosing `CALLBACK_REQUESTED` automatically sets `Lead.status = CALLBACK_PENDING`.
  - Choosing `NO_ANSWER` or `BUSY` sets `Lead.status = NO_RESPONSE`.
  - First qualifying completed call resolves any breached SLA timer (`Lead.slaState = RESOLVED`).

---

# 15. Site Visits Module

### 15.1 Visit Calendar View

- Weekly calendar layout (Monday–Sunday) showing site visit allocations by project and sales representative.
- Status color coding: `SCHEDULED` (Info blue), `CONFIRMED` (Accent purple), `COMPLETED` (Success green), `NO_SHOW` (Error red), `CANCELLED` (Neutral gray).

### 15.2 Visit List View & Quick Outcome Actions

Table view featuring quick outcome buttons:
- **[Mark Completed]**: Opens outcome modal (Customer feedback, interest rating, unit discussed, next step: generate cost sheet). Automatically satisfies precondition to advance lead to `NEGOTIATION`.
- **[Mark No-Show]**: Records absence; prompts for immediate callback scheduling to salvage the prospect.
- **[Reschedule]**: Opens date/time picker; updates `SiteVisit.status = RESCHEDULED`.

---

# 16. Constructed Inventory (Units) & Hold Workflow

### 16.1 Tower/Floor Matrix View

Tabular architectural elevation matrix:

```
Park Avenue  >  Tower A                     [ Elevation Grid ]  [ Table View ]
+----------------------------------------------------------------------------+
| Floor 14 | [ A-1401 AV ]  [ A-1402 HLD ]  [ A-1403 AV ]   [ A-1404 SLD ]   |
| Floor 12 | [ A-1201 AV ]  [ A-1202 AV  ]  [ A-1203 BKG ]  [ A-1204 AV  ]   |
| Floor 11 | [ A-1101 SLD]  [ A-1102 SLD ]  [ A-1103 AV  ]  [ A-1104 BLK ]   |
+----------------------------------------------------------------------------+
Legend: AV=Available  HLD=On Hold  BKG=Booking in Progress  SLD=Sold  BLK=Blocked
```

### 16.2 Unit Detail Drawer

Displays carpet area, super built-up area, floor-rise premium, current availability status, and hold countdown timer. Action buttons gated by capability: **[Place Hold]**, **[Generate Cost Sheet]**, **[Block Unit]**.

### 16.3 Explicit Unit Hold Lifecycle

Hold acquisition is an asynchronous, concurrency-sensitive transaction.

```
[ Available Unit ]
       │
       ▼  User clicks [ Place Hold ]
[ Holding... ] ──▶ Button disabled, spinner active;
       │           UI sends POST /api/v1/inventory/holds (unitId)
       │
  ┌────┴──────────────────────────┐
200 OK                         409 CONFLICT
  │                               │
[ ON HOLD ]                    [ Conflict Dialog ]
- Held By: Current User        "Unit A-1402 was just held by Priya P.
- Expire: 47m 59s (live timer)  at 11:32:04. Inventory state refreshed."
- [ Release Hold ] button       Availability updates to ON_HOLD; button disabled.
```

---

# 17. Plotted Development Inventory & Interactive Map

Supports land plotting, NA plotted colonies, and township sectors per `ARCHITECTURE.md` §13.B.

### 17.1 Interactive SVG Plot Layout Map

```
+----------------------------------------------------------------------------+
| Green Hills Township  >  Phase 1  >  Sector B         [ Map ] [ List ]     |
+----------------------------------------------------------------------------+
|  [Zoom +] [Zoom -] [Reset] | Filter: Facing [East v] Area [1500-2400 v]    |
|----------------------------------------------------------------------------|
|    +---------+  +---------+  +---------+       +---------+  +---------+    |
|    | Plot 01 |  | Plot 02 |  | Plot 03 |       | Plot 04 |  | Plot 05 |    |
|    |  [ AV ] |  |  [HLD]  |  |  [ AV ] |       |  [BLK]  |  |  [SLD]  |    |
|    +---------+  +---------+  +---------+       +---------+  +---------+    |
|    ========================= 40 FT MAIN BOULEVARD ========================= |
|    +---------+  +---------+  +---------+       +----------------------+    |
|    | Plot 06 |  | Plot 07 |  | Plot 08 |       | [ CIVIC AMENITY ]    |    |
|    |  [ AV ] |  |  [ AV ] |  |  [BKG]  |       | Non-Saleable Parcel  |    |
|    +---------+  +---------+  +---------+       +----------------------+    |
+----------------------------------------------------------------------------+
```

### 17.2 Separation of Plot Dimensions (Critical Architectural Invariant)

The UI **NEVER collapses plot attributes into a single generic "Status" field**. The interface presents four distinct, independent dimensions:

1. **Commercial Availability**: `AVAILABLE`, `ON_HOLD`, `BOOKING_IN_PROGRESS`, `BOOKED`, `SOLD`, `BLOCKED`.
2. **Regulatory Legal Status**: `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `MARKETABLE`, `BOOKABLE`, `REGISTRATION_ELIGIBLE`, `SUSPENDED`.
3. **Registration Conveyance State**: `AGREEMENT_PENDING`, `AGREEMENT_EXECUTED`, `REGISTRATION_PENDING`, `REGISTERED`, `POSSESSION_HANDOVER`.
4. **Classification**: `SALEABLE_PLOT`, `ROAD_NETWORK`, `PARK_OPEN_SPACE`, `CIVIC_AMENITY`, `COMMERCIAL_PARCEL`, `UTILITY_RESERVED`.

> **Safety Rule**: If a plot is `AVAILABLE` commercially but its regulatory status is `UNDER_REVIEW` or `SUSPENDED`, the **[Place Hold]** and **[Create Booking]** actions are hard-disabled with the tooltip: *"Cannot transact: Regulatory approval pending"*.

### 17.3 Plot Map Operational UX (Multi-Modal Indicators)

To ensure WCAG AA compliance and instant clarity, plot states do not rely solely on color:
- **Pattern Hatching**: Non-saleable parcels (roads, parks) render with diagonal stripes.
- **Icon Badges**: Corner plots display a distinct 📐 corner badge; major road-facing plots display a 🛣️ icon.
- **Text Labels**: Plot ID and commercial code (`AV`, `HLD`, `BKG`, `SLD`, `BLK`) rendered directly inside SVG polygons.
- **Keyboard Navigation**: Arrow keys move focus across adjacent plots; `Enter` opens Plot Detail Drawer.

### 17.4 Plot Detail Drawer (Large — 720px)

- **Physical Characteristics**: Area (with unit switcher: Sq. Ft / Sq. Yards / Guntha), Frontage, Depth, Facing, Road Width.
- **Commercial Breakdown**: Base rate per sq. ft, Corner premium surcharge, Development charges, Infrastructure charges, Indicative Agreement Value.
- **Legal & Land Title Documentation**: Tabular list of attached legal documents (7/12 Extract, Layout Sanction, NA Order, RERA Certificate) with verification status badges.

### 17.5 Plot Bulk Import Pipeline

Multi-step transactional import wizard for ingesting thousands of layout plots:
1. **File Ingestion**: Drag-and-drop CSV/Excel template with schema guidelines.
2. **Pre-flight Validation Table**: Displays valid rows, syntax errors, and duplicate plot numbers highlighted in red.
3. **Transactional Commit**: Backend processes import atomically inside an audit log.

---

# 18. Inventory Concurrency & Locking UX Rules

### 18.1 Concurrency Rules & Advisory Display

- **Rule 1**: UI inventory state is strictly **advisory**. Availability can change while the screen is open.
- **Rule 2**: Backend is **authoritative**. A hold or booking is only acquired when the server commits the transaction against PostgreSQL's partial unique index.
- **Rule 3**: **No Optimistic Success**. The UI must display an intermediate `Holding...` state. It must never prematurely display `ON_HOLD` or `BOOKED` before the HTTP response arrives.
- **Rule 4**: **Duplicate Click Prevention**. The UI automatically disables the action button and shows a spinner immediately upon click to prevent race condition storms.

### 18.2 Conflict Resolution & State Refresh UX

When another user acquires a hold milliseconds earlier, the backend returns `409 CONFLICT` with the current asset payload.
- The UI immediately presents a **Concurrency Conflict Modal**:
  ```
  +---------------------------------------------------------+
  | Inventory No Longer Available                           |
  | Unit A-1202 was locked by Vikram (West Team) 4s ago.    |
  | Status: ON_HOLD  ·  Expires in: 59m 56s                 |
  |                                                         |
  | [ Refresh Inventory View ]                              |
  +---------------------------------------------------------+
  ```
- Clicking **[Refresh]** closes the modal and updates the local layout state immediately.

### 18.3 Hold Expiry & Release Controls

- Active holds render a countdown timer (`47:12`).
- When the timer reaches `00:00`, the asset border pulses and transitions to an expired state pending background release.
- An authorized user or inventory manager can click **[Release Hold]** with an explicit reason prompt, instantly unlocking the asset for the team.

---

# 19. Cost Sheets & Versioning Architecture

### 19.1 Cost Sheet Generator Drawer

Step-by-step drawer for computing commercial quotes:
- **Step 1**: Target Asset Selection (Constructed Unit or Plotted Land).
- **Step 2**: Automated Calculation from Active `PricingRuleVersion` (Base price, floor rise / road width premium, PLC, infrastructure charges).
- **Step 3**: Discount Allocation (Subject to role-based cap; discounts > 2% require Manager/Admin approval per §7.7).
- **Step 4**: Statutory Taxes (GST, Stamp Duty, Registration, Maintenance Deposit).
- **Step 5**: Review & Issue.

### 19.2 Immutability & Versioning UX

> **CRITICAL RULE**: An issued cost sheet is IMMUTABLE. The UI never provides an "Edit" button on an issued sheet.

```
+-----------------------------------------------------------------------+
| Cost Sheet #CS-2026-0847  ·  Version 2                       [ ISSUED ]|
| Lead: Amit Sharma  ·  Plot: B-03 (Green Hills Township)                |
+-----------------------------------------------------------------------+
| Version History:                                                      |
| [v1: Rs 35,50,000 - SUPERSEDED]  -->  [v2: Rs 34,25,000 - CURRENT]    |
|                                                                       |
| Commercial Snapshot:                                                  |
| Base Land Value (1,200 sq ft @ Rs 2,500):             Rs 30,00,000    |
| Location Premiums (Corner Plot + 40ft Road):          Rs  2,00,000    |
| Infrastructure & Development Charges:                 Rs  2,25,000    |
| Agreement Value:                                      Rs 34,25,000    |
| Taxes & Registration (Stamp Duty 6% + GST):           Rs  2,74,000    |
| Total All-Inclusive Value:                            Rs 36,99,000    |
+-----------------------------------------------------------------------+
| [ CREATE NEW VERSION (v3) ]    [ DOWNLOAD SIGNED PDF ]    [ PROCEED TO BOOKING ] |
+-----------------------------------------------------------------------+
```

- Clicking **[Create New Version]** forks the current snapshot into a new `DRAFT` (v3).
- The prior version is marked `SUPERSEDED` once the new version is officially issued.

---

# 20. Booking Workflow & Six-Step Stepper

Booking creation follows a strict six-step linear stepper:

```
[ 1. Customer ] ──▶ [ 2. Asset ] ──▶ [ 3. Cost Sheet ] ──▶ [ 4. Commercial ] ──▶ [ 5. Token Payment ] ──▶ [ 6. Confirmation ]
```

### 20.1 Stepper Execution Details

1. **Customer Verification**: Confirm KYC details, primary applicant name, contact info, PAN, Aadhaar.
2. **Inventory Asset Confirmation**: Select Unit XOR Plot. Validates that the asset is currently in `ON_HOLD` or `AVAILABLE`.
3. **Cost Sheet Binding**: Select an active `ISSUED` or `APPROVED` Cost Sheet. Automatically snapshots pricing.
4. **Commercial Milestone Schedule**: Choose payment plan (Construction-Linked Plan for Units; Land Registration Schedule for Plots).
5. **Token Payment Record**: Record initial booking deposit (Cheque / NEFT / Gateway Transaction Reference).
6. **Confirmation Review**: Full summary sheet. Clicking **[Confirm & Issue Booking]** initiates the atomic backend transaction.

### 20.2 Downstream Cancellation UX

When a confirmed booking is cancelled:
- Triggered exclusively via capability-gated **[Cancel Booking]** command modal with required reason entry.
- The UI informs the user of cascading downstream effects:
  - Inventory availability resets to `AVAILABLE`.
  - Future payment milestones are voided.
  - Linked `Lead.lifecycleStage` transitions from `WON` to `CANCELLED` and `status = CLOSED`.
  - Compensating refund workflow initiated in Finance module.

---

# 21. Payments, Ledger & Financial Integrity

### 21.1 Payments Ledger & Audit Listing

Tabular view of all incoming collections and outgoing refunds:
- Fields: Payment Reference ID, Booking ID, Customer Name, Amount (Monospace), Type (`TOKEN`, `MILESTONE`, `REFUND`), Method (`NEFT`, `UPI`, `CHEQUE`), Status (`SUCCEEDED`, `PROCESSING`, `REFUNDED`), Timestamp.

### 21.2 Payment Recording Drawer

Slide-over sheet to log milestone collections:
- Validates that entered amount does not exceed milestone balance.
- Requires transaction reference, bank clearing date, and proof-of-payment document upload.

### 21.3 Refund Handling: Compensating Payment Records

Per `ARCHITECTURE.md` §17.4, **settled payment records are never edited or deleted**.
- Issuing a refund creates a **new compensating Payment record** linked via `reversalOfPaymentId`.
- The UI ledger renders the original payment and the corresponding negative/refund entry side-by-side.

---

# 22. Channel Partners & Attributions

### 22.1 Partner Directory & Profile

- Directory of registered RERA channel partners with active brokerage tiers.
- Individual CP profile displays active lead attributions, conversion velocity, and total commission ledger.

### 22.2 Lead Attribution & Commission Payouts

- Leads originating from CPs show a persistent **[CP: Partner Name]** badge.
- Payout approval workflow: `PENDING_APPROVAL` → `APPROVED` → `PROCESSED`.
- Approvals require `COMMISSION_APPROVE` capability.

---

# 23. Admin Operations & "Attention Required" Center

The Admin Overview is not merely an analytical dashboard—it functions as an **Operational Command Center**.

```
+----------------------------------------------------------------------------------------+
| ATTENTION REQUIRED CENTER  ·  Park Developers Pvt. Ltd.                 [ Live Sync ]  |
+----------------------------------------------------------------------------------------+
| CRITICAL (3)                                                                           |
| [!] 4 Leads Breached First-Response SLA (SLA Window > 30 mins)          [ Reassign ]   |
| [!] 2 Unassigned Meta Leads in Queue > 15 mins                          [ Assign Now ] |
| [!] 1 Payment Reconciliation Discrepancy (Gateway vs Ledger)           [ Reconcile ]  |
|                                                                                        |
| WARNING (5)                                                                            |
| [w] 7 Overdue Scheduled Follow-ups in West Zone Team                    [ View List ]  |
| [w] 2 Expired Unit Holds Pending Release Confirmation                   [ Audit Hold ] |
| [w] 1 Cost Sheet Awaiting Discount Approval (Discount: 3.5%)            [ Review CS ]  |
+----------------------------------------------------------------------------------------+
| REAL-TIME OPERATIONAL METRICS                                                          |
| Active Pipeline: 247 Leads · Available Plots: 34 · Available Units: 82 · Total Collected: 4.2 Cr |
+----------------------------------------------------------------------------------------+
```

Each item provides a direct, actionable link to resolve the operational block without manual searching.

---

# 24. Audit Trail & Compliance Viewer

Immutable record of all business and security events:
- Read-only table filterable by Actor, Entity Type (`Lead`, `Plot`, `Booking`, `Payment`), Action, and Date.
- Row expansion displays **Before vs After JSON diff** highlighting modified keys.
- Requires `AUDIT_VIEW` capability.

---

# 25. Reports & Analytics

- **Pipeline Funnel**: Conversion drop-off across lifecycle stages.
- **SLA Adherence**: Response times and breach percentages by sales agent and team.
- **Inventory Velocity**: Absorption rate of units and land plots by phase/tower.
- **Financial Collections**: Actual vs Projected milestone collections.
- **Export Guard**: Bulk data exports trigger dual-authorization verification and security logging.

---

# 26. Security UX & Data Governance

### 26.1 Capability-Aware Action Presentation

The frontend consults the user's authorized capability set to adjust UI presentation:
- **Missing Read Capability**: The entire navigation link and module view are hidden.
- **Missing Action Capability (e.g. `BOOKING_CANCEL`)**: The button is either omitted entirely or rendered in a disabled state with an explanatory tooltip (`"Requires ORG_ADMIN capability"`).
- **Backend Is Always Authoritative**: UI hiding is a UX affordance. The backend independently verifies capabilities on every HTTP request.

### 26.2 Scope-Aware Data Boundaries

Lists, tables, and metric cards automatically filter content based on the user's active scope (`SELF`, `TEAM`, `PROJECT`, `ORGANIZATION`, `GLOBAL`).
- CSEs only see their assigned leads.
- Managers see leads assigned to their active team.
- Inventory managers see plots and units in their authorized projects.

### 26.3 PII Masking & Unmasking UX

Phone numbers and personal emails are masked by default (`98••••1234`).
- An authorized user with `CUSTOMER_VIEW_UNMASKED` capability can click a reveal eye icon 👁️ to view raw contact info.
- The unmasking event is logged to the server audit trail with timestamp and reason.

---

# 27. Error Handling for Business Transactions

The UI provides specific, actionable error states rather than generic alert popups:

| Failure Mode | HTTP Code | UI Presentation & Recovery Action |
| :--- | :--- | :--- |
| **Permission Denied** | `403 Forbidden` | Clean banner: *"You do not have permission to execute this operation. Contact your organization administrator."* |
| **Outside Scope** | `403 / 404` | Standard *"Record not found"* presentation to prevent cross-tenant enumeration. |
| **Field Validation** | `422 Unprocessable` | Field-level red error labels beneath input fields; form focuses on first invalid input. |
| **State Conflict** | `409 Conflict` | Conflict modal: *"This asset was modified by another user while you were viewing it."* Provides immediate **[Refresh]** button. |
| **Concurrency Failure** | `409 Conflict` | Hold rejection: *"This inventory is no longer available."* Refreshes grid automatically. |
| **Session Expired** | `401 Unauthorized` | Overlaid Re-Authentication modal; allows re-login without losing form state. |
| **Ambiguous In-Flight Network Drop** | Network Drop | *"Request status unknown. Do not re-submit. Checking transaction status with server..."* Provides **[Check Status]** button rather than blind re-submission. |

---

# 28. Accessibility Standards (WCAG 2.1 AA)

- **Contrast Ratios**: Minimum 4.5:1 for body copy; minimum 3.0:1 for large headers and status badges.
- **Keyboard Navigation**: Complete keyboard navigability across all interactive elements, table rows, and SVG plot maps. Visible focus rings (`--color-border-focus`).
- **Screen Reader Support**: Semantic HTML tags (`<nav>`, `<main>`, `<aside>`, `<header>`), ARIA labels on all icon buttons (`aria-label="Call lead"`), and `aria-live` regions for toast alerts.
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by disabling CSS transitions and easing animations.

---

# 29. Performance Targets & Core Web Vitals

| Performance Metric | Production Target | Architectural Enforcement |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | < 1.2s | Server components, minimal bundle size, system font fallbacks |
| **Largest Contentful Paint (LCP)** | < 2.0s | Optimized SVG plot rendering, deferred modal scripts |
| **Cumulative Layout Shift (CLS)** | < 0.05 | Fixed-height skeletons for tables and metric strips |
| **Time to Interactive (TTI)** | < 2.8s | Code splitting per workspace route |
| **Table Pagination Latency** | < 200ms | SWR/React Query caching of page queries |
| **Omni-Search Response** | < 300ms | Client-side debounce (250ms) + indexed backend search |

---

# 30. Empty States & Zero-Data UX

Every list, queue, and workspace includes an informative, branded empty state:
- **No Leads**: *"No active leads in your queue. Ingest a batch or wait for round-robin assignment."* + **[+ Create Lead Manually]** button.
- **No Calls Due Today**: *"You're all caught up! Zero calls pending for today."* + Illustration + **[Review Upcoming Follow-ups]** button.
- **No Holds Active**: *"No inventory currently on hold for your team."* + **[Explore Available Inventory]** button.

---

# 31. Implementation Order & Phased Roadmap

A dependency-aware, phased sequence ensuring foundational stability before commercial workflows:

```
Phase 1: Foundation & Primitives (Tokens, Typography, Component Library, Base Styles)
   │
Phase 2: App Shell, Authentication & Multi-Tenant Session Handling
   │
Phase 3: Lead Operations & Telecalling (My Day, Today's Calls, Calling Workstation, Dispositions)
   │
Phase 4: Site Visits Module (Calendar, List, Outcome Check-in)
   │
Phase 5: Inventory Engine (Constructed Grid, Interactive SVG Plot Map, Hold Concurrency)
   │
Phase 6: Commercial & Finance (Versioned Cost Sheets, 6-Step Booking Stepper, Payments Ledger)
   │
Phase 7: Channel Partners & Attributions
   │
Phase 8: Admin Operational Command Center ("Attention Required", Roles/Scopes, Teams)
   │
Phase 9: Compliance, Audit Trail & Analytics Reporting
   │
Phase 10: Production Hardening (Accessibility QA, Concurrency Chaos Testing, Mobile Performance)
```

---

# 32. UX Acceptance Criteria

### 1. Telecaller Experience
- [ ] Telecaller can open "My Day" and see prioritized call queue within 1.5 seconds.
- [ ] Telecaller can initiate call, record post-call disposition, and schedule callback without navigating across multiple pages.
- [ ] Post-call dispositions strictly reflect `LeadDisposition` architecture enums.

### 2. Lead Operations
- [ ] Lead detail clearly separates and renders all five dimensions (`lifecycleStage`, `status`, `temperature`, `slaState`, `disposition`).
- [ ] Domain lifecycle transitions require explicit command actions; no generic inline auto-saves on lifecycle stages.
- [ ] Kanban card dragging validates stage preconditions and awaits backend confirmation before moving.

### 3. Inventory & Hold Concurrency
- [ ] Placing a hold displays an immediate intermediate `Holding...` state.
- [ ] Under no circumstances is a hold optimistically marked `ON_HOLD` before the server responds 200 OK.
- [ ] When a 409 Conflict occurs, the UI displays the conflict modal and refreshes the asset state.
- [ ] No generic "Undo" toast is provided for inventory holds; holds can only be released via explicit command.

### 4. Plotted Development Layout
- [ ] SVG map displays plots, blocks, roads, and non-saleable civic amenities clearly.
- [ ] Plot Commercial Availability is visually and functionally separate from Regulatory Status and Conveyance State.
- [ ] Non-color indicators (labels, icons, patterns) allow full accessibility without relying solely on color.

### 5. Cost Sheets & Bookings
- [ ] Issued cost sheets are immutable. "Edit" is prohibited; only "Create New Version" is permitted.
- [ ] Booking creation follows the six-step stepper with prerequisite validation.
- [ ] Booking cancellation initiates cascading downstream updates and displays refund status.

### 6. Admin & Security UX
- [ ] "Attention Required" center highlights SLA breaches, unassigned leads, and inventory conflicts with one-click resolution links.
- [ ] UI strictly adapts action visibility to authorized capabilities and scopes without usurping backend authority.
- [ ] Sensitive PII (phone/email) is masked by default and unmasked only with explicit capability logging.

---

# 33. V2 Change Summary

This specification upgrades `UI.md` from v1.0.0 to **v2.0.0-PRODUCTION**:

1. **User Personas & UX Modes (§8)**: Added dedicated UX modes for Telecaller/CSE, Sales Executive, Inventory Manager, Org Admin, and Platform Super Admin.
2. **Telecaller Calling Workstation (§12)**: Designed zero-navigation calling experience with "My Day" dashboard, "Today's Calls" queue, and "My Follow-ups" workspaces.
3. **Post-Call Workflow (§14)**: Added integrated post-call modal with strict `LeadDisposition` enum alignment and automatic cross-dimension side effects.
4. **Next Action Architecture (§13.3)**: Prominently exposed the primary immediate operational action on Lead Detail drawers.
5. **Explicit Command Transitions (§7.2)**: Eliminated generic inline auto-saves on domain lifecycle states; implemented explicit command actions.
6. **Kanban Backend Validation (§7.3)**: Made Kanban drag-and-drop strictly backend-authoritative with precondition checks and spring-back error recovery.
7. **Removal of Generic Hold Undo (§7.4)**: Removed generic undo toast on concurrency-sensitive inventory transactions.
8. **Inventory Concurrency & Locking UX (§18)**: Specified advisory availability rules, the intermediate `Holding...` state, and conflict recovery dialogs.
9. **Plotted Dimension Separation (§17.2)**: Strictly decoupled Commercial Availability from Regulatory Status, Conveyance State, and Classification.
10. **Multi-Modal Plot Map (§17.3)**: Added hatching patterns, icons, labels, and keyboard navigation to the SVG layout map.
11. **Cost Sheet Immutability & Versioning (§19)**: Implemented explicit versioning (`DRAFT` → `ISSUED` → `SUPERSEDED`) with "Create New Version" workflow.
12. **Six-Step Booking Stepper (§20)**: Replaced monolithic booking form with an authoritative 6-step progress wizard.
13. **Admin "Attention Required" Command Center (§23)**: Transformed Admin dashboard into an actionable operational exception center.
14. **Security UX & PII Masking (§26)**: Added capability-aware action presentation, scope data containment, and phone masking rules.
15. **Business Transaction Error Handling (§27)**: Detailed UI recovery flows for permission denials, state conflicts, concurrency collisions, and dropped network requests.
16. **Implementation Order & Acceptance Criteria (§31, §32)**: Formulated a 10-phase dependency-aware roadmap and rigorous UX acceptance criteria.

---

## Document End

**Ralix CRM — UI.md v2.0.0-PRODUCTION · Approved Architecture Specification**
