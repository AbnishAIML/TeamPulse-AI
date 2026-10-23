# TeamPulse AI — System Architecture & Algorithmic Blueprint

**Document:** `docs/ARCH.md`  
**Version:** 1.0.0 (Production)  
**System:** TeamPulse AI (Intelligent Project Management & Team Contribution Analytics)

---

## 1. System Topology & Dual-Engine Architecture

TeamPulse AI is engineered with a **dual-engine architecture** combining high-performance Python graph analytics with an in-process native TypeScript fallback engine to guarantee 100% operational availability:

```mermaid
graph TD
    Client["React 18 Frontend Client (Vite :5173)"]
    API["Node.js / Express API Gateway (:5000)"]
    DB[(MongoDB Database :27017)]
    Bridge["AnalyticsBridge Service"]
    FastAPI["Python 3.14 FastAPI Engine (:8000)\n(NetworkX & NumPy Graph Algorithms)"]
    TSFallback["Native TypeScript Analytics Fallback\n(In-Process Execution)"]

    Client -->|REST & WebSockets| API
    API -->|Mongoose ODM| DB
    API --> Bridge
    Bridge -->|HTTP POST (3500ms timeout)| FastAPI
    Bridge -.->|Automatic Failover on Timeout/Error| TSFallback
```

### Analytics Bridge Contract & Parity
The `AnalyticsBridge` encapsulates all analytical requests (`analyzeDependencies`, `simulateDelayPropagation`, `analyzeWorkload`, `reassignWorkload`, `analyzeContributions`, `evaluateProjectHealth`). If the FastAPI daemon is offline or response exceeds `3500ms`, the bridge executes identical algorithmic implementations in pure TypeScript.

---

## 2. Directed Acyclic Graph (DAG) & Critical Path Method (CPM)

### Mathematical Formulation
A project is modeled as a directed acyclic graph $G = (V, E)$, where $V$ represents tasks and $E$ represents Finish-to-Start dependency constraints $(u, v)$ stating that task $u$ must finish before task $v$ can start.

```
       [Task A: 12h] ─────────┐
                               ▼
[Start] ───────────────> [Task C: 20h] ───────> [Task D: 8h] ───> [Finish: 40h]
                               ▲
       [Task B: 6h] ──────────┘
```

#### 1. Cycle Detection & Topological Ordering
Cycle detection uses **Kahn's Algorithm** with in-degree tracking:
1. Compute in-degree $\text{deg}^-(v)$ for each $v \in V$.
2. Initialize queue $Q$ with all vertices having $\text{deg}^-(v) = 0$.
3. Dequeue $u$, append to topological sequence $S$, and decrement in-degree for all successors $v \in \text{Adj}(u)$.
4. If $|S| < |V|$, a circular dependency cycle exists; Kahn's algorithm reports cycle nodes and prevents scheduling.

#### 2. Forward Pass (Early Dates & Project Duration)
For each task $i$ in topological order:
$$\text{ES}_i = \begin{cases} 0 & \text{if } \text{Pred}(i) = \emptyset \\ \max_{p \in \text{Pred}(i)} (\text{EF}_p) & \text{otherwise} \end{cases}$$
$$\text{EF}_i = \text{ES}_i + d_i$$
Where $d_i$ is task duration ($\text{remainingHours} \lor \text{estimatedHours}$). Total project duration $T = \max_{v \in V} (\text{EF}_v)$.

#### 3. Backward Pass (Late Dates & Float/Slack)
For each task $i$ in reverse topological order:
$$\text{LF}_i = \begin{cases} T & \text{if } \text{Succ}(i) = \emptyset \\ \min_{s \in \text{Succ}(i)} (\text{LS}_s) & \text{otherwise} \end{cases}$$
$$\text{LS}_i = \text{LF}_i - d_i$$

#### 4. Total Float & Critical Path Identification
$$\text{Total Slack}_i = \text{LS}_i - \text{ES}_i = \text{LF}_i - \text{EF}_i$$
Tasks with $\text{Total Slack}_i \le 0.1$ hours form the **Critical Path**. Any schedule slippage on these tasks directly slips the final project milestone.

---

## 3. What-If Delay Propagation Simulation Algorithm

The delay propagation engine calculates schedule slippage and cascading downstream delays when task $k$ is delayed by $\Delta h$ hours:

