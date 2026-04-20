# 🚀 OpsPulse — Digital Operational System

> **A full-stack, real-time operational intelligence dashboard** for monitoring system health, managing incidents, tracking logs, and analyzing performance metrics — built for DevOps and SRE teams.

---

## 📌 What is OpsPulse?

**OpsPulse** is a professional-grade **Digital Operations Center** and **Operational Intelligence Platform**. It is designed to bridge the gap between complex system logs and actionable business insights by providing a unified interface for DevOps, SRE, and IT operations teams.

### 🎯 Aim of the Project
The primary aim of **OpsPulse** is to eliminate **Operational Blindness** in engineering teams. By aggregating disparate data sources—metrics, logs, and incidents—into a single, real-time "Command Center," the project aims to reduce **Mean Time to Detection (MTTD)** and **Mean Time to Recovery (MTTR)**, ensuring maximum system availability and performance.

### 🚀 Project Objectives
To achieve its aim, OpsPulse is built around five core pillars:
1.  **Observability**: Provide high-fidelity, real-time visibility into infrastructure and application health.
2.  **Incident Governance**: Standardize the incident management lifecycle from detection through to Root Cause Analysis (RCA).
3.  **Real-Time Intelligence**: Leverage WebSockets to stream live application telemetry directly to the browser.
4.  **Predictive Analysis**: Utilize historical data and trend modeling to forecast potential system failures before they occur.
5.  **Secure Collaboration**: Implement strict Role-Based Access Control (RBAC) to ensure only authorized personnel can manage critical infrastructure.

---

## 🧠 Problem Statement

Modern engineering teams suffer from **Operational Blindness**. In high-pressure production environments:
- **Logs are scattered** across distributed servers or terminals.
- **Incidents are tracked manually** in spreadsheets or disconnected chat tools.
- **Metrics lack context**, making it difficult to correlate CPU spikes with application errors.
- **There is no single source of truth**, leading to fragmented communication during outages.

OpsPulse was built to solve these challenges by centralizing the entire operational workflow into a single, cohesive dashboard.

### The Solution

| Problem | OpsPulse Solution |
|---|---|
| No visibility into system health | Live Dashboard with CPU, RAM, Disk gauges |
| Incidents tracked manually | Structured Incident Management with lifecycle states |
| Logs buried in server files | Real-time Log Monitor with search & filter |
| No performance history | Predictive Analytics with 7/14/30-day charts |
| No team accountability | On-Call Team widget + Incident Assignment |
| No audit trail | Activity Timeline of all system events |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React + TypeScript** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Interactive charts (Area, Bar, Pie, Line) |
| **Socket.IO Client** | Real-time log streaming |
| **jsPDF + xlsx** | Export reports as PDF / Excel / JSON |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe backend code |
| **MongoDB + Mongoose** | Database |
| **Socket.IO** | Real-time WebSocket communication |
| **JWT** | Authentication & authorization |
| **Nodemailer** | Email alert notifications |

### Deployment
| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting |
| **Railway / Render** | Backend hosting |
| **MongoDB Atlas** | Managed cloud database |

---

## 🌟 Key Features

### 🔐 Authentication & RBAC
- JWT-based login with persistent sessions
- Two roles: **Admin** (full control) and **Operator** (limited actions)
- Role-based UI rendering — operators cannot access admin-only pages
- Password change, profile picture upload, and name update

### 📊 Live Dashboard
- Auto-refreshes every **10 seconds**
- Displays: **System Uptime**, **Active Sessions**, **CPU Usage**, **Error Rate**
- Color-coded stat cards (green = healthy, amber = warning, red = critical)
- **System Health bars** for CPU Allocation, RAM Utilization, Disk Storage
- **Live incident feed** sorted by latest timestamp
- **On-Call Team** widget showing available responders

### 🚨 Incident Management
- Full incident lifecycle: `Active → Monitoring → Resolved`
- Severity tiers: `Critical`, `High`, `Medium`, `Low`
- **Admin** can: create, edit, acknowledge, assign incidents, generate PDF reports
- **Operator** can: resolve incidents assigned to them, view RCA
- Expand any incident row to see Root Cause Analysis + Resolution Steps
- AI-powered **RCA Modal** for resolved incidents
- **PDF Report** generation per incident

