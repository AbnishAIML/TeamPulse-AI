# TeamPulse AI — Operations & Engineering Runbook

**Document:** `docs/RUNBOOK.md`  
**Version:** 1.0.0 (Production)  
**System:** TeamPulse AI (Intelligent Project Management & Team Contribution Analytics)

---

## 1. System Architecture Overview & Port Map

TeamPulse AI operates as a resilient three-tier microservice application:

```
[ Browser / Client ] ──── (HTTP/WS :5173) ────> [ React 18 Frontend (Vite) ]
                                                        │
                                                        │ (REST / Socket.IO :5000)
                                                        ▼
                                            [ Node.js/Express Backend ]
                                               │                    │
                    (HTTP :8000 / Bridge)      │                    │ (Mongoose :27017)
                               ▼               │                    ▼
                  [ Python FastAPI Analytics ] │           [ MongoDB Database ]
                  (w/ TS Native Fallback) ─────┘           (teampulse_db)
```

| Service | Technology | Default Port | Health Check / Endpoint |
| :--- | :--- | :---: | :--- |
| **Frontend** | React 18, Vite | `5173` | `http://localhost:5173/` |
| **Backend API** | Node.js, Express, TypeScript | `5000` | `http://localhost:5000/api/health` |
| **Analytics Engine** | Python 3.14, FastAPI | `8000` | `http://localhost:8000/health` |
| **Database** | MongoDB 6+ / 7+ | `27017` | `mongodb://127.0.0.1:27017/teampulse_db` |

---

## 2. Prerequisites & Local Environment Setup

### Software Requirements
- **Node.js**: v20+ or v24+ (`node -v`)
- **npm**: v9+ or v10+ (`npm -v`)
- **Python**: v3.10+ or v3.14+ (`python --version`)
- **MongoDB**: Community Server running locally or accessible via URI (`mongod`)

### Environment Variables
Each service reads configuration from its own `.env` file created from `.env.example`:

1. **Backend (`backend/.env`)**:
   ```ini
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/teampulse_db
   JWT_SECRET=teampulse_ai_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=15m
   REFRESH_SECRET=teampulse_ai_refresh_secret_key_2026
   REFRESH_EXPIRES_IN=30d
   CLIENT_URL=http://localhost:5173
   ANALYTICS_SERVICE_URL=http://localhost:8000
   ANALYTICS_TIMEOUT_MS=3500
   STORAGE_DRIVER=local
   UPLOAD_DIR=uploads
   MAX_UPLOAD_MB=10
   ```

