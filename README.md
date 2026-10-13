# Visitor Management System (VMS)

A modern Visitor Management System built for the Ethiopian Agricultural Transformation Institute (ATI).

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

### Backend

- Express.js
- TypeScript
- Prisma ORM
- MySQL
- Express Session

## Project Structure

```
visitor-management-system/
├── api/
├── client/
├── print-agent/
├── docker-compose.yml
└── README.md
```

## Running with Docker Compose

The quickest way to get the whole stack (MySQL + API + client) running. No
`.env` file to create — compose reads `api/.env.example` and
`client/.env.example` and overrides only what has to differ inside the network.

```bash
docker compose up --build
docker compose exec api pnpm prisma db seed   # demo data + admin account
```

- Client: `http://localhost:3000`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`
- MySQL: `localhost:3306` (user `vms`, password `vms_password`, db `vms_db`)

Prisma migrations (`prisma migrate deploy`) run automatically each time the API
container starts, so the schema is always up to date.

### Auth is bypassed by default

The compose file sets `DEV_BYPASS_AUTH=true` on both services (plus
`NEXT_PUBLIC_DEV_BYPASS_AUTH` on the client), so the login screen is skipped and
requests adopt the seeded admin account. Both flags are ignored unless
`NODE_ENV` is `development`, so they cannot weaken a production build.

To require sign-in again, set those three variables to `'false'` in
`docker-compose.yml` and restart. Seeded credentials: `admin` / `Password123!`.

### Developing with Docker Compose

New to Compose? Everything below is run from the repository root (where
`docker-compose.yml` lives). Compose starts three containers, called *services*:

| Service  | What it is              | URL / port              | Live reload? |
| -------- | ----------------------- | ----------------------- | ------------ |
| `db`     | MySQL 8.4               | `localhost:3306`        | n/a          |
| `api`    | Express + Prisma        | `http://localhost:5000` | No — restart |
| `client` | Next.js (`next dev`)    | `http://localhost:3000` | Yes          |

#### Start and stop

```bash
docker compose up              # start everything, logs in this terminal (Ctrl+C stops)
docker compose up -d           # start in the background ("detached")
docker compose ps              # what is running, and is it healthy?
docker compose stop            # stop containers, keep them
docker compose start           # start them again
docker compose down            # stop and remove containers (database volume kept)
```

`up -d` is the usual choice: it frees the terminal and the containers keep
running until you stop them.

#### Watching logs

Detached containers still log — you just have to ask:

```bash
docker compose logs -f              # follow all services (Ctrl+C to stop watching)
docker compose logs -f api          # follow one service
docker compose logs --tail 50 client
docker compose logs --since 5m api
```

Watching logs never affects the running app; it is always safe.

#### When do I need to rebuild?

This is the most common beginner confusion. An *image* is the recipe, a
*container* is the running instance.

| You changed…                            | What to run                                     |
| --------------------------------------- | ----------------------------------------------- |
| `client/` source (components, pages)     | Nothing — `next dev` hot-reloads it              |
| `api/` source                            | `docker compose up -d --build api`               |
| `docker-compose.yml` env values          | `docker compose up -d api client`                |
| `package.json` / lockfile (either app)   | `docker compose up -d --build <svc>`             |
| A `Dockerfile`                           | `docker compose up -d --build <svc>`             |
| `prisma/schema.prisma` + a new migration | `docker compose restart api` (migrations re-run) |

```bash
docker compose up -d --build api     # rebuild just the API and restart it
docker compose build                 # rebuild both images, start nothing
docker compose restart client        # restart without rebuilding
```

The client's source is bind-mounted (`./client:/app`), which is why editing a
component shows up in the browser immediately. The API is compiled into its
image, so API changes need `--build`.

#### Running commands inside a container

`exec` runs a command in an already-running container:

```bash
docker compose exec api pnpm prisma db seed        # re-seed demo data
docker compose exec api pnpm prisma migrate deploy # apply migrations manually
docker compose exec api sh                         # shell inside the API container
docker compose exec db mysql -uvms -pvms_password vms_db   # MySQL prompt
```

If a container is *not* running (e.g. it crashed), use `run --rm` instead:

```bash
docker compose run --rm api pnpm prisma migrate status
```

#### The database

Data lives in a named volume (`db-data`), so it survives `docker compose down`
and container rebuilds. To wipe it and start from an empty schema:

```bash
docker compose down -v          # ⚠️ deletes all database data
docker compose up -d            # migrations recreate the schema
docker compose exec api pnpm prisma db seed
```

