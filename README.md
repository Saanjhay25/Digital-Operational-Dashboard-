# OpsPulse: Digital Operational System

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

**OpsPulse** is a premium, real-time operational command center designed for modern DevOps and SRE teams. It provides a unified interface for system surveillance, incident management, and infrastructure monitoring.

## 🚀 Key Features

- **Real-time Command Center**: Live telemetry for CPU, RAM, and Disk utilization with correlated metrics.
- **Incident Lifecycle Management**: Robust tracking of system disruptions with root cause analysis and resolution protocols.
- **Advanced Log Aggregator**: Intelligent filtering and monitoring of system-wide logs.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Administrators** (Identity & Governance) and **Operators** (Active Monitoring).
- **Proactive Alerting**: Automatic incident creation and notifications based on error log frequency and severity.
- **Infrastructure & Security Insights**: Dedicated modules for domain-specific surveillance.

## 🛠 Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for optimized building
- **Tailwind CSS** for premium styling
- **Recharts** for dynamic operational visualization
- **Lucide React** for consistent iconography

### Backend
- **Node.js** with **Express**
- **MongoDB** with **Mongoose**
- **JWT** for secure administrative sessions
- **Nodemon** for rapid development

## 🔧 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally or hosted)
- Gemini AI API Key (for advanced analytics features)

### Local Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd opspulse---digital-operational-system
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_secret
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Database Seeding** (Optional):
   ```bash
   npm run seed
   ```

4. **Run the Application**:
   Open two terminals:
   - **Backend**: `npm run server`
   - **Frontend**: `npm run dev`

## 👥 Role Guide

| Feature | Operator | Admin |
| :--- | :---: | :---: |
| View Dashboards | ✅ | ✅ |
| View Incidents | ✅ | ✅ |
| Acknowledge Alerts | ✅ | ✅ |
| Provision Users | ❌ | ✅ |
| Initialize Incidents | ❌ | ✅ |
| System Governance | ❌ | ✅ |

---

## 📄 License
This project is licensed under the MIT License.
