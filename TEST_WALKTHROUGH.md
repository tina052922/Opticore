# OptiCore System Test Walkthrough

Use this guide to walk through all major features by role. Seed data provides test accounts; default password for all is **`password`**.

---

## Test Accounts (from seed)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| DOI | doi@ctu.edu.ph | password | Campus-wide approval |
| College Admin (COTE) | cote.admin@ctu.edu.ph | password | Manages COTE drafts |
| College Admin (CAS) | cas.admin@ctu.edu.ph | password | Manages CAS drafts |
| Chairman (BSIT) | chair.bsit@ctu.edu.ph | password | BSIT offerings |
| Chairman (BIT-CompTech) | chair.bitcomptech@ctu.edu.ph | password | BIT-CompTech offerings |
| Instructor | almirante.a@ctu.edu.ph | password | Teaching faculty |
| Instructor | geldore.jd@ctu.edu.ph | password | Teaching faculty |
| Student | student.bsit3a@ctu.edu.ph | password | Section timetable view |
| Visitor | visitor@ctu.edu.ph | password | Public map only |

---

## Sample Data (from seed)

### Colleges

| Code | Name |
|------|------|
| COTE | College of Technology |
| CAS | College of Arts and Sciences |
| CAFE | College of Agriculture and Food Engineering |
| COED | College of Education |
| CHTM | College of Hospitality and Tourism Management |

### Programs

| Code | College |
|------|---------|
| BSIT | COTE |
| BSIE | COTE |
| BIT-AUTO | COTE |
| BIT-COMPTECH | COTE |
| CAS-GEC | CAS |

### Sections (sample)

| Program | Section | Year | Student Count |
|---------|---------|------|---------------|
| BSIT | 1A–4B | 1–4 | 32–40 |
| BIT-AUTO | 1A–4B | 1–4 | 40 |

### Subjects (sample)

| Code | Title | Type |
|------|-------|------|
| DTECH 122 | Digital Technology 2 | DEPARTMENTAL |
| DRAW 122 | Engineering Drawing 2 | DEPARTMENTAL |
| COMP 1 | Introduction to Computing | DEPARTMENTAL |
| AST 122 | Applied Science and Technology 2 | DEPARTMENTAL |
| GEC-RPH | Readings in Philippine History | GEC |
| PSYCH-ELFC 6 | Current Issues in Psychology | GEC |
| PATHFIT | Physical Activities Toward Health and Fitness | GEC |

### Rooms (sample)

| Code | Building | Type | Capacity |
|------|----------|------|----------|
| DT Lab1, DT Lab2, DT Lab3 | DT | LAB | 40 |
| CT Lab1, CT Lab2 | CT | LAB | 40 |
| CL1, CL3, CL4 | Main | LECTURE | 40 |
| ST 202 | ST | LECTURE | 40 |

### Time Slots (timetabling)

| Slot | Hours |
|------|-------|
| 07:00–12:00 | Morning |
| 12:00–17:00 | Afternoon |
| 17:00–21:00 | Evening |

---

## Prerequisites

1. PostgreSQL running with `opticore` database
2. `.env` has `DATABASE_URL` and `AUTH_SECRET`
3. Migrations applied: `npm run prisma:migrate`
4. Seed applied: `npm run prisma:seed`
5. Dev server: `npm run dev` (if EINVAL/readlink error appears, use `npm run dev:fresh` instead)
6. (Optional) Socket.IO server for real-time updates: `npx ts-node socket-server.ts` (port 4000)

---

## 1. Unauthenticated / Public

- **Root (`/`)**: Redirects to login
- **Login (`/login`)**: Sign in form
- **Register (`/register`)**: Student-only registration (CTU email required)
- **Room Locator (`/room-locator`)**: Public map
- **Forgot password (`/forgot-password`)**: Request reset link

---

## 2. Student Flow

1. Sign in as `student.bsit3a@ctu.edu.ph` / `password`
2. **Dashboard**: Limited navigation (no schedule view, approvals, drafts, offerings)
3. **Central Repository**: View-only with search (programs, sections, faculty, subjects, rooms)
4. **Reports & Exports**: Read access
5. **No access to**: Schedule View, Timetabling, Offerings, Drafts, Approvals, My Schedule, Schedule Change Requests

---

## 3. Instructor Flow

1. Sign in as `almirante.a@ctu.edu.ph` / `password`
2. **My Schedule & Requests**: View teaching load, submit **time-only** change requests (no room)
3. **Schedule View**: View own schedule grid (e.g. DTECH 122, GEC-RPH)
4. **Timetabling**: View own load (read-only)
5. **Reports & Exports**: Access
6. **No access to**: Repository add forms, Offerings, Drafts, Approvals

---

## 4. Chairman Admin Flow