You can also connect any GUI (DBeaver, TablePlus, MySQL Workbench) to
`localhost:3306` with user `vms` / password `vms_password`.

#### Troubleshooting

| Symptom                                    | Cause and fix                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `port is already allocated`                 | Something else uses 3000/5000/3306. Stop it, or change the left-hand number in the `ports:` mapping. |
| A service shows `Restarting (1)`            | It is crash-looping — read `docker compose logs <svc>` for the real error.     |
| API logs `ECONNREFUSED db:3306`             | The database was not ready. `docker compose restart api`.                      |
| Client 500s with `next/font/google` errors  | No internet, or a network that intercepts TLS — Google Fonts cannot download.   |
| Changes to API code do nothing              | You forgot `--build`. See the rebuild table above.                             |
| Everything is confusing                     | `docker compose down && docker compose up -d --build` for a clean slate.       |

Check `docker compose ps` first whenever something looks wrong — it shows which
service is unhealthy or restarting.

#### Production-style client image

The `client` service builds the Dockerfile's `dev` target (`next dev`) so the
dev-bypass flags work and source edits reload. For a production image instead,
drop `target: dev` and the `volumes:` block from the `client` service — that
builds the standalone `next build` output. Note `NEXT_PUBLIC_API_URL` is then
baked in at build time, so changing it requires a rebuild.

The print agent is **not** containerised: it runs directly on the reception PC
attached to the Zebra printer (see below). Point its `VMS_API_URL` at the API
container's published port (`http://<docker-host>:5000/api/v1`) and use the same
`PRINT_AGENT_TOKEN` as `api/.env.example`.

## Getting Started (without Docker)

### 1. Clone the repository

```bash
git clone <repository-url>
cd visitor-management-system
```

### 2. Install dependencies

Backend

```bash
cd api
pnpm install
```

Frontend

```bash
cd ../client
pnpm install
```

Print Agent (reception desk — Zebra thermal badges)

```bash
cd ../print-agent
pnpm install
cp .env.example .env
```

## Environment Variables

### Backend

Copy the example environment file.

```bash
cp .env.example .env
```

Update the values with your local database configuration.

### Frontend

Copy the example environment file.

```bash
cp .env.example .env.local
```

## Database

Run Prisma migrations.

```bash
cd api

pnpm prisma migrate dev

pnpm prisma generate
```

(Optional)

```bash
pnpm prisma db seed
```

## Running the Project

Backend

```bash
cd api

pnpm dev
```

Frontend

```bash
cd client

pnpm dev
```

Print Agent (on the PC attached to the Zebra printer)

```bash
cd print-agent

pnpm dev
```

Health: `http://127.0.0.1:5055/health`

Frontend:

```
http://localhost:3000
```

Backend:

```
http://localhost:5000
```

## Languages (i18n)

The UI ships in **English**, **Amharic (አማርኛ)** and **Tigrinya (ትግርኛ)**.

- Dictionaries: `client/lib/i18n/dictionaries/{en,am,ti}.ts` — flat, dot-namespaced
  keys. `en.ts` is the source of truth; `am.ts` and `ti.ts` are typed as
  `Dictionary`, so a missing key is a compile error.
- Usage in a component:

  ```tsx
  'use client';
  import { useTranslation } from '@/lib/i18n';

  const { t, locale, setLocale } = useTranslation();
  t('visits.emptyTitle');
  t('visits.moreVisitors', { count: 3 }); // {placeholder} interpolation
  ```

- Enum labels (visit status, meeting type, ID type, user role) map to keys in
  `client/lib/i18n/labels.ts`.
- Form validation messages are stored as dictionary keys inside the zod schemas
  and translated centrally by `FieldError` (`components/ui/field.tsx`).
- The chosen language is kept in the `vms.locale` cookie (mirrored to
  localStorage) and read on the server in `app/layout.tsx`, so the first paint
  is already in the right language. Amharic and Tigrinya render with
  Noto Sans Ethiopic.
- Switchers: the header globe menu (dashboard), the pill on the login card and
  the portal header (self-service / host portal).

## Thermal badge printing

Check-in creates a `BadgePrintJob` (QUEUED). The local Print Agent claims the job, generates ZPL, prints on the Zebra, and reports PRINTED/FAILED. A printer failure never rolls back check-in; desk staff can retry from the UI.

Set the same `PRINT_AGENT_TOKEN` in `api/.env` and `print-agent/.env`.

## Git Workflow

- Create a feature branch from `main`.
- Commit changes with meaningful commit messages.
- Push your branch.
- Open a Pull Request.
- Merge only after review.

Example:

```bash
git switch -c feature/visitor-registration
```