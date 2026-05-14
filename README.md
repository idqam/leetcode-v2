# LeetCode V2

A Next.js app for tracking LeetCode problems, solves, reviews, and patterns. Uses a PostgreSQL database (via Drizzle ORM) for all persistence.

---

## Tech Stack

- **Next.js 14** (App Router)
- **PostgreSQL 16** — all data stored here
- **Drizzle ORM** — schema, migrations, and queries
- **Docker Compose** — runs Postgres locally

---

## Persistence

All data is stored in a PostgreSQL database. The schema (defined in `src/db/schema.ts`) has four tables:

| Table | Purpose |
|---|---|
| `problems` | Problem metadata (title, difficulty, topics, solution, explanation) |
| `patterns` | Coding patterns with code templates per language |
| `pattern_problems` | Many-to-many join between patterns and problems |
| `solves` | One row per problem when first marked solved |
| `reviews` | One row per completed SM-2 spaced-repetition review session |

The app connects via the `DATABASE_URL` environment variable (set in `.env.local`). Drizzle manages migrations — migration files live in `./drizzle/`.

### Local persistence

When running locally with Docker Compose, Postgres data is stored in a named Docker volume (`pgdata`). This volume persists across container restarts and `docker compose down` — data is only lost if you explicitly remove the volume:

```bash
# removes the volume and all data
docker compose down -v
```

---

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) (for Postgres)

### 1. Start the database

```bash
docker compose up -d
```

This starts a Postgres 16 container on port `5432` with:
- **User:** `tracker`
- **Password:** `tracker`
- **Database:** `leetcode`

### 2. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://tracker:tracker@localhost:5432/leetcode
```

### 3. Run migrations

Apply the database schema:

```bash
npm run db:migrate
```

(This loads `.env.local` and applies pending migrations.)

### 4. Install dependencies and start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Compose Reference

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tracker
      POSTGRES_PASSWORD: tracker
      POSTGRES_DB: leetcode
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### Useful commands

```bash
# start in background
docker compose up -d

# stop (data is preserved in the volume)
docker compose down

# stop and delete all data
docker compose down -v

# view logs
docker compose logs -f db

# connect to Postgres directly
docker compose exec db psql -U tracker -d leetcode
```

---

## Database Migrations

Migrations are managed with Drizzle Kit. Migration files are in `./drizzle/`.

```bash
# generate a new migration after editing src/db/schema.ts
npm run db:generate

# apply pending migrations
npm run db:migrate

# open Drizzle Studio (browser-based DB viewer)
npm run db:studio
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply pending database migrations |
| `npm run db:generate` | Generate a new migration after schema changes |
| `npm run db:studio` | Open Drizzle Studio (browser-based DB viewer) |
