# TeamPulse AI — System Audit & Hardening Report

**Audit Date**: October 2026  
**Status**: Completed (Stage 0 Gate)  
**Scope**: Full stack inspection (`frontend/`, `backend/`, `analytics/`, `docs/`, root workspace).

---

## 1. Executive Summary & Verification Results

| Service | Environment / Runtime | Build / Verification Command | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind/CSS | `npm run build` | **PASS** (3.49s) | Chunks built successfully; needs dynamic code splitting & route-level boundaries. |
| **Backend** | Node 22, Express, TypeScript 5.7 | `npm run build` (`tsc`) | **PASS** (0 errors) | Compiles to `dist/`; missing root `npm run dev/test/smoke` scripts. |
| **Analytics** | Python 3.14, FastAPI, NetworkX, NumPy | `pytest` | **PASS** (7/7 passed) | Unit tests pass for DAG, CPM, workload & health; needs pure FastAPI endpoints for spec 4a. |

---

## 2. Mock, Dummy, and Hardcoded Data Inventory

The codebase currently contains the following mock/hardcoded/demo data items that must be eliminated or refactored:

1. **`frontend/src/pages/OverviewPage.jsx:152-164`**
   - **Hardcoded synthetic chart curve**:
     ```javascript
     { day: "Mon", completed: Math.max(1, doneCount - 5), created: 3 },
     { day: "Tue", completed: Math.max(2, doneCount - 4), created: 4 },
     ...
     ```
     *Fix*: Derive trend points strictly from real `ActivityEvent` or daily `HealthSnapshot` timestamps.

2. **`frontend/src/pages/OverviewPage.jsx:173-174`**
   - **Synthetic fallback metrics**:
     ```javascript
     const healthScore = healthData?.health_score || 72;
     const riskLevel = healthData?.risk_level || "At Risk";
     ```
     *Fix*: Show empty state / "Insufficient data" when project has no tasks or fewer than 3 factors computed.

3. **`frontend/src/pages/HealthInsightsPage.jsx:42-43`**
   - **Synthetic fallback scores**:
     ```javascript
     const score = health?.health_score || 72;
     const risk = health?.risk_level || "At Risk";
     ```
     *Fix*: Render loading skeleton or empty state; display "Insufficient data" per Section 2.5 when factors < 3.

4. **`frontend/src/pages/HealthInsightsPage.jsx:97-100`**
   - **Hardcoded summary text fallback**:
     ```javascript
     {health?.summary || "Project requires active mitigation."}
     ```
     *Fix*: Dynamically report real computed risk factors or display neutral empty state.

5. **`backend/src/seed/seedData.ts:1-530`**
   - **Legacy auto/manual seed script**:
     Hardcodes sample demo users (`ankit@teampulse.ai`, `rahul@teampulse.ai`, etc.) and demo projects into main seed.
     *Fix*: Move to isolated `backend/scripts/seed.demo.ts` with `@demo.local` emails, explicit `npm run seed:demo`, and reset via `npm run seed:reset`. Ensure clean boot against empty database.

6. **`backend/tests/api.test.ts:15-25`**
   - **Hardcoded dependency on pre-seeded database**:
     Queries `ankit@teampulse.ai` and `TPAI` project; fails if database is freshly initialized and empty.
     *Fix*: Tests must register dynamic fixtures or spin up temporary test documents.

---

## 3. Working Features

- **Frontend Theme & Aesthetics**: Complete modern dark design system in `styles.css` (`#0b1020`, DM Sans + Manrope, vibrant accents, glass cards, responsive panels down to 360px).
- **Core Entity Models**: `User`, `Project`, `Milestone`, `Task`, `Comment`, `Attachment`, `ActivityEvent`, `Notification`.
- **DAG & Critical Path Algorithms**: Python NetworkX algorithms for cycle detection, topological sorting, and forward/backward CPM calculation with TypeScript fallback bridge in `AnalyticsBridge.ts`.
- **Socket.IO Real-Time Dispatch**: Room-based event broadcasting (`task:created`, `task:updated`, `notification:new`, `activity:new`).
- **File Upload Handling**: Multer middleware with local disk storage in `backend/uploads/`.
- **Kanban and Table Layouts**: Interactive task status dragging and filtering structures.

---

## 4. Broken & Non-Compliant Features

1. **RBAC & Permission Matrix Violations (Section 2.1)**:
   - In `backend/src/routes/projectRoutes.ts`: `Project Manager` is permitted to update projects and manage members (`PUT /:projectId`, `POST /:projectId/members`, `PUT /:projectId/members/:memberId`). Spec 2.1 specifies **Owner only (Y)** for these actions; Manager must be **N**.
   - In `backend/src/routes/taskRoutes.ts`: `DELETE /tasks/:taskId` is accessible to any task member. Spec restricts task deletion / archival.
   - Task editing does not restrict `Member` to assigned tasks and limited fields (status, remaining/actual effort, notes).
