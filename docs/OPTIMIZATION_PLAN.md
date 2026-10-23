# TeamPulse AI — Performance & Lightweight Optimization Plan

**Document:** `docs/OPTIMIZATION_PLAN.md`  
**Phase:** Phase 0 (Baseline Audit & Engineering Blueprint)  
**Date:** 2026-10-23  
**Status:** Approved for Implementation

---

## 1. Measured Baseline Metrics (Pre-Optimization)

| Dimension | Measured Metric | Identified Bottleneck / Opportunity |
| :--- | :--- | :--- |
| **Frontend Production JS** | `859.51 kB` (gzip: `240.86 kB`) in a single monolithic bundle | 15 pages and `recharts` statically imported in `App.jsx`. Vite triggers warning: `(!) Some chunks are larger than 500 kB after minification`. |
| **Frontend Production CSS** | `19.55 kB` (gzip: `5.19 kB`) | Single stylesheet; opportunities for micro-cleanup. |
| **Frontend Code Splitting** | 0 dynamic chunks (monolith) | Initial visitor pays full cost of dashboard charts, DAG graph, and reporting tools. |
| **Backend Dependencies** | 11 runtime packages | `zod` installed in `package.json` but never imported or referenced in code. |
| **Database Queries (N+1)** | `getProjects`: $1 + 3N$ queries (`Task.countDocuments` $\times 2$ + `Milestone.countDocuments` per project).<br>`getMilestones`: $1 + N$ queries (`Task.find` per milestone). | Heavy database round trips under portfolio scaling; avoidable with MongoDB aggregation and `$in` queries. |
| **Mongoose Query Hydration** | 100% heavy Document class hydration on read-only endpoints. | Document instance change-tracking, getters, and setters consume ~40-60% extra memory on read queries; missing `.lean()`. |
| **Python Analytics** | 9 pytest assertions in 0.88s (<0.005s per test). | Clean execution, but repeated graph conversions on identical inputs can benefit from payload hashing/memoization. |
| **Analytics Bridge** | Redundant HTTP serialization during failover retry. | Bridge can optimize timeout and failover circuit to avoid redundant latency. |

---

## 2. Optimization Blueprint by Phase

### Phase 1 — Frontend Lightweight Optimization
1. **Route-Level Code Splitting**:
   - Convert all non-critical pages (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `AcceptInvitePage`, `NotFoundPage`, and all 9 workspace pages) to dynamic imports with `React.lazy()` and a lightweight `<Suspense>` fallback.
   - Initial landing page chunk will drop from **859.51 kB** to **< 150 kB**.
2. **Vite Rollup Chunking (`vite.config.js`)**:
   - Configure `manualChunks`:
     - `vendor-react`: `react`, `react-dom`, `react-router-dom`
     - `vendor-charts`: `recharts` (isolated so only chart pages download it)
     - `vendor-icons`: `lucide-react`
     - `vendor-net`: `axios`, `socket.io-client`
3. **Socket.IO Subscription Cleanup**:
   - Audit `socket.js` and context listeners to ensure complete teardown on component unmount to prevent memory leaks.
4. **Optimistic Updates Preservation**:
   - Ensure Kanban drag-and-drop optimistic status updates and rollback on HTTP 422 remain untouched and responsive.

### Phase 2 — Node.js / Express Backend Optimization
1. **N+1 Query Elimination**:
   - Refactor `projectController.ts` (`getProjects`): replace per-project `Task.countDocuments` and `Milestone.countDocuments` with single aggregated pipeline:
     ```typescript
     Task.aggregate([
       { $match: { projectId: { $in: projectIds } } },
       { $group: { _id: "$projectId", totalTasks: { $sum: 1 }, completedTasks: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } } } }
     ])
     ```
   - Refactor `milestoneController.ts` (`getMilestones`): batch task counts across all milestones in a single query instead of per-milestone loop queries.
2. **Lean Mongoose Queries (`.lean()`)**:
   - Add `.lean()` to all read-only queries in `projectController`, `taskController`, `milestoneController`, `reportController`, `dependencyController`, `workloadController`, `healthController`, and `contributionController`.
   - Bypasses Mongoose document wrapper overhead, reducing memory footprint by ~50% and speeding up JSON serialization.
3. **Compound Index Optimization**:
   - Ensure compound indexes exist for high-frequency queries:
     - `Task`: `{ projectId: 1, status: 1 }`, `{ milestoneId: 1 }`
     - `TaskDependency`: `{ projectId: 1, successorId: 1 }`, `{ projectId: 1, predecessorId: 1 }`
     - `ActivityEvent`: `{ projectId: 1, createdAt: -1 }`

### Phase 3 & 4 — Analytics Engine & Bridge Optimization
1. **Algorithmic Graph Traversal**:
   - In Python CPM and DAG routines, avoid redundant list copies and streamline Kahn's topological sort and backward pass.
2. **Bridge Serialization Optimization**:
   - Ensure clean 3500ms timeout with non-blocking error handling and seamless failover to TypeScript native CPM fallback.

### Phase 5 — Dependency & Repository Pruning
1. **Remove Unused Package**:
   - Uninstall unused `zod` package from `backend/package.json` and prune `package-lock.json`.
2. **File & Artifact Hygiene**:
   - Verify `.gitignore` exclusions (no `.env`, `node_modules`, `dist`, or `__pycache__` tracked).

### Phase 6, 7 & 8 — Verification & Regression Guarantees
1. **Full Verification Protocol**:
   - Run all 5 backend test suites (37 assertions).
   - Run all 9 Python analytics tests.
   - Run frontend and backend production builds.
   - Measure post-optimization chunk sizes and query counts.
2. **Security & Integrity Preservation**:
   - Verify JWT rotation, RBAC, 422 Finish-to-Start enforcer, `requireReviewForDone` quality gate, and append-only activity immutability remain 100% intact.