### 📋 Log Monitor (Real-Time)
- Streams live logs via **Socket.IO** without page refresh
- Filter by log level: `INFO`, `WARNING`, `ERROR`
- Full-text **search** with debounced input and keyword highlighting
- Summary count badges: `INFO — N`, `WARN — N`, `ERROR — N`, `TOTAL — N`
- **Export to CSV** for offline analysis
- Pause/Resume live stream toggle

### 📈 Predictive Analytics
- Date range selector: **7 days**, **14 days**, **30 days**, or **custom range**
- **Network Latency vs Uptime** — Area chart with brush zoom
- **Incident Taxonomy** — Donut/Pie chart showing error distribution by type
- **Error Trend Analytics (Hourly)** — Line chart of errors from real log data
- **Cluster Resource Allocation Efficiency** — Bar chart (utilized vs wasted)
- KPI summary cards: **MTTR**, **SLA Availability**, **Cost Efficiency**
- Export data as **PDF**, **XLSX**, or **JSON**
- **Recalculate Models** button to refresh live metrics

### 👥 User Management *(Admin only)*
- View all system users in a table
- **Provision New Identity** — create users with email, password, and role
- **Promote / Demote** between Admin and Operator roles
- **Suspend / Activate** user accounts
- **Reset** user passwords via admin prompt
- **Delete** users permanently (with confirmation)
- Self-protection: admins cannot modify or delete their own account

### ⚙️ Settings / System Preferences
- Upload and update profile picture (stored as Base64 in MongoDB)
- Update display name
- Change password with current password verification (show/hide toggle)
- Success/error feedback inline

### 🔔 Notifications
- Real-time notification bell in the header with unread count badge
- Notifications generated from system events and critical errors
- Email alerts sent for uncaught server exceptions and unhandled rejections

### 🕐 Activity Timeline
- Chronological feed of all significant system events
- Shown on the Dashboard for quick operational awareness

---

## 📂 Project Structure

```
opspulse---digital-operational-system/
│
├── client/                        # React frontend (Vite + TypeScript)
│   ├── components/
│   │   ├── Dashboard.tsx          # Main dashboard page
│   │   ├── Analytics.tsx          # Predictive analytics page
│   │   ├── Incidents.tsx          # Incident management page
│   │   ├── LogMonitor.tsx         # Real-time log stream page
│   │   ├── UserManagement.tsx     # Admin user management page
│   │   ├── Settings.tsx           # Profile & security settings page
│   │   ├── ActivityTimeline.tsx   # Activity feed widget
│   │   ├── OnCallTeam.tsx         # On-call roster widget
│   │   ├── Header.tsx             # Top navigation bar
│   │   ├── Sidebar.tsx            # Left navigation sidebar
│   │   ├── NotificationBell.tsx   # Notification indicator
│   │   ├── RCAModal.tsx           # Root Cause Analysis modal
│   │   ├── StatCard.tsx           # KPI metric card
│   │   └── LoginForm.tsx          # Authentication form
│   ├── services/                  # API service layer
│   └── .env                       # VITE_API_URL config
│
├── backend/                       # Node.js + Express API
│   ├── controllers/               # Route handler logic
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express route definitions
│   ├── middleware/
│   │   ├── metricsMiddleware.ts   # Tracks requests & failures
│   │   └── logMiddleware.ts       # HTTP request logging via Socket.IO
│   ├── utils/
│   │   ├── metricsTracker.ts      # In-memory uptime/error rate tracker
│   │   ├── logEvent.ts            # Saves logs to MongoDB
│   │   └── notificationUtils.ts   # Email alert sender
│   └── index.ts                   # Express + Socket.IO server entry
│
├── vercel.json                    # Vercel frontend deployment config
└── README.md
```

---

## 📏 How to Find System Uptime

System Uptime is calculated in real-time by the backend `metricsTracker` utility.

