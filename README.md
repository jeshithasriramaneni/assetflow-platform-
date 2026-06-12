#  AssetFlow — Smart Asset Management Platform

> Built for the **IIT Roorkee Cultural Council** hackathon challenge. A production-grade, full-stack asset management and resource allocation platform.



##  Technology Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma ORM
- **Database**: PostgreSQL 16
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Extras**: QRCode generation, Zod validation

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS (dark theme)
- **State**: Zustand (auth) + TanStack Query (server state)
- **Charts**: Recharts
- **Routing**: React Router v6
- **HTTP**: Axios
- **Fonts**: Sora + Space Grotesk

### DevOps
- **Containerization**: Docker + Docker Compose
- **Frontend Serve**: Nginx (in Docker)

---

##  Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone <repo-url>
cd asset-platform

# Start everything
docker-compose up --build

# App runs at:
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### Option 2: Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally

#### Backend Setup

```bash
cd backend
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npx prisma migrate dev --name init

# Seed sample data
npx prisma db seed

# Start dev server
npm run dev
# Runs on http://localhost:5000
```

#### Frontend Setup

```bash
cd frontend
npm install

# Start dev server
npm run dev
# Runs on http://localhost:5173
```

---

##  Feature Checklist

### Mandatory Features

| Feature                        | Status |
|-------------------------------|--------|
| JWT Authentication (login/register) | ✅ |
| Role-based access (ADMIN / USER) | ✅ |
| Asset CRUD (admin)            | ✅ |
| Asset categorization          | ✅ |
| Asset quantity management     | ✅ |
| Browse & search assets (user) | ✅ |
| Asset booking requests        | ✅ |
| Booking prevents over-allocation | ✅ |
| Admin approval workflow       | ✅ |
| Asset issue & return tracking | ✅ |
| Due date management           | ✅ |
| Analytics dashboard           | ✅ |
| Utilization charts (bar, pie, line) | ✅ |
| Summary stat cards            | ✅ |
| User borrowing history        | ✅ |
| Admin system-wide activity    | ✅ |

### Optional/Bonus Features

| Feature                        | Status |
|-------------------------------|--------|
| In-app notification system    | ✅ |
| Audit logging (all actions)   | ✅ |
| QR code generation per asset  | ✅ |
| QR code download (PNG)        | ✅ |
| Asset health/condition tracking | ✅ |
| Maintenance log history       | ✅ |
| Dockerized deployment         | ✅ |
| Overdue booking detection     | ✅ |
| Profile & password management | ✅ |
| User role management (admin)  | ✅ |

---

##  Project Structure

```
asset-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full DB schema
│   │   └── seed.ts             # Sample data
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT authenticate + requireAdmin
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts         # Register, login, profile
│   │   │   ├── assets.ts       # CRUD + QR code
│   │   │   ├── bookings.ts     # Create, approve, issue, return, cancel
│   │   │   ├── analytics.ts    # Dashboard stats + charts
│   │   │   ├── categories.ts   # Category management
│   │   │   ├── users.ts        # User management
│   │   │   ├── notifications.ts
│   │   │   ├── audit.ts        # Audit log viewer
│   │   │   └── maintenance.ts  # Asset health logs
│   │   └── utils/
│   │       ├── prisma.ts       # Singleton client
│   │       ├── audit.ts        # Log helper
│   │       └── notifications.ts # Notification helper
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── admin/          # Dashboard, Assets, Bookings, Users, Categories, Analytics, Audit
│       │   ├── user/           # Dashboard, Browse, My Bookings
│       │   └── (shared)        # Asset Detail, Profile, Notifications
│       ├── components/
│       │   ├── layout/         # Sidebar + main layout
│       │   └── modals/         # Booking, Asset Form, QR Code
│       ├── services/api.ts     # All API calls (axios)
│       ├── store/auth.ts       # Zustand auth store
│       └── utils/index.ts      # Formatters, config maps
└── docker-compose.yml
```

---

##  API Overview

| Method | Endpoint                     | Role  | Description               |
|--------|------------------------------|-------|---------------------------|
| POST   | /api/auth/register           | All   | Register new user         |
| POST   | /api/auth/login              | All   | Get JWT token             |
| GET    | /api/assets                  | All   | List assets (with filters) |
| POST   | /api/assets                  | Admin | Create asset              |
| GET    | /api/assets/:id/qrcode       | Admin | Get QR code               |
| POST   | /api/bookings                | User  | Request booking           |
| PATCH  | /api/bookings/:id/review     | Admin | Approve / reject          |
| PATCH  | /api/bookings/:id/issue      | Admin | Mark as issued            |
| PATCH  | /api/bookings/:id/return     | Admin | Mark as returned          |
| GET    | /api/analytics/summary       | Admin | Dashboard stats           |
| GET    | /api/notifications           | All   | User notifications        |
| GET    | /api/audit                   | Admin | Audit log                 |

---

##  Design Decisions

- **Dark theme** — Reduced eye strain for operations staff using the platform continuously
- **Role-based sidebar** — Admins and users see contextually relevant navigation only
- **Optimistic UI** — TanStack Query handles caching; mutations invalidate relevant queries
- **Zod validation** — All API inputs validated server-side before database writes
- **Transaction safety** — Asset availability updates use Prisma `$transaction` to prevent race conditions
- **QR per asset** — Unique QR codes generated on asset creation, downloadable as PNG

---

##  Database Schema

Core models: `User`, `Category`, `Asset`, `Booking`, `Notification`, `AuditLog`, `MaintenanceLog`

Key relationships:
- Asset → Category (many-to-one)
- Booking → User + Asset (many-to-one each)
- Notification → User
- AuditLog → User (nullable, for system actions)
- MaintenanceLog → Asset
