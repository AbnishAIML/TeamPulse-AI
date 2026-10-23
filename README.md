# TeamPulse AI — Intelligent Project Management & Team Contribution Analysis

> **TechTrix'26 BONUS 02 — Software Engineering Master Project**  
> An intelligent project management platform that organizes projects, manages finish-to-start task dependencies with critical path scheduling, balances team workload, mitigates risks, and provides equitable, multi-signal contribution analysis for student software teams.

---

## 🌟 Executive Overview & Key Capabilities

1. **Finish-to-Start DAG Dependencies & Critical Path Method (CPM)**:
   - Cycle detection preventing circular dependency deadlocks with live visual alerts.
   - Topological sort into execution sequence.
   - CPM calculation: Early Start, Early Finish, Late Start, Late Finish, and Total Float/Slack.
   - **Interactive What-If Delay Propagation Simulation**: Models project schedule slippage, critical path shifts, and cascading downstream task delays.

2. **Quality Gates & Academic Integrity**:
   - **Predecessor Enforcer**: Rejects premature task completion (HTTP 422) if prerequisite predecessor tasks are unfinished.
   - **Peer Review Gate (`requireReviewForDone`)**: Requires approved peer review decisions before deliverables can transition to `Done`.
   - **Append-Only Activity Ledger**: Prohibits editing or deleting activity history records to guarantee transparent academic auditing.

3. **Intelligent Workload Analysis & Advisory Rebalancing**:
   - Configurable weekly member capacities (hours).
   - Burnout detection (>100% capacity) and underutilization warnings (<50%).
   - **AI Advisory Task Redistribution**: Constraint-aware task reallocation recommendations with 1-click human approval.

4. **Multi-Signal Fair Contribution Analysis**:
   - Replaces crude task-counting with 5 transparent dimensions: Task Completion Velocity, On-Time Commitments, Peer Review Stewardship, Problem Solving / Unblocking, and Estimation Precision.

5. **Dual-Engine Resilience (Analytics Bridge)**:
   - High-performance Python FastAPI service with NetworkX graph algorithms.
   - Built-in TypeScript fallback engine in Node.js backend to guarantee zero downtime.

6. **Auditable Reporting & CSV Export**:
   - Filterable reports for milestones, tasks, and velocity with 1-click spreadsheet CSV export.

---

## 📂 System Architecture

```
TECH TRIX/
├── frontend/             # React 18, TypeScript, Vite, Recharts, Lucide Icons, Socket.IO Client
│   ├── src/
│   │   ├── components/   # Sidebar, Topbar, TaskModal, TaskDetailModal, ErrorBoundary
│   │   ├── context/      # AuthContext, ProjectContext
│   │   ├── pages/        # Landing, Projects, Tasks, Dependencies, Workload, Health, Reports, Auth
│   │   ├── services/     # Axios API Client, Socket.IO Manager
│   │   └── styles.css    # Dark-mode SaaS design system (#0b1020, #9b8cff)
├── backend/              # Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT, bcryptjs
│   ├── src/
│   │   ├── config/       # Database & environment configuration
│   │   ├── controllers/  # Auth, Projects, Milestones, Tasks, Dependencies, Workload, Health, Reports
│   │   ├── middleware/   # JWT Authentication, RBAC Matrix (Owner, Manager, Member, Reviewer)
│   │   ├── models/       # User, Project, Milestone, Task, Review, Blocker, Notification, ActivityEvent
│   │   ├── routes/       # Express route handlers
│   │   └── services/     # Analytics Bridge (FastAPI + TS Fallback), Socket.IO Broadcaster, Alert Cron
│   ├── scripts/          # Isolated demo seeder (seed.demo.ts) and reset script (seed.reset.ts)
│   └── tests/            # Automated integration tests (5 suites, 37 assertions, 100% pass)
├── analytics/            # Python 3.14, FastAPI, NetworkX, NumPy, Pytest
│   ├── app/
│   │   ├── algorithms/   # DAG topological sort, cycle detection, CPM critical path, delay propagation
│   │   ├── models/       # Pydantic analytical schemas
│   │   └── services/     # Workload rebalancer, contribution scoring, health evaluator
│   └── tests/            # Pytest test suite (9 assertions, 100% pass)
└── docs/                 # Operations Runbook, Architecture Blueprint, Decisions, and Audit Logs
```

---

## ⚡ Quick Start & Service Execution

### Prerequisites
- Node.js v20+ or v24+
- Python 3.10+ or 3.14+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Start MongoDB
Ensure your local MongoDB daemon is running:
```powershell
net start MongoDB
```

### 2. Start Backend API (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 3. Start Python Analytics Engine (Port 8000)
```bash
cd analytics
pip install -r requirements.txt
python run.py
```
*(Note: If the Python engine is not running, the backend automatically fails over to the native TypeScript analytics engine with zero downtime).*

### 4. Start Frontend Client (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing & Verification

Run all test suites across the backend and analytics engines:

```bash
# 1. Run all 5 backend integration test suites (37 assertions)
cd backend && npm test

# 2. Run Python analytics test suite (9 assertions)
cd analytics && python -m pytest tests/

# 3. Verify production compilation
cd frontend && npm run build
cd backend && npm run build
```