### How it works:
1. **Every HTTP request** is tracked by `metricsMiddleware.ts`
2. The tracker counts **total requests** and **failed requests** (status ≥ 500)
3. Uptime is derived from downtime percentage:

```
Uptime (%) = 100 - systemDowntime
```

If there is no downtime recorded: `Uptime = 100%`

### Where to see it:
| Location | What you see |
|---|---|
| **Dashboard → Stat Cards** | `System Uptime` card (top row, 1st card) — refreshes every 10s |
| **Analytics → Performance Chart** | Uptime trend plotted over 7/14/30 days |
| **Analytics → KPI Cards** | `SLA Availability` — 30-day rolling window |

### API Endpoint:
```
GET /api/metrics
```
Response includes:
```json
{
  "systemDowntime": 0.02,
  "cpuUsage": 34.5,
  "requests": 142,
  "errorRate": 1.3
}
```
> `Uptime = 100 - systemDowntime` → e.g. `100 - 0.02 = 99.98%`

---

## 📉 How to Find Error Rate

Error Rate is tracked automatically from live HTTP traffic.

### How it works:
1. `metricsMiddleware.ts` intercepts every response
2. Responses with **HTTP status ≥ 500** call `metricsTracker.incrementFailed()`
3. Error Rate is calculated as:

```
Error Rate (%) = (failedRequests / totalRequests) × 100
```

### Where to see it:
| Location | What you see |
|---|---|
| **Dashboard → Stat Cards** | `Error Rate` card (top row, 4th card) — color changes: 🟢 <2%, 🟡 2–5%, 🔴 >5% |
| **Log Monitor → Count Badges** | `ERROR — N` badge shows total error-level log count |
| **Log Monitor formula** | `(counts['error'] / logs.length) × 100` |
| **Analytics → Error Trend** | Hourly line chart of error events from log data |
| **Analytics → Incident Taxonomy** | Pie chart breaking down error types |

### API Endpoint:
```
GET /api/metrics/error-rate
```
Response:
```json
{
  "errorRate": 2.45
}
```

### Quick formula reference:
```
From Dashboard API:   errorRate = MetricsService.getErrorRate()
From Log Monitor UI:  (counts['error'] / logs.length) * 100
From Analytics page:  errors field in performanceData array
```

---

## 🖥️ Page-by-Page Guide

### 1. 🔑 Login Page
**File:** `LoginForm.tsx`

The entry point of the application. Users authenticate with email and password. On success, a JWT token is stored locally and the user is redirected based on their role.

- Validates credentials against MongoDB via `/api/auth/login`
- Shows error alerts for invalid credentials
- Remembers session via localStorage

---

### 2. 📊 Dashboard
**File:** `Dashboard.tsx`

The **command center** of OpsPulse. Gives a full operational overview at a glance.

**Sections:**
- **Top KPI Cards (4 cards):**
  - `System Uptime` — Live % uptime
  - `Active Sessions` — Current request count
  - `CPU Usage` — Current CPU % utilization
  - `Error Rate` — % of failed requests (color-coded)
- **Activity Timeline** — Chronological system event feed (left column)
- **On-Call Team** — Current responders on duty (right column)
- **System Health Bars** — CPU, RAM, Disk utilization gauges
- **System Status Badge** — "All Systems Operational" or "Attention Required"

> Refreshes automatically every **10 seconds**.

---

### 3. 🚨 System Incidents
**File:** `Incidents.tsx`

Full **incident lifecycle management** — from detection to resolution to post-mortem.

**Features:**
- Searchable, filterable table (`All / Active / Monitoring / Resolved`)
- Each incident row expands to reveal:
  - Affected Services
  - Root Cause Analysis
  - Resolution Protocol (numbered steps)
  - Assignment Metadata
- **Admin actions:** Report, Edit, Acknowledge, Assign operator, Generate PDF
- **Operator actions:** Resolve assigned incidents
- **RCA Button:** Opens the AI-assisted Root Cause Analysis modal for resolved incidents

**Severity Tiers:**
| Tier | Color | Meaning |
|---|---|---|
| Critical | 🔴 Red | Service down, immediate action |
| High | 🟠 Orange | Significant degradation |
| Medium | 🟡 Amber | Partial impact |
| Low | 🟢 Green | Minor, non-urgent |

