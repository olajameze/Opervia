# Opervia

**Run Your Entire Operation From One Platform**

Opervia is a B2B SaaS platform for rental, workforce, and operations management — the Operational OS for modern businesses.

## Features

- Equipment rentals & inventory management
- Staff & freelancer workforce management
- Job scheduling & dispatch
- Logistics tracking
- Stripe billing & invoicing
- Analytics dashboard
- Workflow automations & notifications

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma
- **Auth:** Auth.js (NextAuth v5)
- **Payments:** Stripe
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure DATABASE_URL, DIRECT_URL, and AUTH_SECRET in .env
# Generate AUTH_SECRET: openssl rand -base64 32

# Apply database migrations
npm run db:migrate

# Seed demo data (local dev only — blocked in production)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Account (local dev only)

- Email: `demo@opervia.com`
- Password: `password123`

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (migrations + Next.js) |
| `npm run db:migrate` | Create/apply migrations locally |
| `npm run db:migrate:deploy` | Apply migrations (production-style) |
| `npm run db:seed` | Seed demo data (local only) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run tests |

## Deployment

Deploy to Vercel:

1. Connect repository
2. Set environment variables from `.env.example` on **Production**
3. Add custom domain and set `NEXT_PUBLIC_APP_URL` + `AUTH_URL`
4. Follow [docs/GO-LIVE.md](docs/GO-LIVE.md) before launching to real users

Additional guides:

- [Stripe setup](docs/STRIPE-SETUP.md)
- [Database backups](docs/BACKUPS.md)

## License

Proprietary — Opervia © 2026
