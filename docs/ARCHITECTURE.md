# TeamPulse AI — System Architecture

**TeamPulse AI** is an intelligent, full-stack project management and team contribution analysis platform designed specifically for student and agile software engineering teams.

---

## 1. System Architecture Diagram

```
+--------------------------------------------------------------------------------+
|                           CLIENT LAYER (React 18 + Vite)                       |
|   TypeScript + Vanilla/Modern CSS + Lucide Icons + Recharts Data Visualization |
|                                                                                |
|  [Overview]  [Task Board: Kanban/Table/Gantt]  [DAG Graph]  [Workload Matrix]  |
|  [Milestone Tracker]  [Fair Contributions]  [Auditable Reports & CSV Export]   |
+---------------------------------------+----------------------------------------+
                                        │ HTTP REST (Axios) + WebSockets (Socket.IO)
                                        ▼
+--------------------------------------------------------------------------------+
|                        BACKEND SERVICE (Node.js + Express)                     |
|           TypeScript + JWT Authentication + Role-Based Access Control          |
|                                                                                |
|  ├── Auth Controller (bcrypt secure password hashing, JWT bearer tokens)       |
|  ├── Project & RBAC Middleware (Owner, Manager, Member, Reviewer roles)        |
|  ├── Task Management & State Transition Validator (review & blocker gates)     |
|  ├── Audit Event Logger (chronological immutable ledger)                       |
|  ├── Real-time Socket.IO Broadcaster (rooms: project:${id}, user:${id})        |
|  └── Analytics Bridge (FastAPI client + built-in TypeScript fallback engine)   |
+-------------------+-----------------------------------+------------------------+
                    │ Mongoose ORM                      │ HTTP JSON (Port 8000)
                    ▼                                   ▼
+--------------------------------------+  +--------------------------------------+
|            DATABASE LAYER            |  |      ANALYTICS SERVICE (FastAPI)     |
|         MongoDB Server 27017         |  |        Python 3.14 + NetworkX        |
|                                      |  |                                      |
|  • Users & Capacity Preferences      |  |  • DAG Cycle Prevention & Topo Sort  |
|  • Projects & Memberships            |  |  • Critical Path Method (CPM Float)  |
|  • Tasks & Predecessors              |  |  • Workload Rebalancer Recommendations|
|  • Milestones & Criteria             |  |  • Multi-Signal Contribution Index   |
|  • Blocker Reports & Reviews         |  |  • Composite Health Score (0 - 100)  |
|  • Comments, Attachments & Audits    |  +--------------------------------------+
+--------------------------------------+
```

---

## 2. Mathematical & Algorithmic Foundations

### A. Finish-to-Start DAG & Critical Path Method (CPM)
1. **Cycle Detection**:
   $$\text{A graph } G=(V, E) \text{ is a Directed Acyclic Graph iff } \nexists \text{ path } v_1, v_2, \dots, v_k \text{ where } v_1 = v_k$$
   Cycle prevention is enforced on the server before adding any dependency edge $u \to v$.
2. **Forward Pass (Early Schedule)**:
   $$ES_i = \max_{p \in \text{Pred}(i)} (EF_p), \quad \text{with } ES_{\text{root}} = 0$$
   $$EF_i = ES_i + D_i \quad (D_i = \text{Remaining/Estimated duration of task } i)$$
3. **Backward Pass (Late Schedule)**:
   $$LF_i = \min_{s \in \text{Succ}(i)} (LS_s), \quad \text{with } LF_{\text{terminal}} = \max_j (EF_j)$$
   $$LS_i = LF_i - D_i$$
4. **Total Slack (Float) & Critical Path**:
   $$\text{Slack}_i = LS_i - ES_i = LF_i - EF_i$$
   $$\text{Critical Path} = \{ i \in V \mid \text{Slack}_i = 0 \land \text{Status}_i \neq \text{"Done"} \}$$

### B. Workload Utilization & Rebalancing Algorithm
1. **Utilization Rate**:
   $$\text{Utilization}_m = \left( \frac{\sum_{t \in \text{AssignedOpenTasks}(m)} \text{RemainingHours}_t}{\text{WeeklyCapacityHours}_m} \right) \times 100$$
2. **Advisory Reallocation Matching**:
   When $\text{Utilization}_m > 100\%$, candidate unstarted tasks $t$ are scored against available members $u$ ($\text{Utilization}_u < 50\%$) by checking:
   $$\text{MatchScore}(t, u) = \text{SkillOverlap}(t.\text{tags}, u.\text{skills}) + \mathbb{I}(\text{CapacityAfter} \le 100\%)$$
   Recommendations are strictly advisory and require human approval.

### C. Multi-Signal Fair Contribution Analysis
To prevent distorted incentives from simplistic task counts or raw hours logged, contribution is evaluated across five weighted indicators:
$$\text{ContributionIndex} = 0.35 \times C + 0.20 \times T + 0.15 \times R + 0.15 \times P + 0.15 \times E$$
Where:
- $C$ = Task Completion Velocity (completed vs assigned commitment fulfillment)
- $T$ = On-Time Delivery Ratio (on-time milestones vs late deliveries)
- $R$ = Peer Review & Collaboration Score (code reviews conducted, feedback provided)
- $P$ = Problem Solving & Unblocking Score (blockers reported early and resolved)
- $E$ = Effort Estimation Precision (consistency between planned effort and logged hours)

---

## 3. High-Availability Analytics Bridge
The Node.js backend communicates with the Python FastAPI analytics service over HTTP. If the Python service is offline, restarting, or unreachable, the `AnalyticsBridge` automatically runs internal TypeScript implementations of the DAG, CPM, Workload, and Health algorithms with zero user-facing disruption.