```
Algorithm: SimulateDelayPropagation(G, k, Δh)
Input: Task graph G = (V, E), delayed task k, delay hours Δh
Output: Schedule slippage, updated duration, critical path status, affected downstream tasks

1. Run baseline CPM on G -> record T_baseline, {EF_baseline(v)}, {Slack_baseline(v)}
2. Construct perturbed graph G' where duration d'_k = d_k + Δh
3. Run perturbed CPM on G' -> record T_new, {EF_new(v)}, {Slack_new(v)}
4. Compute Net Project Slippage:
      Slippage = max(0, T_new - T_baseline)
5. For each task v in G':
      shift_v = EF_new(v) - EF_baseline(v)
      If shift_v > 0.05 or v == k:
          Add v to affected_tasks with additional_delay = shift_v and new_slack = Slack_new(v)
6. Critical Path Shift = (CriticalPath(G') != CriticalPath(G))
7. Return { Slippage, T_new, CriticalPathShift, affected_tasks }
```

---

## 4. Role-Based Access Control (RBAC) & Quality Gates

### Section 2.1 RBAC Matrix

| Capability / Action | Project Owner | Project Manager | Team Member | Reviewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Project Workspace & Analytics** | Full | Full | Full | Full |
| **Create Tasks & Milestones** | Full | Full | Full | Restricted |
| **Edit Any Task Metadata** | Full | Full | Assigned Only (403 otherwise) | View Only |
| **Establish / Remove Dependencies** | Full | Full | Full | View Only |
| **Report / Resolve Blockers** | Full | Full | Full | View Only |
| **Request Peer Review** | Full | Full | Full | N/A |
| **Submit Review Decision (Approve/Reject)** | Full | Full | 403 Forbidden | Full |
| **Apply Advisory Workload Rebalancing** | Full | Full | 403 Forbidden | 403 Forbidden |
| **Manage Team Members & Roles** | Full (Sole-Owner Protection) | 403 Forbidden | 403 Forbidden | 403 Forbidden |
| **Archive Project** | Full | 403 Forbidden | 403 Forbidden | 403 Forbidden |

### Section 2.2 Quality Gate Enforcers
1. **Finish-to-Start Enforcer**: When a task transition to `Done` is requested, the controller resolves all predecessors from `task.dependencies` and the `TaskDependency` table. If any predecessor has `status !== "Done"`, the transition is blocked with **HTTP 422 Unprocessable Entity**.
2. **Peer Review Gate (`requireReviewForDone`)**: When enabled on the project settings, transitions to `Done` require an approved peer review decision recorded on the task. Unapproved requests are rejected with **HTTP 422**.

---

## 5. Activity Audit Immutability & Notification Deduplication

### Append-Only Activity Ledger (`ActivityEvent`)
To ensure auditable academic integrity for student teams, `ActivityEvent` models strictly prohibit mutation or deletion. Pre-hooks on Mongoose throw uncatchable audit errors:
```typescript
const rejectMutation = function (this: any, next: (err?: Error) => void) {
  next(new Error("[Audit Rule Violation] ActivityEvent is strictly append-only. Updates and deletions are forbidden."));
};

ActivityEventSchema.pre("updateOne", rejectMutation);
ActivityEventSchema.pre("updateMany", rejectMutation);
ActivityEventSchema.pre("deleteOne", rejectMutation);
ActivityEventSchema.pre("deleteMany", rejectMutation);
ActivityEventSchema.pre("findOneAndUpdate", rejectMutation);
```

### Notification Deduplication
Notifications use a sparse compound unique index on `dedupKey`:
```typescript
NotificationSchema.index({ dedupKey: 1 }, { unique: true, sparse: true });
```
Alert cron routines construct deterministic deduplication keys (e.g. `overdue:taskId:YYYY-MM-DD` and `blocker:taskId:YYYY-MM-DD`), preventing redundant notifications across recurring background evaluation cycles.

---

## 6. Real-Time Socket.IO Channel Topology

```
                  ┌────────────────────────────────────────┐
                  │          Socket.IO Gateway             │
                  └────────────────────────────────────────┘
                               │                │
            ┌──────────────────┘                └──────────────────┐
            ▼                                                      ▼
  [ Project Room: project:{id} ]                         [ User Room: user:{id} ]
  - task:created                                         - notification:new
  - task:status_changed                                  - notification:read
  - task:blocker_updated                                 - invite:received
  - project:members_updated
  - project:updated
```
Clients join `project:{id}` upon selecting a workspace in `ProjectContext` and join `user:{id}` upon authentication in `AuthContext`.