---

### 4. 📋 Log Monitor
**File:** `LogMonitor.tsx`

A **real-time log streaming terminal** powered by Socket.IO.

**Features:**
- Live stream of application logs — new entries appear instantly via WebSocket
- Filters: `All`, `Info`, `Warning`, `Error`
- Search bar with 400ms debounce + keyword highlighting in results
- Count badges: `INFO`, `WARN`, `ERROR`, `TOTAL`
- Max 100 logs displayed at a time (rolling window)
- **Export CSV** button to download current visible logs
- Pause/Resume stream toggle
- Auto-scroll to latest entry

---

### 5. 📈 Predictive Analytics
**File:** `Analytics.tsx`

Deep-dive performance analysis with **interactive Recharts visualizations**.

**Charts:**
| Chart | Type | Data |
|---|---|---|
| Network Latency vs Uptime | Area Chart | Per-day latency (ms) and uptime % |
| Incident Taxonomy | Donut Chart | Error event distribution by type |
| Error Trend Analytics | Line Chart | Hourly error count from real logs |
| Cluster Resource Allocation | Bar Chart | Utilized vs wasted resource % by region |

**Controls:**
- Date range: `7D`, `14D`, `30D`, or custom start/end dates
- Brush zoom on charts for focused time windows
- Export: `PDF`, `XLSX`, or `JSON`
- `Recalculate Models` — fetches fresh live metrics

**KPI Cards:**
- `MTTR` — Mean Time To Recovery (18m avg)
- `SLA Availability` — 30-day rolling uptime %
- `Cost Efficiency` — Resource utilization score

---

### 6. 👥 Identity Management *(Admin only)*
**File:** `UserManagement.tsx`

Full **user lifecycle management** for the OpsPulse platform.

**Features:**
- View all registered users in a table
- **Provision New Identity** — Create user (email + password + role)
- **Promote/Demote** role between Admin and Operator
- **Suspend/Activate** account status
- **Reset Password** via admin prompt
- **Delete** user permanently
- Admins are protected from modifying their own account

> Operators who navigate here will see an "Unauthorized Access" screen.

---

### 7. ⚙️ System Preferences
**File:** `Settings.tsx`

Personal account configuration page, available to all logged-in users.

**Sections:**
- **Profile Identity:** Upload a new profile picture (saved to database)
- **Security Credentials:** Change password with current password verification

---

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas URI or local MongoDB instance

### 1. Clone the repo
```bash
git clone <repo-url>
cd opspulse---digital-operational-system
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@yourcompany.com
FRONTEND_URL=http://localhost:3000
```

Start the backend:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🌐 Production Deployment

| Service | URL |
|---|---|
| **Frontend (Vercel)** | `https://digital-operational-dashboard.vercel.app` |
| **Backend (Railway)** | `https://digital-operational-dashboard-production.up.railway.app` |

---

## 🔌 API Reference (Summary)

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Login and receive JWT |
| `/api/metrics` | GET | Get CPU, uptime, error rate |
| `/api/metrics/error-rate` | GET | Get live error rate % |
| `/api/incidents` | GET/POST | List or create incidents |
| `/api/incidents/:id` | PUT | Update incident status |
| `/api/logs` | GET | Fetch application logs |
| `/api/users` | GET/POST | List or create users |
| `/api/dashboard/analytics` | GET | Get chart data by date range |
| `/api/rca/:id` | GET | Get RCA for a resolved incident |
| `/api/reports/:id` | GET | Generate PDF report |
| `/api/activity` | GET | Get activity timeline events |
| `/api/notifications` | GET | Get notifications |

---

## 👤 Default Admin Account

On first launch, the backend seeds a default admin account via `backend/config/seed.ts`.

> Check your `.env` for `ADMIN_EMAIL` and `ADMIN_PASSWORD` or set them before first run.

---

## 📄 License

This project is for educational and portfolio purposes.

---

*Built with ❤️ — OpsPulse Digital Operational System*
