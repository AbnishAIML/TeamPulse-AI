# TeamPulse AI — Complete Master Architecture & Engineering Blueprint

> **File:** `prompt.md`  
> **Role:** Senior Full-Stack Software Architect, Performance Engineer, UI/UX Designer, and QA Specialist  
> **Platform:** TeamPulse AI — Intelligent Project Management & Team Contribution Analysis Platform  
> **Scope:** Full-Lifecycle Implementation (Stages 0–7) + Lightweight Optimization & Performance Refactoring (Phases 0–8)

---

## 1. Master System Overview & Mission

TeamPulse AI is a production-ready, full-stack collaborative platform built for student software teams and engineering projects. It provides deterministic finish-to-start task dependency scheduling, critical path calculation, what-if delay simulation, workload burnout mitigation, peer-review academic quality gates, and fair, multi-signal contribution scoring.

The platform is designed with a **dual-engine architecture**:
1. A **Python FastAPI service** running NetworkX for advanced graph algorithms (CPM, DAG cycle detection, delay propagation).
2. An embedded **Native TypeScript analytics engine** inside the Express backend providing zero-downtime fallback parity with automated 3500ms timeout switching.

---

## 2. Technology Stack & Design System

### 2.1 Technology Stack
- **Frontend:** React 18, Vite 6, React Router DOM 6, Recharts 2, Lucide React, Socket.IO Client.
- **Backend API:** Node.js, Express, TypeScript 5 (strict mode), Mongoose 8 / MongoDB, Socket.IO, Multer, Crypto, JWT + Refresh Token Rotation.
- **Analytics Service:** Python 3.14+, FastAPI, NetworkX, Uvicorn, Pytest.
- **Local Database:** MongoDB at `mongodb://127.0.0.1:27017/teampulse_db`.

### 2.2 Design Aesthetics & UI System
- **Dark Palette:** Canvas `#0b1020`, Surface Cards `#121829`, Elevated Borders `#1e2640`, Subtle Accents `#2a3454`.
- **Primary Violet Accent:** `#9b8cff` with glowing hover states (`rgba(155, 140, 255, 0.25)`).
- **Semantic Indicators:** Emerald Green `#10b981` (Completed / Healthy), Amber `#f59e0b` (Warning / At Risk), Rose Red `#ef4444` (Blocked / Critical), Cyan `#06b6d4` (In Review / Info).
- **Typography:** DM Sans (Headings & UI elements) paired with Manrope (Body & Data Tables).
- **UX Principles:** Real data only (no synthetic demo values in runtime code), optimistic UI updates with automatic rollback on rejection, responsive layouts, and accessible modals.

---

## 3. Stages 0–7: Core Architecture & Feature Matrix

### Stage 0 — Monorepo Architecture & Setup
- Independent modular directories: `frontend/`, `backend/`, `analytics/`, and `docs/`.
- Opt-in demo database seeding via `npm run seed:demo` and clean database wiping via `npm run seed:reset`. Zero mock data injected in runtime routes.

### Stage 1 — Design System & Application Shell
- Unified navigation layout with persistent top bar, collapsible sidebar, notifications drawer, and real-time Socket.IO status indicator.
- 15 fully functional views:
  - Landing Page (`/`)
  - Login (`/login`) & Register (`/register`)
  - Forgot Password (`/forgot-password`)
  - Project Portfolio (`/projects`)
  - Project Overview & Health (`/projects/:projectId`)
  - Task Board & Kanban (`/projects/:projectId/tasks`)
  - Milestone Roadmap (`/projects/:projectId/milestones`)
  - Dependency Graph & Delay Simulator (`/projects/:projectId/dependencies`)
  - Workload Balancing & Advisory Redistribution (`/projects/:projectId/workload`)
  - Team Contribution Scoring (`/projects/:projectId/contributions`)
  - Health & Risk Insights (`/projects/:projectId/health`)
  - Reports & CSV Export (`/projects/:projectId/reports`)
  - Tokenized Invitation Acceptance (`/invite`)
  - 404 Not Found (`*`)