2. **Frontend (`frontend/.env`)**:
   ```ini
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. **Analytics (`analytics/.env`)**:
   ```ini
   PORT=8000
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
   ```

---

## 3. Step-by-Step Service Startup

### Terminal 1: MongoDB Service
Ensure MongoDB is running locally:
```bash
# Windows (PowerShell / Command Prompt)
net start MongoDB
# Or verify daemon process:
Get-Process mongod -ErrorAction SilentlyContinue
```

### Terminal 2: Backend Node.js API
```bash
cd backend
npm install
npm run dev
```
*Expected log output:*
```
[MongoDB] Connected successfully to host: 127.0.0.1, database: teampulse_db
[TeamPulse Backend] Server running on port 5000
[Socket.IO] Real-time engine mounted
```

### Terminal 3: Python FastAPI Analytics Service
```bash
cd analytics
pip install -r requirements.txt
python run.py
```
*Expected log output:*
```
INFO:     Started server process [8000]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```
> **Note on Dual-Engine Fallback:** If the Python service is stopped, the backend automatically detects the timeout and seamlessly executes native TypeScript graph algorithms with zero downtime.

### Terminal 4: Frontend Vite Client
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 4. Database Operations & Seeding

TeamPulse AI follows a **strict zero-synthetic-data policy on boot**. When started fresh, the database is completely empty.

### Opt-in Demo Data Seeding (Optional)
To seed an evaluation scenario (3 projects, 15 tasks, 5 team members, and audit history):
```bash
cd backend
npm run seed:demo
```
*Demo User Credentials (for offline testing):*
- **Owner**: `lead.owner@demo.local` / `DemoPassword123!`
- **Manager**: `manager.sarah@demo.local` / `DemoPassword123!`
- **Member**: `member.alex@demo.local` / `DemoPassword123!`
- **Reviewer**: `reviewer.priya@demo.local` / `DemoPassword123!`

### Complete Database Reset
To wipe the database back to clean zero-state:
```bash
cd backend
npm run seed:reset
```

---

## 5. Automated Test Suite Execution

Run the complete automated regression and audit test suite:

### Backend Integration Tests (All 5 Suites)
```bash
cd backend
npm test
```
*Executes:*
1. `tests/api.test.ts`: Base auth, password hashing, and project creation.
2. `tests/stage3_rbac_transitions.test.ts`: Refresh token rotation, RBAC 403 enforcement, sole-owner 400 protection, Finish-to-Start 422 enforcer.
3. `tests/stage4_analytics_parity.test.ts`: CPM DAG forward/backward pass, cycle detection, delay propagation, workload rebalancing, and contribution index parity.
4. `tests/stage5_notifications_realtime.test.ts`: `ActivityEvent` append-only immutability, notification `dedupKey` uniqueness, blocker/review synchronization, and alert cron.
5. `tests/stage6_userflow_audit.test.ts`: Full 11-step end-to-end user-flow audit.

### Python Analytics Tests
```bash
cd analytics
python -m pytest tests/
```
*Expected:* `9 passed in 0.43s`

### Production Bundle Verification
```bash
# Frontend production build
cd frontend && npm run build

# Backend TypeScript compilation
cd backend && npm run build
```

---

## 6. Troubleshooting Common Issues

### Issue 1: Port 5000 Already In Use (`EADDRINUSE`)
- **Symptom:** Backend process warns `Port 5000 in use`.
- **Resolution:** Backend `src/index.ts` has built-in error handling (`server.on("error")`) allowing parallel test execution without crash. To kill lingering Node processes on Windows:
  ```powershell
  Get-Process node | Stop-Process -Force
  ```

### Issue 2: MongoDB Connection Refused (`ECONNREFUSED 127.0.0.1:27017`)
- **Symptom:** Backend logs `Failed to connect to MongoDB`.
- **Resolution:** Check if mongod service is active:
  ```powershell
  Get-Service -Name MongoDB
  Start-Service -Name MongoDB
  ```

### Issue 3: Python Analytics Service Not Starting
- **Symptom:** `FastAPI unavailable` in backend logs.
- **Resolution:** No action required for core operations. TeamPulse AI features a resilient TypeScript native fallback (`AnalyticsBridge.ts`) that executes all CPM, DAG, workload, and delay algorithms identically. To restart Python:
  ```powershell
  cd analytics; pip install -r requirements.txt; python run.py
  ```

### Issue 4: Refresh Token Rotation Rejection (HTTP 401)
- **Symptom:** Multiple simultaneous refresh requests reject old tokens.
- **Resolution:** TeamPulse AI implements cryptographic one-time refresh token rotation (`crypto.randomUUID()` `jti`). The frontend Axios response interceptor (`frontend/src/services/api.js`) automatically queues parallel requests during token refreshes to prevent race conditions.

---

## 7. Operational Health Checklist

- [x] All 3 services start cleanly without warnings.
- [x] Fresh database operates with zero mock or synthetic records.
- [x] User registration, login, and refresh token rotation verified.
- [x] Finish-to-Start DAG dependency constraints return HTTP 422 on premature completion.
- [x] Quality Gate (`requireReviewForDone`) blocks unapproved task completion with HTTP 422.
- [x] Activity audit ledger strictly rejects updates and deletions (append-only immutability).
- [x] Interactive What-If Delay Propagation Simulation calculates schedule slippage and cascading downstream delays.
- [x] CSV report export downloads well-formed CSV files for spreadsheet auditing.
