# RentiGo – Vehicle Rental Management System

> Production-ready, full-stack SaaS platform for two-wheeler and four-wheeler rentals on daily, weekly, or monthly durations with ACID double-booking conflict prevention, tiered pricing optimization, agency fleet management, and administrative governance.

---

## 🚀 Live Demo & Ports
- **Frontend Web App**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5001/api/v1`
- **API Health Check**: `http://localhost:5001/api/v1/health`

---

## 🔑 Pre-Configured Demo Accounts (1-Click Switcher Available in UI)

| Role | Email | Password | Persona | Capabilities |
|------|-------|----------|---------|--------------|
| **Admin** | `admin@rentigo.com` | `Admin@SecurePass2026!` | Sarah Jenkins | Vehicle listing approvals, global analytics, conflict metrics, user & agency management |
| **Agency Owner** | `owner@apexrentals.com` | `Agency@SecurePass2026!` | Marcus Vance | Fleet CRUD, schedule maintenance downtime, approve/reject bookings, track utilization & revenue |
| **Customer** | `alex.rider@example.com` | `Customer@SecurePass2026!` | Alex Rider | Search & filter fleet, live tiered price quotes, reserve vehicle, view bookings, review completed rentals |

---

## 🏗 Architecture & Tech Stack

```
                        ┌────────────────────────────────────────┐
                        │          Next.js 15 (App Router)       │
                        │  TypeScript • Tailwind CSS • Zustand   │
                        │ TanStack Query • Hook Form • Sonner UI │
                        └───────────────────┬────────────────────┘
                                            │ HTTP / REST API (Port 5001)
                                            ▼
                        ┌────────────────────────────────────────┐
                        │           Node.js Express API          │
                        │  TypeScript • Helmet • CORS • RateLim  │
                        │     Zod Validation • JWT Auth (RBAC)   │
                        └───────────────────┬────────────────────┘
                                            │ Prisma ORM
                                            ▼
                        ┌────────────────────────────────────────┐
                        │          PostgreSQL Database           │
                        │  Indexed Overlap Ranges • ACID Txns    │
                        │  (Automatic Fallback Dev Store in dev) │
                        └────────────────────────────────────────┘
```

### 1. Technology Stack
- **Frontend**:
  - Next.js 15 (App Router) + TypeScript
  - Tailwind CSS + Lucide React
  - TanStack Query (React Query v5)
  - Zustand (state hydration & auth management)
  - React Hook Form + Zod validation
  - Date-fns date arithmetic
  - Sonner notifications
- **Backend**:
  - Express.js + TypeScript
  - Prisma ORM + PostgreSQL
  - JWT Access Token (15m) + Refresh Token (7d)
  - bcryptjs password hashing
  - Zod request body, query, and param validation middleware
  - Helmet security headers + CORS + Memory rate limiting
  - Multer + Cloudinary image upload (with high-res vehicle fallback)
  - Structured transactional email logger / notification service

---

## 🛡️ Critical Engine Features

### 1. Double-Booking Conflict Prevention (ACID Protected)
Two rentals `[A_start, A_end]` and `[B_start, B_end]` conflict if:
$$\text{start}_A < \text{end}_B \quad \text{and} \quad \text{end}_A > \text{start}_B$$
- Executed inside **database transactions** with compound indices on `[vehicleId, startDate, endDate]`.
- Checks both active reservations (`PENDING`, `APPROVED`, `ACTIVE`) and scheduled maintenance blocks (`SCHEDULED`, `IN_PROGRESS`).
- Eliminates phone/spreadsheet double-booking errors completely.

### 2. Smart Tiered Pricing Engine
Automatically compares Daily, Weekly, and Monthly rates to guarantee the best customer price:
- **Weekly Tier**: Multiples of 7 days receive package discounts.
- **Monthly Tier**: Multiples of 30 days receive deep bulk discounts.
- **Capping Optimization**: If booking 6 days at daily rate exceeds the 7-day weekly rate, the system caps the price at the weekly package rate, maximizing conversion and customer satisfaction.