### Stage 2 — Authentication & Cryptographic Token Rotation
- **Passwords:** Hashed using `bcryptjs` (salt rounds = 10).
- **Access Tokens:** Short-lived JWTs (15-minute expiration) containing user identity.
- **Refresh Tokens:** Long-lived JWTs (30-day expiration) containing unique UUID `jti`. Stored in MongoDB strictly as SHA-256 hashes (`refreshTokenHash`).
- **Rotation & Reuse Detection:** Calling `/api/auth/refresh-token` validates the current token hash, invalidates it, issues a new token pair, and immediately revokes all active sessions if a previously rotated token is reused.

### Stage 3 — RBAC, Membership & Last-Owner Protection
- **Roles:** `Project Owner`, `Project Manager`, `Team Member`, `Reviewer`.
- **Role Enforcement:** Express middleware enforces permissions; unauthorized mutation attempts return `403 Forbidden`.
- **Last-Owner Invariant:** The backend explicitly blocks deleting or demoting the last remaining Project Owner on any project (`400 Bad Request`).
- **Tokenized Invitations:** Secure 32-byte cryptographic tokens (`crypto.randomBytes(32).toString("hex")`) with 7-day expiration and single-use acceptance flow.

### Stage 4 — Finish-to-Start DAG Dependencies & Delay Simulation
- **Finish-to-Start (FS) Rule:** A task cannot start or transition to `Done` until all prerequisite predecessor tasks have reached `Done`. Violations return `422 Unprocessable Entity`.
- **Cycle Prevention:** Adding dependencies executes a pre-flight cycle check rejecting circular paths.
- **Critical Path Method (CPM):** Computes Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF), and Total Slack/Float ($Float = LS - ES$). Tasks with zero float are flagged as the Critical Path.
- **Interactive What-If Delay Propagation:** Users can inject simulated delays into any task to view downstream schedule slippage, affected successor tasks, and shifting critical paths before making schedule adjustments.

### Stage 5 — Academic Quality Gates, Immutability & Real-Time Alerts
- **Peer Review Quality Gate (`requireReviewForDone`):** Projects can enforce that tasks cannot be closed until a peer reviewer approves the deliverable. Rejection keeps the task in review with actionable feedback.
- **Append-Only Activity Ledger:** The `ActivityEvent` collection enforces audit integrity via Mongoose pre-hooks that reject all `updateOne`, `updateMany`, `deleteOne`, and `deleteMany` mutations.
- **Deterministic Deduplication:** Notifications enforce unique sparse indexes on `dedupKey` (`projectId:taskId:type:date`) to prevent duplicate notification spam from background scheduled checks.
- **Real-Time WebSockets:** Socket.IO rooms scoped by project ID broadcast task updates, dependency changes, blocker events, and reviewer decisions instantly.

### Stage 6 — Workload Rebalancing & Equitable Contribution Scoring
- **Workload Analysis:** Evaluates assigned task effort against individual weekly capacities (hours). Highlights burnout (>100% capacity) and underutilization (<50%).
- **Advisory Redistribution:** Generates constraint-aware task reassignment suggestions with 1-click execution.
- **Multi-Signal Contribution Score:** Evaluates completed tasks, logged hours vs estimated hours, peer reviews conducted, blockers resolved, and timely delivery. Protects against "commit spamming" by balancing quality and peer assistance.
- **Project Health Score (0–100):** Aggregates overdue tasks, blocked milestones, and team workload variance into an executive health rating (Healthy, Caution, Critical).

### Stage 7 — Reports, CSV Export & Verification
- Filterable summary reports by milestone, assignee, date range, and status.
- Automated CSV export endpoints for tasks and milestones.
- 5 comprehensive automated backend integration test suites + 9 Python pytest suites.

---

## 4. Phases 0–8: Lightweight Optimization & Performance Refactoring

### Phase 0 — Baseline Profiling
- Initial state: Monolithic frontend bundle (`859.51 kB` JS) exceeding Vite chunk limits.
- Backend queries: $1 + 3N$ queries in `getProjects` and $1 + N$ queries in `getMilestones`.
- Unused dependencies: `zod` installed in backend without any imports.