---

## 🗄️ Database Policy: Zero Mock Data vs Opt-In Seeding

TeamPulse AI follows a **strict zero-synthetic-data policy on boot**. When started fresh, the database is completely empty.

### Opt-In Demo Seeding (Optional)
To seed an evaluation scenario with 3 student software initiatives, 15 tasks, 5 team members, and audit history:
```bash
cd backend
npm run seed:demo
```
*Offline Demo Accounts:*
- **Project Owner**: `lead.owner@demo.local` / `DemoPassword123!`
- **Project Manager**: `manager.sarah@demo.local` / `DemoPassword123!`
- **Team Member**: `member.alex@demo.local` / `DemoPassword123!`
- **Reviewer**: `reviewer.priya@demo.local` / `DemoPassword123!`

### Complete Database Reset
To wipe the database back to clean zero-state:
```bash
cd backend
npm run seed:reset
```

---

## 🔒 Role-Based Access Control (RBAC) Matrix

| Capability / Action | Project Owner | Project Manager | Team Member | Reviewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Workspace & Analytics** | Full | Full | Full | Full |
| **Create Tasks & Milestones** | Full | Full | Full | View Only |
| **Edit Task Metadata** | Full | Full | Assigned Only (403 otherwise) | View Only |
| **Establish / Remove Dependencies** | Full | Full | Full | View Only |
| **Report / Resolve Blockers** | Full | Full | Full | View Only |
| **Request Peer Review** | Full | Full | Full | N/A |
| **Submit Review Decision (Approve/Reject)** | Full | Full | 403 Forbidden | Full |
| **Apply Advisory Workload Rebalancing** | Full | Full | 403 Forbidden | 403 Forbidden |
| **Manage Team Members & Roles** | Full (Sole-Owner Protection) | 403 Forbidden | 403 Forbidden | 403 Forbidden |
| **Archive Project** | Full | 403 Forbidden | 403 Forbidden | 403 Forbidden |

---

## 🎯 5-Minute Live Evaluation & Demo Walkthrough

Follow this step-by-step walkthrough using real user-created data:

1. **Public Landing & Registration**:
   - Open `http://localhost:5173/`.
   - Explore interactive feature sections (`#features`, `#how-it-works`, `#intelligence`, `#roles`, `#faq`).
   - Click **Get Started** and register a new account (e.g. `dr.jane@campus.edu`).
2. **Project Creation & Quality Gates**:
   - From the Projects Directory, click **+ New Project**.
   - Enter Name: `Autonomous Drone Swarm`, Code: `ADS`, Target Deadline: `2026-11-30`.
   - Check **Enforce Peer Review Gate (`requireReviewForDone`)**.
   - Submit. The new project card appears with the **Peer Review Gate Active** badge.
3. **Team Management & Tokenized Invitations**:
   - Click **Manage** on the project card.
   - Switch to **Team & Collaborators** tab.
   - Invite `reviewer.alex@campus.edu` with role **Reviewer**. Click **Send Invite**.
   - Copy the generated 7-day shareable invite link (`/invite?token=...`).
4. **Task Board & Finish-to-Start Dependencies**:
   - Open the workspace and navigate to the **Task Board**.
   - Create Task 1: `LiDAR Sensor Driver` (12 hours, High priority).
   - Create Task 2: `Path Planning Algorithm` (20 hours, Critical priority).
   - In **Dependencies**, click **Link Dependency**: link Task 2 to depend on Task 1.
   - Notice the DAG verification and Critical Path sequence.
5. **Interactive What-If Delay Propagation Simulation**:
   - On the Dependencies page, click **What-If Delay Simulation**.
   - Select `LiDAR Sensor Driver` and input a hypothetical delay of `16` hours.
   - Click **Run Simulation**. Observe the calculated project schedule slippage (+16h), updated duration, and cascading downstream impact.
6. **Enforced Quality Gate & Peer Review Cycle**:
   - On the Kanban Board, attempt to drag Task 2 to **Done**.
   - The transition is blocked with an alert: *Finish-to-Start dependency violation: Predecessor task is not yet completed*.
   - Move Task 1 to **In Review** and request a peer review.
   - Attempting to mark Task 1 as **Done** before review approval is blocked (*Review required*).
   - Reviewer approves the submission -> Task 1 transitions to **Done** -> Milestone automatically updates -> Task 2 can now be completed.
7. **Capacity Intelligence & Auditable Reports**:
   - Open **Team Workload** to review capacity bars, burnout warnings, and AI redistribution recommendations.
   - Open **Reports & CSV Export** and click **Export Tasks CSV** to download auditable deliverable records.

---

## 📚 Technical Documentation Index
- [Operations & Engineering Runbook](docs/RUNBOOK.md)
- [System Architecture & Algorithmic Blueprint](docs/ARCH.md)
- [Architectural Decisions Log](docs/DECISIONS.md)
- [Progress Verification Log](docs/PROGRESS.md)
- [Audit & Baseline Findings](docs/AUDIT.md)