1. Sign in as `chair.bsit@ctu.edu.ph` / `password`
2. **Subject Offerings**: Add/offer subjects for BSIT (e.g. DTECH 122, COMP 1)
3. **Central Repository**: Add subjects, faculty, sections, rooms, programs (DOI cannot add)
4. **Schedule View** / **Timetabling**: View BSIT program schedules
5. **No access to**: DOI Approvals, Schedule Change Requests (College Admin only)

---

## 5. College Admin Flow

1. Sign in as `cote.admin@ctu.edu.ph` / `password`
2. **Schedule Drafts**: Create drafts, submit to DOI; view other colleges' drafts (for GEC coordination)
3. **Schedule Change Requests**: Approve/reject instructor time-change requests (own college only)
4. **Central Repository**: View-only (Chairman adds data)
5. **Schedule View**: Own college (COTE) + can view CAS, CAFE, etc. (read-only)
6. **Timetabling**: Manage COTE schedules; view by room; conflict summary
7. **No access to**: DOI Approval Queue

---

## 6. DOI Flow

1. Sign in as `doi@ctu.edu.ph` / `password`
2. **Approval Queue**: Approve or return drafts with mandatory comments
3. **Schedule View** / **Timetabling**: Campus-wide view (all colleges)
4. **Central Repository**: View only (no add subjects, faculty, sections, rooms, programs)
5. **No access to**: Schedule Change Requests (College Admin only)

---

## 7. Visitor Flow

1. Sign in as `visitor@ctu.edu.ph` / `password`
2. **Room Locator**: Public map
3. **No access to**: Dashboard scheduling features, repository

---

## 8. Timetabling Optimization Test

Use this flow to verify the greedy auto-generate and conflict detection. The page includes a "How it works" guide, conflict summary, and View by room.

### 8.1 Auto Generate Draft

1. Sign in as **College Admin (COTE)**: `cote.admin@ctu.edu.ph` / `password`
2. Go to **Timetabling** (`/dashboard/timetabling`)
3. Click **Auto Generate Draft**
4. **Expected**: New draft entries for COTE sections (BSIT, BIT-AUTO, etc.) using:
   - Subjects: first 3 in DB (e.g. DTECH 122, DRAW 122, COMP 1)
   - Time slots: 07:00–12:00, 12:00–17:00, 17:00–21:00
   - Days: Monday–Saturday
   - Rooms with capacity ≥ section size (e.g. CL1, DT Lab1)
5. Table shows Day | Time | Subject | Section | Instructor | Room | Status | Actions

### 8.2 College Scoping

1. As **COTE Admin**, run Auto Generate Draft → only COTE sections (BSIT, BIT-AUTO, BIT-COMPTECH, etc.)
2. Sign in as **DOI**: `doi@ctu.edu.ph` / `password`
3. Go to **Timetabling** → Click **Auto Generate Draft**
4. **Expected**: DOI generates for **all colleges** (campus-wide); table shows schedules from COTE, CAS, etc.

### 8.3 Conflict Highlighting

1. Go to **Timetabling**
2. **Expected**: Summary shows "Conflicts: N" (0 = ready, N &gt; 0 = resolve before marking Pending)
3. Rows with conflicts show **red background** and badge (Room double-booked, Instructor overlap, Section overlap)
4. Conflict = same day + same time + (same room OR same instructor OR same section)

### 8.4 Toggle Status

1. On any DRAFT row, click **Mark Pending**
2. **Expected**: Status changes from DRAFT → PENDING (amber badge)
3. Click **Mark Draft** → reverts to DRAFT (slate badge)

### 8.5 View by Room

1. In **Timetabling**, click **By room**
2. **Expected**: Schedules grouped by room (e.g. CL1, DT Lab1) to check room usage

### 8.6 Instructor View

1. Sign in as `almirante.a@ctu.edu.ph` / `password`
2. Go to **Timetabling**
3. **Expected**: Read-only table showing only this instructor’s schedule (no Auto Generate, no status toggle)

---

## Verification Checklist

- [ ] Root redirects to login
- [ ] Student can register with @ctu.edu.ph only
- [ ] Instructor change request: time only, no room
- [ ] College Admin approves change requests
- [ ] DOI cannot add repository data
- [ ] Chairman only adds repository data; College Admin view-only
- [ ] Schedule View: time × days grid, by room filter (e.g. CL1, DT Lab1)
- [ ] Schedule View: college filter works (COTE, CAS, etc.)
- [ ] Timetabling: Auto Generate Draft creates entries for correct scope
- [ ] Timetabling: Conflicts highlighted with red background
- [ ] Timetabling: Mark Pending / Mark Draft toggles status
- [ ] 404s fixed: /dashboard/schedules, /dashboard/schedule-change-requests work
- [ ] Build passes: `npm run build`