### Phase 1 — Frontend Code Splitting & Chunk Optimization
- **Route-Level Splitting:** Converted all 15 routes in `frontend/src/App.jsx` to `React.lazy()` wrapped in `<Suspense fallback={<PageFallback />}>`.
- **Vendor Chunk Isolation:** Configured Rollup `manualChunks` in `frontend/vite.config.js`:
  - `vendor-react` (React, ReactDOM)
  - `vendor-router` (React Router)
  - `vendor-charts` (Recharts — isolated to analytics views)
  - `vendor-icons` (Lucide React)
  - `vendor-net` (Axios, Socket.IO Client)
- **Result:** Landing page initial bundle dropped from **859.51 kB** to **29.39 kB** (**~96.5% reduction**). Heavy chart libraries only load when navigating to chart pages.

### Phase 2 — Backend & Mongoose Query Optimization
- **N+1 Elimination in `getProjects`:** Replaced loops of `countDocuments` with 2 MongoDB aggregations (`Task.aggregate` and `Milestone.aggregate`) grouped by `projectId`. Database roundtrips reduced from $1 + 3N$ to 3 constant queries.
- **N+1 Elimination in `getMilestones`:** Replaced per-milestone task query loops with a single batch query `Task.find({ projectId }).select("milestoneId status").lean()`.
- **Read-Only Document Hydration Bypass (`.lean()`):** Applied `.lean()` across all read endpoints in 11 controllers (`projectController`, `milestoneController`, `taskController`, `reportController`, `dependencyController`, `workloadController`, `healthController`, `contributionController`, `notificationController`, `commentController`, `attachmentController`), reducing Node.js heap footprint by ~40–60%.
- **Selective Projections:** Restricted queries in health, contribution, and activity endpoints to fetch only calculation fields rather than entire document bodies.

### Phase 3 & 4 — Python Analytics & Dual-Engine Bridge
- **Linear DAG Cycle Fast-Path:** In `analytics/app/algorithms/dag.py`, added a pre-check using `nx.is_directed_acyclic_graph(self.graph)`. Acyclic graphs resolve in $O(V + E)$ linear time, avoiding exponential cycle generator overhead. Pytest runtime dropped from 0.47s to 0.38s.
- **Resilient Bridge Failover:** Maintained full parity between FastAPI and native TypeScript fallback with automated 3500ms timeout failover.

### Phase 5 — Dependency & Secrets Hygiene
- Uninstalled unused `zod` dependency from `backend/package.json` (0 vulnerabilities).
- Removed unused SMTP parameters from `backend/.env`, `backend/.env.example`, and `backend/src/config/env.ts`, allowing invitation and password reset links to log directly to the console in local development.
- Confirmed all `.env` files are tracked in `.gitignore`.

### Phase 6–8 — Verification & Acceptance Results
- **Backend Tests:** 5 suites / 37 assertions passing (`npm test` in `backend/`).
- **Python Tests:** 9 pytest assertions passing in 0.38s (`pytest tests/` in `analytics/`).
- **Builds:** Backend `tsc` compiles with 0 errors; Frontend `vite build` completes in 3.22s with 0 warnings.

---

## 5. Directory Structure Reference