2. **Task State Transitions & HTTP Status Codes (Section 2.2)**:
   - Illegal transitions currently return `400 Bad Request` instead of the required `422 Unprocessable Entity`.
   - Finish-to-start rule: Transition into `In Progress` must be rejected if any predecessor is not `Done` (currently checked only on entering `Done`).
   - Project setting `requireReviewForDone`: Not enforced consistently before transition to `Done`.
3. **Activity Log Mutability Safeguards (Section 2.7)**:
   - `ActivityEvent` lacks Mongoose pre-hooks (`updateOne`, `updateMany`, `deleteOne`, `deleteMany`, `findOneAndDelete`, `findOneAndUpdate`) to guarantee append-only immutability.
4. **Notification De-duplication (Section 2.8)**:
   - `Notification` model lacks unique compound key `userId + type + entityId + dayBucket` to prevent duplicate spam.
   - Missing automated cron job (every 15 min + daily digest) for background scheduled alerts.
5. **Auth Refresh Token Rotation (Section 3 Stage 3b)**:
   - Auth issues only a 7-day single JWT access token. Missing refresh token rotation and client interceptor retry mechanism.

---

## 5. Missing Features

1. **Root Configuration & Script Orchestration**:
   - No root `package.json` for running all services via `npm run dev`, `npm run build`, `npm run test`, `npm run smoke`, `npm run seed:demo`, `npm run seed:reset`.
2. **Landing Page & Public Routes (Section 3 Stage 2)**:
   - No public `/` landing page for unauthenticated visitors (navbar, hero, problem/solution, features grid, how-it-works, intelligence section, role cards, FAQ accordion, footer).
   - No dedicated `/forgot-password`, `404` page, or global error boundary.
3. **Missing Data Models (Section 2.11)**:
   - `Membership` (standalone model with `{userId, projectId, role, weeklyCapacityHours, skills[]}` and unique compound index).
   - `Invitation` (for email token invites without SMTP dependencies).
   - `TaskDependency` (standalone model `{predecessorId, successorId, projectId}` with unique compound index).
   - `Review` (standalone model `{taskId, requestedBy, reviewer, status, feedback}`).
   - `Blocker` (standalone model `{taskId, reportedBy, severity, description, status, resolvedBy, resolvedAt}`).
   - `RedistributionProposal` (for workload rebalancing proposals: proposed -> approved | rejected).
   - `HealthSnapshot` (for daily project health and risk trend charts).
   - `ProjectSettings` (thresholds, requireReviewForDone, productiveHoursPerDay, working days).
4. **FastAPI Spec Endpoints (Section 4a)**:
   - Exact endpoints required: `GET /health`, `POST /critical-path`, `POST /delay-propagation`, `POST /workload`, `POST /redistribution`, `POST /contribution`, `POST /project-health`.
5. **Navigation Pages (Section 5e)**:
   - My Tasks page, Settings page, Team page, standalone Notifications center page.
6. **Reports Suite (Section 5d)**:
   - 7 standardized reports with filters, pagination, and CSV export.

---

## 6. Dead Buttons & Broken Links Audit

| Location | Control / Element | Current Behavior | Required Behavior |
| :--- | :--- | :--- | :--- |
| `Sidebar.jsx:208` | "View Health Analysis →" | `setActiveNav("AI insights")` | Routes to dedicated AI Health page (needs URL route). |
| `Topbar.jsx:82` | Notification popover "Clear All" | No state effect / mock | Triggers `notificationsAPI.markAllAsRead()` and updates state. |
| `OverviewPage.jsx:38` | Filter button | Visual mock | Opens real filter dropdown (status, priority, member, date). |
| `OverviewPage.jsx:136` | Table row action buttons | Visual placeholder | Opens `TaskDetailModal` or edit actions. |
| `LoginPage.jsx:87` | "Forgot password?" link | Dead / no handler | Opens `/forgot-password` workflow. |

---

## 7. Prioritized Implementation Plan

- [x] **Stage 0: Audit** (Complete AUDIT.md & baseline verification)
- [ ] **Stage 1: Demo Data Elimination & Empty-State Hardening** (Remove fake arrays, build loading skeletons & empty states, isolate seed to `backend/scripts/seed.demo.ts`)
- [ ] **Stage 2: Public Experience & Landing Page** (Build modern responsive landing page, auth pages, 404, error boundary)
- [ ] **Stage 3: Auth, RBAC, Projects, Milestones & Tasks** (JWT refresh rotation, permission matrix enforcement, task transitions with 422 errors, Kanban & views)
- [ ] **Stage 4: Intelligence & Analytics Parity** (FastAPI spec endpoints, Python algorithms, TS fallback, parity tests, dependency & workload UI)
- [ ] **Stage 5: Collaboration, Real-Time, Reports & Navigation** (Append-only activity log, deduplicated cron notifications, 7 reports + CSV export, complete working pages)
- [ ] **Stage 6: Security, Quality & Polish** (Helmet, rate limiting, Zod validation on all routes, NoSQL sanitization, aria/accessibility check, dead-control sweep)
- [ ] **Stage 7: Automated Tests, Smoke Suite & Documentation** (End-to-end smoke test on clean DB, parity tests, permission matrix tests, docs completion)
