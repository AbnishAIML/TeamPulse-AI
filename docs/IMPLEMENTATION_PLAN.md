# Implementation Plan: TeamPulse AI

An intelligent project management and team contribution analysis platform designed for student software teams, featuring real-time collaboration, finish-to-start DAG dependency management, critical path analysis, intelligent workload balancing, and multi-factor contribution analytics.

---

## 1. Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │            Frontend (React + Vite)           │
                      │  TypeScript, Tailwind/Vanilla CSS, Recharts  │
                      │   Kanban, DAG Graph, Timelines, Reports CSV  │
                      └───────────────────────┬──────────────────────┘
                                              │ HTTP / REST + Socket.IO
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │          Backend (Node.js + Express)         │
                      │   TypeScript, JWT Auth, RBAC, Mongoose ORM   │
                      │    Socket.IO Real-Time, Audit Event Logger   │
                      └──────────────┬──────────────────┬────────────┘
                                     │                  │
               Mongoose Query / BSON │                  │ HTTP JSON API
                                     ▼                  ▼
                     ┌──────────────────┐    ┌───────────────────────────┐
                     │  MongoDB Server  │    │ Analytics (Python+FastAPI)│
                     │  Local / Atlas   │    │ NetworkX DAG, Critical    │
                     │  (Port 27017)    │    │ Path, Workload Rebalance  │
                     └──────────────────┘    └───────────────────────────┘
```

---

## 2. Directory Structure

```
TECH TRIX/
├── frontend/             # React 18 + Vite + TS frontend (migrated & extended from teampulse-ai-frontend)
│   ├── src/
│   │   ├── components/   # UI components (Navbar, Sidebar, Modals, StatCards, Gantt, DAGView, Kanban)
│   │   ├── context/      # AuthContext, ProjectContext, SocketContext
│   │   ├── pages/        # Dashboard, Projects, Tasks, Milestones, Dependencies, Workload, Team, Reports
│   │   ├── services/     # API client, Socket client, Export utilities
│   │   └── types/        # TypeScript interfaces
│   └── package.json
├── backend/              # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/       # Database & environment configuration
│   │   ├── controllers/  # Auth, Projects, Tasks, Milestones, Workload, Analytics, Reports, Comments
│   │   ├── middleware/   # Auth (JWT), RBAC permissions, Error handler, Upload
│   │   ├── models/       # User, Project, Milestone, Task, Comment, Attachment, Activity, Notification
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Analytics bridge (FastAPI client + TS fallback), Socket emitter, Audit logger
│   │   └── utils/        # Seed data script, CSV generator
│   ├── tests/            # Integration & unit tests
│   └── package.json
├── analytics/            # Python 3.14 + FastAPI intelligent engine
│   ├── app/
│   │   ├── main.py       # FastAPI application & CORS
│   │   ├── algorithms/   # DAG, Topological Sort, Critical Path Method (CPM), Delay propagation
│   │   ├── models/       # Pydantic input/output schemas
│   │   └── services/     # Workload rebalancer, Contribution scoring, Project health evaluator
│   ├── tests/            # Pytest test suite for graph and scoring algorithms
│   └── requirements.txt
├── docs/                 # Architecture, API specifications, and User Guide
└── package.json          # Root scripts to install, build, seed, and run all services
```

---

## 3. Implementation Phases

### Phase 1: Directory Setup & Codebase Migration
- Carefully preserve and migrate `teampulse-ai-frontend` into `frontend/`.
- Ensure dark-mode aesthetic, Manrope/DM Sans typography, and existing styles are retained and enhanced.
- Initialize root `package.json` for unified orchestration.

### Phase 2: Python FastAPI Analytics Engine (`analytics/`)
- Implement Finish-to-Start DAG algorithms with NetworkX:
  - Cycle detection & self-dependency prevention
  - Topological sort & slack/float calculation
  - Critical Path identification
  - Delay propagation & root-cause blocker attribution
- Implement Workload Balancing & Advisory Reallocation recommendations:
  - Utilization % calculation with safe zero-division handling
  - Constraint-aware task redistribution suggestions (skills/tags, priority, capacity, dependencies)
- Implement Multi-factor Contribution Engine:
  - Transparent indicators (completed vs assigned, effort accuracy, reviews approved, blockers solved, timeliness)
- Implement Project Health Composite Score (0-100) and actionable recommendations.
- Write and run unit tests with `pytest`.

### Phase 3: Backend API & Real-time Server (`backend/`)
- Set up TypeScript + Express + Mongoose + Socket.IO server.
- Define robust Mongoose models with validation and indexes:
  - `User`, `Project`, `Milestone`, `Task`, `Comment`, `Attachment`, `ActivityEvent`, `Notification`, `CapacitySetting`.
- Implement JWT auth with bcrypt and Role-Based Access Control (Owner, Project Manager, Member, Reviewer).
- Implement complete REST routes:
  - Auth, Projects, Milestones, Tasks (with status transitions & review gates), Dependencies, Workload, Comments, Reviews, Reports (with CSV export), Notifications.
- Connect to Analytics engine via HTTP with automatic fallback to internal algorithms if analytics service is offline.
- Add Socket.IO rooms for live real-time updates.
- Create rich demo seed script (`npm run seed`) with realistic scenario.

### Phase 4: Frontend Enhancement (`frontend/`)
- Modern React + TypeScript routing:
  - **Overview / Dashboard**: Live metrics, completion trend chart, workload bar chart, health score gauge, AI recommendations, recent tasks.
  - **Task Board**: Kanban view (Backlog, To Do, In Progress, In Review, Blocked, Done) with drag/drop & filters; List/Table view; Calendar/Timeline view.
  - **Dependencies View**: Interactive DAG visualization showing predecessor/successor links, critical path highlight, cycle validation, and blocker propagation.
  - **Workload Analysis View**: Capacity vs assigned charts, utilization gauges, overload warnings, and AI Advisory Reallocation modal with "Approve Reassignment" action.
  - **Milestones View**: Milestone cards with automatic progress tracking from tasks, overdue badges, completion criteria.
  - **Contribution Analysis View**: Fair multi-factor individual & team contribution radar/bar breakdown, transparent explanation labels, activity timeline.
  - **Reports View**: Progress, Milestone delivery, Overdue, Workload, Blocker, Risk reports with 1-click CSV download.
  - **Task Detail & Collaboration**: Comments thread, file attachment upload, blocker reporting, review request & approve/reject modal.
  - **Notification Center**: Real-time alerts for blockers, overdues, review requests, task assignments.

### Phase 5: Verification, Testing & Polish
- Run TypeScript checks across backend and frontend.
- Run Python test suite with pytest.
- Verify live MongoDB persistence, seed data, and end-to-end functionality.
- Deliver comprehensive documentation in `docs/`.
