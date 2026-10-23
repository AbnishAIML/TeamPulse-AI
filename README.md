# TeamPulse AI — Intelligent Project Management & Team Contribution Analysis Platform

> **TechTrix'26 BONUS 02 — Software Engineering Project**  
> An intelligent project management platform that organizes projects, manages finish-to-start task dependencies with critical path scheduling, balances team workload, mitigates risks, and provides equitable, multi-signal contribution analysis for student software teams.

---

## 🚀 Key Highlights & Implemented Features

1. **Executive Dashboard**:
   - Live metrics: Total tasks, completion velocity, overdue tasks, and composite health index.
   - Interactive Recharts AreaChart (sprint velocity) and BarChart (team workload hours vs capacity).
   - Real-time notification center for task assignments, blocker alerts, and peer review sign-offs.

2. **Full-Featured Task Management**:
   - Multiple views: **Kanban Board** with 6 status columns (*Backlog*, *To Do*, *In Progress*, *In Review*, *Blocked*, *Done*), **Table / List View** with multi-parameter filtering, and **Timeline / Gantt View**.
   - Invalid state transition gates: Prevents marking a task as *Done* if peer reviews are pending or predecessors are incomplete.
   - Comprehensive task drawer: Finish-to-start dependencies, blocker reporting, review approvals, threaded discussion comments, and file attachments.

3. **Finish-to-Start DAG Dependencies & Critical Path Method (CPM)**:
   - Cycle detection: Prevents self-dependencies and cyclic loops with live feedback.
   - Topological sort into execution sequence.
   - Critical Path Identification: Calculates Early Start, Early Finish, Late Start, Late Finish, and Total Slack.
   - Distinguishes directly blocked tasks from downstream at-risk tasks.

4. **Intelligent Workload Analysis & Advisory Rebalancing**:
   - Configurable weekly member capacities (hours).
   - Utilization calculations with overload (>100%) and underutilization (<50%) alerts.
   - **AI Advisory Task Redistribution**: Constraint-aware task reallocation recommendations with 1-click human approval.

5. **Multi-Signal Fair Contribution Analysis**:
   - Replaces crude task-counting with 5 transparent dimensions: Task Completion Velocity, On-Time Commitments, Peer Review Stewardship, Problem Solving / Unblocking, and Estimation Precision.
   - Complete audit activity event ledger.

6. **Auditable Reporting & CSV Export**:
   - Filterable reports for milestones, tasks, and velocity.
   - 1-click CSV download for spreadsheets.

7. **Dual-Engine Resilience (Analytics Bridge)**:
   - High-performance Python FastAPI service with NetworkX graph algorithms.
   - Built-in TypeScript fallback engine in the Node.js backend to guarantee zero downtime.

---

## 📂 Architecture & Directory Structure

```
TECH TRIX/
├── frontend/             # React 18, TypeScript, Vite, Recharts, Lucide Icons, Socket.IO Client
│   ├── src/
│   │   ├── components/   # Sidebar, Topbar, TaskModal, TaskDetailModal
│   │   ├── context/      # AuthContext, ProjectContext
│   │   ├── pages/        # Overview, Tasks, Dependencies, Workload, Milestones, Contributions, Reports, Auth
│   │   ├── services/     # API Axios client, Socket.IO manager
│   │   └── styles.css    # Dark-mode SaaS design system
├── backend/              # Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT, bcrypt
│   ├── src/
│   │   ├── config/       # Database & environment settings
│   │   ├── controllers/  # Auth, Projects, Milestones, Tasks, Dependencies, Workload, Health, Reports
│   │   ├── middleware/   # JWT Authentication, RBAC (Owner, Manager, Member, Reviewer), Upload
│   │   ├── models/       # User, Project, Milestone, Task, Comment, Attachment, Activity, Notification
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Analytics Bridge (FastAPI + TS Fallback), Socket.IO Broadcaster, Activity Logger
│   │   └── seed/         # Demo scenario seed script
│   └── tests/            # Automated integration tests (5/5 passing)
├── analytics/            # Python 3.14, FastAPI, NetworkX, NumPy, Pytest
│   ├── app/
│   │   ├── algorithms/   # DAG topological sort, cycle detection, CPM critical path
│   │   ├── models/       # Pydantic schemas
│   │   └── services/     # Workload rebalancer, contribution scoring, health evaluator
│   └── tests/            # Pytest suite (7/7 passing)
├── docs/                 # Architecture, Setup Guide, API Specs, and Demo Script
└── package.json          # Unified orchestration script
```

---

## ⚡ Quick Start Commands

### 1. Seed Demo Database
```bash
npm run seed
```

### 2. Run Test Suites
```bash
npm run test
```
*(Runs both backend integration tests and analytics pytest suite)*

### 3. Start Services
- **Backend**: `cd backend && npm run dev` (Port 5000)
- **Analytics**: `cd analytics && python run.py` (Port 8000)
- **Frontend**: `cd frontend && npm run dev` (Port 5173)

Open **`http://localhost:5173`** and click any demo account under **"Instant Demo Sign-In"**!

---

## 📖 Complete Documentation Links
- [System Architecture & Algorithmic Formulas](file:///docs/ARCHITECTURE.md)
- [Setup & Configuration Guide](file:///docs/SETUP.md)
- [REST API Endpoints Specification](file:///docs/API.md)
- [Step-by-Step College Demonstration Script](file:///docs/DEMO_WORKFLOW.md)
