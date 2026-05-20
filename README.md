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

# Configure DATABASE_URL and AUTH_SECRET in .env
# Generate AUTH_SECRET: openssl rand -base64 32

# Push database schema
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Account

- Email: `demo@opervia.com`
- Password: `password123`

## Environment Variables

See [.env.example](.env.example) for all required variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Prisma schema |
| `npm run db:seed` | Seed demo data |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run tests |

## Deployment

Deploy to Vercel:

1. Connect repository
2. Set environment variables from `.env.example`
3. Deploy

## License

Proprietary — Opervia © 2026
