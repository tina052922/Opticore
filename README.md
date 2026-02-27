# OptiCore – Smart Campus Intelligence System (CTU–Argao)

OptiCore is a **Next.js 15 + TypeScript** web application that delivers a smart campus intelligence platform for **Cebu Technological University – Argao Campus**.

It includes:

- **Campus Intelligence Core** – dashboard for today’s schedules, conflicts, and room utilization.
- **Academic Timetabling & Optimization** – predefined slots, greedy auto-generation, conflict highlighters.
- **Central Schedule & Room Repository** – programs, sections, faculty, subjects, and rooms.
- **Room Locator & Campus Navigation** – public, QR-ready, offline map-powered navigation.
- **Reporting & Schedule Intelligence** – workload, utilization, and conflict reports.

## Tech Stack

- **Next.js 15 (App Router, Server Actions)**
- **React 19**, **TypeScript**
- **Tailwind CSS**, **shadcn/ui-style components**, **Radix UI**, **Lucide icons**
- **Prisma + SQLite** (easy local dev – can later switch to PostgreSQL)
- **NextAuth.js v5** (credentials + role-based sessions – wiring in progress)
- **React Hook Form + Zod**
- **TanStack Query**
- **Leaflet + react-leaflet** (offline campus map with static image overlay)
- **react-big-calendar** (or FullCalendar) for schedule views
- **qrcode** for QR guest access
- **Recharts** for charts
- **sonner** for toasts

## Getting Started

1. **Install dependencies**

```bash
cd opticore
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

By default this uses **SQLite**:

```env
DATABASE_URL="file:./dev.db"
```

> You can later switch to **PostgreSQL** by changing `provider` and `DATABASE_URL` in `prisma/schema.prisma`. The rest of the app uses Prisma Client so no other code changes are required for basic CRUD.

3. **Prisma migrate & seed**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

The seed script will insert:

- Core **roles & demo users**
- Sample **majors/programs**, **sections**, **faculty**, **subjects**, **rooms**
- Predefined **time slots** and sample **schedules**

4. **Run the dev server**

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Campus Map Image

The **Room Locator** uses `Leaflet` with a static image so it works offline and avoids external map APIs.

- Place your map at: `public/images/campus-map.png`
- Use a clear top-down campus plan including **Main Gate**, **DT Building**, **CT Building**, and floors.

You can later adjust room coordinates and paths in:

- `components/room-locator/campus-map.tsx`

## Optimization & Future Enhancements

- The **Academic Timetabling & Optimization** module starts with a **greedy algorithm** implemented in a dedicated scheduling service (to be added under `lib/scheduling`).
- A clear extension point will be documented where you can call an external **OR-Tools** solver (e.g., via a Python microservice) while keeping Prisma as the source of truth.

## Notes

- All **mutations** are planned to use **Server Actions** backed by Prisma.
- **Strict RBAC** (SuperSuperAdmin, SuperAdmin, DeptAdmin, CASAdmin, Faculty, Student, Guest) will control both UI menus and API/server-actions.
- The **Room Locator** is always public and QR-accessible; other routes require authentication.

This is an initial, production-oriented draft. Additional modules (full dashboard cards, schedule editor, reporting views, seed data) will be implemented in subsequent iterations of this project.

## Troubleshooting: Updates not reflecting

**Code/UI changes not showing**

- **Clear Next.js cache and restart:** run `npm run dev:fresh` (deletes `.next` and runs `next dev`).
- **Hard refresh the browser:** `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) to bypass browser cache.

**Data changes not showing (e.g. new schedules, repository edits)**

- The dashboard is set to always fetch fresh data. If you still see old data, do a full page refresh (F5 or Ctrl+R) or restart the dev server (`Ctrl+C` then `npm run dev`).
- After creating/updating data in Timetabling, the app uses `revalidatePath`; if the page still shows old data, refresh once. 

