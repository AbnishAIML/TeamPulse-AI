# TeamPulse AI — REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Login and receive JWT token | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Bearer Token |
| `PUT` | `/auth/profile` | Update profile, weekly capacity, skills | Bearer Token |

---

## 2. Projects (`/api/projects`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | List projects user belongs to | Bearer Token |
| `POST` | `/projects` | Create new project initiative | Bearer Token |
| `GET` | `/projects/:id` | Get project details, milestones, task counts | Bearer Token |
| `PUT` | `/projects/:id` | Update project metadata | Project Owner/Manager |
| `DELETE` | `/projects/:id` | Archive project | Project Owner |
| `POST` | `/projects/:id/members` | Add team member with role | Project Owner/Manager |
| `PUT` | `/projects/:id/members/:mId` | Update member role or capacity | Project Owner/Manager |
| `DELETE` | `/projects/:id/members/:mId` | Remove member from project | Project Owner |

---

## 3. Milestones (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/milestones` | Get milestones with auto-calculated progress | Bearer Token |
| `POST` | `/projects/:id/milestones` | Create milestone with criteria checklist | Project Owner/Manager |
| `PUT` | `/milestones/:id` | Update milestone | Bearer Token |
| `DELETE` | `/milestones/:id` | Delete milestone | Project Owner/Manager |

---

## 4. Tasks (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/tasks` | List tasks (filter by status, assignee, priority) | Bearer Token |
| `POST` | `/projects/:id/tasks` | Create task with estimated effort & dependencies | Bearer Token |
| `GET` | `/tasks/:id` | Get task details, successors, blocker info | Bearer Token |
| `PUT` | `/tasks/:id` | Update task details & logged hours | Bearer Token |
| `PATCH` | `/tasks/:id/status` | Update task status (validates reviews & blockers) | Bearer Token |
| `POST` | `/tasks/:id/blocker` | Report blocker with severity and reason | Bearer Token |
| `POST` | `/tasks/:id/resolve-blocker` | Mark blocker as resolved | Bearer Token |
| `DELETE` | `/tasks/:id` | Delete task | Bearer Token |

---

## 5. DAG Dependencies & Critical Path (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/dependencies` | Returns DAG, cycles, topological order, CPM | Bearer Token |
| `POST` | `/tasks/:id/dependencies` | Add finish-to-start predecessor (with cycle check)| Bearer Token |
| `DELETE`| `/tasks/:id/dependencies/:pId` | Remove predecessor dependency | Bearer Token |

---

## 6. Workload & Rebalancing (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/workload` | Member capacity vs hours, utilization %, advisory recs | Bearer Token |
| `POST` | `/projects/:id/workload/reassign` | Apply approved advisory task redistribution | Project Owner/Manager |

---

## 7. Contributions & Audit (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/contributions` | Multi-dimensional contribution indicators | Bearer Token |
| `GET` | `/projects/:id/activity` | Immutable audit activity event stream | Bearer Token |
| `GET` | `/projects/:id/health` | Composite health score (0-100) & recommendations| Bearer Token |

---

## 8. Collaboration, Reviews & Reports (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks/:id/comments` | List task discussion comments | Bearer Token |
| `POST` | `/tasks/:id/comments` | Add comment to task | Bearer Token |
| `POST` | `/tasks/:id/review/request` | Submit deliverable for peer review | Bearer Token |
| `POST` | `/tasks/:id/review/decision`| Approve or reject review with feedback | Reviewer/Manager |
| `GET` | `/tasks/:id/attachments` | List task file attachments | Bearer Token |
| `POST` | `/tasks/:id/attachments` | Upload file attachment | Bearer Token |
| `GET` | `/attachments/:id/download` | Authorized file download | Bearer Token |
| `GET` | `/notifications` | Get in-app alerts and unread count | Bearer Token |
| `PATCH`| `/notifications/read-all` | Mark all notifications as read | Bearer Token |
| `GET` | `/projects/:id/reports/summary`| Aggregate progress and delivery metrics | Bearer Token |
| `GET` | `/projects/:id/reports/export-csv`| Download tasks or milestones CSV | Bearer Token |
