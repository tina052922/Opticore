# Opticore – Setup (new laptop / after clone)

Follow these steps **on each machine** (e.g. after cloning or pulling from GitHub). The default setup uses **SQLite** so you do **not** need to install or run PostgreSQL.

---

## 1. Environment variables

Create a `.env` file in the project root (same folder as `package.json`).

**Copy from the example:**

```cmd
copy .env.example .env
```

The example is already set for local dev:

- **`DATABASE_URL`** – Default is SQLite: `file:./dev.db`. No database server required. Leave as-is unless you use PostgreSQL.
- **`AUTH_SECRET`** – Required for Auth.js v5. Use at least 32 characters. For local dev you can leave placeholder; for production set a strong secret.
- **`NEXTAUTH_URL`** – e.g. `http://localhost:3000` (default in `.env.example`).
- **`NEXT_PUBLIC_SOCKET_URL`** – e.g. `http://localhost:4000` (optional; for real-time features).

**Optional:** Edit `.env` and replace `AUTH_SECRET` with a strong value.

---

## 2. Install dependencies

Open a terminal in the **project folder** (the folder that contains `package.json` and the `prisma` folder). If you cloned into `Opticore`, run:

```cmd
cd Opticore
npm install
```

This runs `prisma generate` automatically (postinstall script), so the Prisma client is ready.

---

## 3. Database (SQLite): migrate and seed

No database server is required. The app uses a file: `prisma/dev.db`.

### 3.1 Run migrations

From the **project folder** (same folder as `package.json` and `.env`):

```cmd
npx prisma migrate dev
```

If you see "Environment variable not found: DATABASE_URL", you are likely in the wrong directory—change into the project folder (e.g. `cd Opticore`) and run the command again.

This creates `prisma/dev.db` (if it does not exist) and applies all migrations.

### 3.2 Seed the database

```cmd
npm run prisma:seed
```

This fills the database with colleges, programs, sections, users, rooms (including IT LAB 1–4 for BSIT), subjects, and sample schedules.

---

## 4. Run the app

```cmd
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the login page; the dashboard and reports should load without errors.

### Test login after seeding

The seed creates users with password **`password`**. You can sign in with any of these (email / password):

| Role        | Email                     | Password  |
|------------|----------------------------|-----------|
| DOI        | `doi@ctu.edu.ph`           | `password` |
| College admin (COTE) | `cote.admin@ctu.edu.ph` | `password` |
| Chairman (BSIT)     | `chair.bsit@ctu.edu.ph`   | `password` |
| Instructor | `almirante.a@ctu.edu.ph`   | `password` |
| Student    | `student.bsit3a@ctu.edu.ph`| `password` |
| Visitor    | `visitor@ctu.edu.ph`       | `password` |

---

## Quick checklist (new laptop / fresh clone)

Run all commands from the **project folder** (the folder that contains `package.json`, `prisma/`, and `.env`). For example: `cd Opticore` if the repo is in a folder named Opticore.

1. Copy `.env.example` to `.env` (optionally set `AUTH_SECRET`).
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run prisma:seed`
5. `npm run dev`

---

## Troubleshooting

- **“Environment variable not found: DATABASE_URL”**  
  Create `.env` in the project root (e.g. copy from `.env.example`) and set `DATABASE_URL="file:./dev.db"`. Restart `npm run dev` after changing `.env`.

- **"MissingSecret" (Auth.js)**  
  Set `AUTH_SECRET` in `.env` (at least 32 characters). Restart dev server.

- **“Can't reach database server”**  
  If you use the default SQLite (`DATABASE_URL="file:./dev.db"`), this usually means the schema or migrations are for another provider. Ensure `prisma/schema.prisma` has `provider = "sqlite"` and you ran `npx prisma migrate dev`.

- **EINVAL / readlink errors with `.next`**  
  Run `npm run clean` or delete the `.next` folder, then run `npm run dev` again.

- **Prisma client out of date**  
  Run `npx prisma generate`. `npm install` also runs it via postinstall.

- **Login fails (Invalid email or password / CredentialsSignin)**  
  Make sure you ran `npm run prisma:seed` after migrations. Seed users all have password **`password`**. Use one of the emails from the "Test login after seeding" table above (e.g. `doi@ctu.edu.ph`).

- **"Could not find the migration file at migration.sql" (P3015)**  
  Some migration **folders** exist without a `migration.sql` file inside (e.g. leftover empty folders from old migrations). Prisma expects every folder under `prisma/migrations` to contain `migration.sql`. Fix it by removing empty migration folders, then run migrations again.

  **Option A – use the project script (recommended):**
  ```cmd
  npm run prisma:fix-migrations
  npx prisma migrate dev
  ```
  Then run `npm run prisma:seed` to repopulate data.

  **Option B – manual fix:** Delete the SQLite database and any migration folders that do **not** contain `migration.sql`. Keep only the folder that has `migration.sql` (e.g. `20260224120000_init`). Then run `npx prisma migrate dev` and `npm run prisma:seed`.

---

## Optional: PostgreSQL

To use PostgreSQL instead of SQLite:

1. In `prisma/schema.prisma`, set `provider = "postgresql"` (and keep `url = env("DATABASE_URL")`).
2. In `.env`, set `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/opticore?schema=public"`.
3. Create the database (e.g. `psql -U postgres -c "CREATE DATABASE opticore;"`).
4. Run `npx prisma migrate dev` (you may need to reset or create new migrations for PostgreSQL).
5. Run `npm run prisma:seed`.

The repo’s default migrations are for **SQLite**. For PostgreSQL you would need to generate and commit PostgreSQL-specific migrations after switching the provider.
