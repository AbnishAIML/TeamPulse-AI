# TeamPulse AI — Setup & Installation Guide

This guide walks through configuring and running the **TeamPulse AI** platform locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (Tested on Node.js v24.20.0)
- **npm**: v9.0.0 or later
- **Python**: v3.10 or later (Tested on Python 3.14.8)
- **MongoDB**: Local MongoDB community server (listening on default port `27017`) or MongoDB Atlas URI

---

## 2. Directory Structure

```
TECH TRIX/
├── frontend/             # React 18 + Vite frontend
├── backend/              # Node.js + Express + TypeScript + Socket.IO REST API
├── analytics/            # Python + FastAPI + NetworkX intelligent engine
├── docs/                 # Documentation & API specifications
└── package.json          # Root orchestration script
```

---

## 3. Quick Start (All Services)

### Step 1: Install Dependencies
Open a terminal in the root directory:
```bash
# Install root, backend, and frontend packages
npm run build
```
Or individually:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ../analytics && python -m pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
- In `backend/`: Copy `.env.example` to `.env` (already pre-configured for local development):
  ```env
  PORT=5000
  MONGODB_URI=mongodb://127.0.0.1:27017/teampulse_db
  JWT_SECRET=teampulse_ai_super_secret_jwt_key_2026
  JWT_EXPIRES_IN=7d
  ANALYTICS_SERVICE_URL=http://localhost:8000
  CLIENT_URL=http://localhost:5173
  ```

### Step 3: Seed the Demonstration Database
Populate the database with realistic demo data (overloaded member, active blocker, critical path, overdue item):
```bash
npm run seed
```
*(Runs `tsx src/seed/seedData.ts` in the backend)*

### Step 4: Run the Test Suites
Verify algorithmic correctness and API validation:
```bash
npm run test
```
This runs both:
1. Backend integration tests (5/5 passing)
2. Python analytics test suite (7/7 passing)

---

## 4. Running the Application

To run the complete platform, start the three services in separate terminals:

### Terminal 1: Backend API (Port 5000)
```bash
cd backend
npm run dev
```

### Terminal 2: Analytics Engine (Port 8000)
```bash
cd analytics
python run.py
```

### Terminal 3: Frontend Web App (Port 5173)
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Demo Accounts

The database comes pre-seeded with 4 student team personas:

| Name | Role | Email | Password | Workload State |
| :--- | :--- | :--- | :--- | :--- |
| **Ankit Kumar** | Project Owner / Lead | `ankit@teampulse.ai` | `password123` | Active sprint lead (20h capacity) |
| **Rahul Sharma** | Senior Developer | `rahul@teampulse.ai` | `password123` | **Overloaded (24h assigned / 20h capacity)** |
| **Priya Mehta** | Frontend Engineer | `priya@teampulse.ai` | `password123` | **Blocked task (waiting on WebSocket schema)** |
| **Arjun Verma** | QA & Reviewer | `arjun@teampulse.ai` | `password123` | **Underutilized (9h assigned / 20h capacity)** |

*Tip: The Login page contains 1-click quick login buttons for each user for instant switching during live evaluation!*