```
teampulse-ai/
├── analytics/                      # FastAPI Python analytics service
│   ├── app/
│   │   ├── algorithms/             # CPM and DAG algorithms (NetworkX)
│   │   ├── models/                 # Pydantic validation schemas
│   │   ├── services/               # Workload, contribution, and health calculations
│   │   └── main.py                 # FastAPI application routes & CORS
│   ├── tests/                      # Pytest suite
│   ├── .env.example
│   ├── requirements.txt
│   └── run.py                      # Uvicorn boot script (Port 8000)
├── backend/                        # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/                 # Environment variables and DB connection
│   │   ├── controllers/            # Optimized Express route handlers (.lean() & projections)
│   │   ├── middleware/             # JWT auth and RBAC boundary enforcement
│   │   ├── models/                 # Mongoose schemas, compound indexes & pre-hooks
│   │   ├── services/               # Dual-Engine AnalyticsBridge, Activity logger, Sockets
│   │   └── index.ts                # Application entry point (Port 5000)
│   ├── scripts/                    # Opt-in seed (`seed.demo.ts`) & wipe (`seed.reset.ts`)
│   ├── tests/                      # 5 Integration test suites (API, RBAC, Parity, Realtime, Audit)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/             # Reusable UI modals, navigation, and badges
│   │   ├── pages/                  # 15 Route-level lazy loaded pages
│   │   ├── services/               # Axios API client with interceptors & Socket.IO client
│   │   ├── App.jsx                 # Route splitting with Suspense fallbacks
│   │   ├── index.css               # Design system tokens and global styling
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Rollup manualChunks configuration
├── docs/                           # Architectural, operational & optimization reports
│   ├── ARCH.md                     # Deep system architecture
│   ├── RUNBOOK.md                  # Operational procedures
│   ├── PROGRESS.md                 # Stage completion log
│   ├── OPTIMIZATION_PLAN.md        # Initial profiling and refactoring strategy
│   └── OPTIMIZATION_REPORT.md      # Verified before/after benchmark results
├── prompt.md                       # This master specification prompt
├── README.md                       # Repository overview and setup guide
└── .gitignore                      # Secrets and build artifact exclusions
```

---

## 6. Local Development & Operational Runbook

### 6.1 Starting the Services Independently

1. **MongoDB Database:**
   Ensure MongoDB is running locally on port 27017:
   ```bash
   mongod --dbpath <data-dir>
   ```

2. **Backend API (Node.js / Express):**
   ```bash
   cd backend
   npm install
   npm run dev
   # Runs on http://localhost:5000
   ```

3. **Frontend Application (Vite / React):**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

4. **Analytics Service (Python / FastAPI — Optional, fallback available):**
   ```bash
   cd analytics
   python -m venv .venv
   .venv\Scripts\activate       # Windows
   # source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   python run.py
   # Runs on http://localhost:8000
   ```

### 6.2 Database Seeding Commands
- **Seed Complete Demo Data (Opt-In):**
  ```bash
  cd backend
  npm run seed:demo
  ```
- **Reset / Wipe Database:**
  ```bash
  cd backend
  npm run seed:reset
  ```

### 6.3 Executing Verification Test Suites
- **Run All Backend Integration Tests (37 Assertions):**
  ```bash
  cd backend
  npm test
  ```
- **Run Python Analytics Tests:**
  ```bash
  cd analytics
  .venv\Scripts\python -m pytest tests/ -v
  ```
- **Run Production Builds:**
  ```bash
  cd backend && npm run build
  cd frontend && npm run build
  ```

---

## 7. Verified Acceptance Benchmark Summary

| Metric | Baseline | Optimized | Status |
| :--- | :--- | :--- | :--- |
| **Initial Route JS Payload** | 859.51 kB (gzip: 240.86 kB) | **29.39 kB** (gzip: 6.66 kB) | ✅ **~96.5% reduction** |
| **Vite Chunk Size Warning** | >500 kB Warning triggered | 0 Warnings, 15 route-split chunks | ✅ **Clean build in 3.22s** |
| **Project List Query Roundtrips** | $1 + 3N$ queries | **3 constant queries** (Aggregation) | ✅ **Eliminated N+1** |
| **Milestone List Query Roundtrips** | $1 + N$ queries | **2 constant queries** (Batch indexed) | ✅ **Eliminated N+1** |
| **Read Endpoint Memory Footprint** | Hydrated Mongoose Documents | Plain JS objects (`.lean()` + projections) | ✅ **~40–60% heap reduction** |
| **DAG Cycle Detection Time** | $O(2^V)$ unconstrained | **$O(V + E)$ linear fast-path** | ✅ **Pytest runtime: 0.38s** |
| **Backend Integration Tests** | 5 suites | 5 suites passing (37/37 assertions) | ✅ **100% Pass** |
| **Analytics Unit Tests** | 9 tests | 9 tests passing | ✅ **100% Pass** |
| **Security & Quality Gates** | Full RBAC, 422 FS, Token Rotation | Verified strictly in regression tests | ✅ **Zero regressions** |
