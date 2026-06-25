# DimovTax — Project Dashboard

A full-stack mini SaaS dashboard for managing projects with status tracking, deadlines, team assignments, and budgets.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js Route Handlers (REST API)
- **Database:** PostgreSQL with Prisma ORM 7
- **Auth:** Auth.js v5 (credentials provider, JWT sessions)
- **Containerization:** Docker (multi-stage build, standalone output)

## Features

- Email/password authentication with protected routes
- Role-based access control (user management is admin-only)
- Project table with sortable columns, filtering by status and assignee, and search
- Responsive layout (table on desktop, cards on mobile)
- Add, edit, and delete projects via modal forms
- Stats cards (total, active, on hold, completed, overdue, total budget)
- Dark/light theme toggle
- Rate limiting on API routes

## Quick Start

### Option 1 — Docker (no host deps needed)

```bash
make setup
```

Starts PostgreSQL + app (migrations run automatically) and seeds the database. Open [http://localhost:3000](http://localhost:3000).

### Option 2 — Local Development

Prerequisites: Node.js 20+, pnpm 10+, Docker.

```bash
pnpm install
pnpm setup
pnpm dev
```

`pnpm setup` creates `.env`, starts PostgreSQL in Docker, runs migrations, and seeds the database.

### Makefile targets

| Command | Description |
|---------|-------------|
| `make setup` | Start stack + seed |
| `make up` | Start PostgreSQL + app |
| `make seed` | Seed the database (in a container) |
| `make logs` | Follow logs |
| `make down` | Stop containers |
| `make rebuild` | Rebuild from scratch (wipes database) |

### Demo URL

<https://dimovtax.up.railway.app/>

**Demo Credentials:**

- **Email:** admin@dimovtax.com
- **Password:** admin123

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/projects` | List projects (`status`, `assigneeId`, `search`, `page`, `limit`) | Any user |
| `POST` | `/api/projects` | Create a project | Any user |
| `GET` | `/api/projects/:id` | Get a project | Any user |
| `PUT` | `/api/projects/:id` | Update a project | Any user |
| `DELETE` | `/api/projects/:id` | Delete a project | Any user |
| `GET` | `/api/projects/stats` | Aggregate stats | Any user |
| `GET` | `/api/users` | List users (`search`, `role`, `page`, `limit`) | Any user |
| `POST` | `/api/users` | Create a user | Admin |
| `GET` | `/api/users/:id` | Get a user | Any user |
| `PUT` | `/api/users/:id` | Update a user | Admin |
| `DELETE` | `/api/users/:id` | Delete a user | Admin |

All endpoints require authentication. Validation errors return `422`; missing records return `404`.

## Author

Created by Ali Naqi Al-Musawi