### 3. Maintenance Block Scheduler
Rental agencies can block specific maintenance windows (e.g. oil change, brake pad inspection) without canceling non-overlapping future bookings. Overlaps with existing bookings are blocked during scheduling.

---

## 📁 Repository Structure

```
rentigo/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Normalized relational schema with indexes & enums
│   │   └── seed.ts              # Database seeding script with realistic data
│   ├── src/
│   │   ├── config/              # Env, Prisma client, devStore fallback, Cloudinary
│   │   ├── controllers/         # Auth, Vehicle, Booking, Agency, Admin, Upload
│   │   ├── middleware/          # JWT auth, RBAC, Zod validation, error handler, rate limit
│   │   ├── routes/              # RESTful API route definitions
│   │   ├── services/            # Core business logic & ACID transactions
│   │   ├── types/               # TypeScript interfaces & domain enums
│   │   ├── utils/               # ApiError, ApiResponse, JWT, bcrypt, date calculators
│   │   ├── validators/          # Zod schemas for request validation
│   │   ├── app.ts               # Express application setup
│   │   └── server.ts            # Server entrypoint with graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/          # /login & /register pages
    │   │   ├── vehicles/        # Public fleet browse, filter & [id] detail page
    │   │   ├── bookings/        # Customer booking history & review flow
    │   │   ├── dashboard/
    │   │   │   ├── agency/      # Agency fleet manager, approval queue & revenue
    │   │   │   └── admin/       # Admin analytics, vehicle approvals & user directory
    │   │   ├── globals.css      # Tailwind styling
    │   │   ├── layout.tsx       # Root layout with QueryProvider & Navbar
    │   │   └── page.tsx         # Modern conversion-optimized landing page
    │   ├── components/
    │   │   ├── ui/              # Button, Badge, Card, Input, Dialog
    │   │   ├── layout/          # Navbar with role switcher, Footer
    │   │   ├── vehicles/        # VehicleCard, VehicleFilter
    │   │   └── bookings/        # Live PriceCalculatorWidget & Booking Modal
    │   ├── lib/                 # api.ts (fetch wrapper + auto refresh), utils.ts
    │   ├── store/               # Zustand authStore
    │   └── types/               # Frontend TypeScript interfaces
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 🛠️ Getting Started (Local Setup)

### Prerequisites
- Node.js 18+ (tested on v26)
- npm or pnpm
- Optional: PostgreSQL (if local PostgreSQL is offline, RentiGo seamlessly operates using its built-in in-memory repository store with zero errors!)

### 1. Backend Setup
```bash
cd rentigo/backend
npm install
npm run build
npm start
```
*Backend runs on `http://localhost:5001`.*

### 2. Frontend Setup
```bash
cd rentigo/frontend
npm install
npm run build
npm start
```
*Frontend runs on `http://localhost:3000`.*

---

## ⚙️ Environment Variables

### Backend (`rentigo/backend/.env`)
```ini
PORT=5001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rentigo_db?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="rentigo_super_secret_access_jwt_key_2026_prod_grade"
JWT_REFRESH_SECRET="rentigo_super_secret_refresh_jwt_key_2026_prod_grade"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS Origin
CORS_ORIGIN="http://localhost:3000"

# Cloudinary (Optional - uses mock image URLs if blank)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Admin Initial Credentials
ADMIN_EMAIL="admin@rentigo.com"
ADMIN_PASSWORD="Admin@SecurePass2026!"
```

### Frontend (`rentigo/frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL="http://localhost:5001/api/v1"
NEXT_PUBLIC_APP_NAME="RentiGo"
```

---

## 🚀 Deployment Guide

### Deploying Frontend to Vercel
1. Push repository to GitHub.
2. Link the repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `rentigo/frontend`.
4. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://api.yourdomain.com/api/v1`).
5. Click **Deploy**.

### Deploying Backend & Database to Railway / Render
1. Create a **PostgreSQL** database on Railway or Render.
2. Copy the PostgreSQL `DATABASE_URL`.
3. Create a **Web Service** pointing to `rentigo/backend`.
4. Set build & start commands:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
5. Configure Environment Variables in the service settings (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`).
6. Run database migrations:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
