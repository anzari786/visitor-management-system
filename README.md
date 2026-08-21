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
└── README.md
```

## Getting Started

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
