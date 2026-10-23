# TeamPulse AI — College Demonstration Script

This walkthrough script demonstrates all key capabilities of the **TeamPulse AI** platform for evaluators, project reviewers, and software viva examiners.

---

## Step 1: Sign-In via Evaluation Mode

1. Navigate to `http://localhost:5173`.
2. Notice the sleek dark SaaS login portal.
3. Under **"Instant Demo Sign-In (Evaluation Mode)"**, click **"Ankit Kumar (Project Owner)"**.
4. You are instantly logged in with full admin and project owner privileges.

---

## Step 2: Executive Overview Dashboard

1. **Live Metrics**: Observe the four primary stat cards:
   - *Total Tasks*: 13 tasks loaded directly from MongoDB.
   - *Completed Tasks*: 5 tasks completed (38% velocity).
   - *Overdue Tasks*: 1 high-priority overdue task identified.
   - *Project Health*: Score **72/100 (At Risk)** due to 1 active blocker.
2. **Project Progress Area Chart**: Shows completed tasks vs newly created tasks over the sprint.
3. **Project Health Gauge**: Displays the composite health ring (72/100) with scope progress (38%) and capacity utilization (78%).
4. **Team Workload Bar Chart**: Visually shows **Rahul Sharma operating over capacity (24h assigned vs 20h capacity)**.

---

## Step 3: Task Board & Multi-View Management

1. Click **"Task Board"** in the left sidebar.
2. Observe the **Kanban Board** with 6 status columns: *Backlog*, *To Do*, *In Progress*, *In Review*, *Blocked*, *Done*.
3. Notice Task 7: **"Connect dashboard charts with live analytics API"** clearly flagged with a red **`BLOCKED`** badge.
4. Click the view switcher to switch from **Kanban** to **Table View**:
   - Filter by Milestone (*M2: Core API & Real-time Integration*).
   - Filter by Priority (*Critical*).
5. Switch to **Timeline View**:
   - Displays task duration bars and predecessor sequencing.

---

## Step 4: Finish-to-Start DAG Dependencies & Critical Path

1. Click **"DAG Dependencies"** in the sidebar.
2. Observe the **Zero Cycles Verification Banner**:
   - Displays 13 tasks topologically sorted into execution order.
   - Total estimated project duration: **18 hours**.
3. Inspect the **Critical Path Section**:
   - Shows the sequence of tasks with **0 hours of slack**:
     `Task 2 (Auth API)` ➔ `Task 4 (DAG Service)` ➔ `Task 5 (CPM Algorithm)`.
   - Explains that any delay on these three tasks directly slips the final college demo deadline.
4. Inspect the **Blocker Root-Cause Analysis**:
   - **Directly Blocked Task**: *Connect dashboard charts* (Blocked by *Develop real-time Socket.IO notification channel*).
   - **At-Risk Downstream Task**: *Implement task redistribution modal* (Blocked because its predecessor is blocked).
5. **Demonstrate Cycle Prevention**:
   - Click **"Link Dependency"**.
   - Attempt to link a task in reverse (e.g., Task 2 depending on Task 5).
   - Observe the live cycle prevention feedback blocking circular loops.

---

## Step 5: Intelligent Workload Balancing & Advisory Reallocation

1. Click **"Team Workload"** in the sidebar.
2. Observe the Member Utilization breakdown:
   - **Rahul Sharma**: Over capacity at **120% utilization (24h remaining / 20h capacity)** with red warning badge.
   - **Arjun Verma**: Underutilized at **30% utilization (6h remaining / 20h capacity)** with headroom badge.
3. Inspect the **AI Advisory Task Redistribution Recommendations**:
   - Recommends reassigning *Task 12: Optimize database query indexes* (6h) from **Rahul Sharma** to **Arjun Verma**.
   - Displays transparent rationale: Rahul's utilization will drop from 120% to 90%, and Arjun will increase from 30% to 60%, achieving optimal team balance.
4. Click **"Approve & Reassign"**:
   - The task is reassigned in MongoDB.
   - The workload bars recalculate immediately.
   - An audit activity event is logged.

---

## Step 6: Multi-Signal Fair Team Contribution Analysis

1. Click **"Contribution & Audit"** in the sidebar.
2. Observe the **Methodology Statement**:
   - Explains that individuals are not ranked by simplistic task counts or raw hours logged.
3. Inspect the **5-Dimensional Multi-Bar Comparison Chart**:
   - Task Completion Velocity
   - On-Time Commitments
   - Peer Review Stewardship
   - Problem Solving & Blocker Unblocking
   - Estimation Precision
4. Inspect the **Individual Contribution Cards**:
   - Displays transparent score breakdowns (e.g. Priya with strong problem solving, Arjun with high review stewardship).
5. Scroll to the **Chronological Audit Activity Feed**:
   - Shows real-time immutable events for blocker reports, task completions, and workload reallocations.

---

## Step 7: Auditable Reports & CSV Export

1. Click **"Export Reports"** in the sidebar.
2. Switch between **Tasks & Velocity Report** and **Milestones Delivery Report**.
3. Click **"Export Tasks CSV"**:
   - Browser immediately downloads `TPAI_tasks_report.csv` formatted with task IDs, deadlines, remaining hours, and review statuses for Excel or Google Sheets.

---

## Step 8: Blocker Resolution & Review Approval Flow

1. Click on **Task 7** (*Connect dashboard charts*) to open the detail drawer.
2. View the active blocker banner: *"Awaiting Socket.IO live analytics event schema"*.
3. Click **"Mark Blocker Resolved"**:
   - The task returns to *In Progress*.
   - A notification is sent across the team.
4. Check Task 10 (*Review & approve analytics bridge data contracts*):
   - Notice status *In Review*.
   - Click **"Approve Deliverable"**:
   - The task moves to *Done*, logged hours are finalized, and progress updates.
