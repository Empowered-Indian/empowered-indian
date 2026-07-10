# Empowered Indian

MPLADS transparency platform — open source. Citizens explore how Indian MPs spend development funds.

## Tech Stack
- **Monorepo:** pnpm workspaces + Turborepo 2
- **Frontend:** React 19 + Vite 7 + TypeScript 5 + Tailwind 3 + shadcn/ui + ECharts 5 + TanStack Query 5
- **Backend:** Express 4 + Mongoose 8 + node-cache + Winston + nodemailer + JWT
- **Infra:** Docker Compose (MongoDB 7 + Mongo Express), Vercel (frontend), GitHub Actions (daily data sync)
- **License:** AGPL-3.0

## Quick Start
```bash
docker compose up -d        # MongoDB + Mongo Express
pnpm install && pnpm dev    # Frontend :5173 + Backend :8080
```

## Directory Map
```
├── frontend/          React SPA (Vite)
│   ├── src/components/     common/ + MPLADS/ (Charts, Filters, MPs, States, Projects, Search)
│   ├── src/contexts/       AuthContext, FilterContext (persisted), AnalyticsContext
│   ├── src/hooks/          useApi, useAuth, useDebounce, useFilterData
│   └── src/services/api/   REST modules (summary, mplads, works, analytics, expenditures)
├── backend/           Express API
│   ├── controllers/        10 controllers
│   ├── models/             9 Mongoose collections
│   ├── routes/             12 route modules
│   └── middleware/         auth, cache (node-cache), rateLimiting, sanitization
├── upload-scripts/    Data ingestion from MPLADS.gov.in API
├── packages/          Shared eslint-config + prettier-config
└── turbo.json, docker-compose.yml
```

## Key Conventions
- **State:** React Context (Auth, Filter, Analytics) + TanStack Query (server data, staleTime: 5min, gcTime: 10min)
- **Charts:** ECharts 5 with custom config via echarts-for-react
- **Filters:** FilterContext persists to localStorage, syncs cross-tab via StorageEvent
- **Caching:** Two-level — server node-cache (6-24h TTL) + client TanStack Query
- **Data sync:** GitHub Actions cron daily (15:30 UTC), fetches from MPLADS.gov.in API
- **LS Terms:** 17th/18th Lok Sabha filtering flows through entire stack
- **CSS:** Tailwind 3 + shadcn/ui (Radix primitives)
- **HTTP:** Axios (primary, 30s timeout) + fetch (auth)

## Routes
| Path | Feature |
|---|---|
| `/` | Landing page |
| `/mplads/dashboard` | Overview with summary cards, gauges |
| `/mplads/track-area` | Track fund usage by area |
| `/mplads/compare` | Compare MPs, states, constituencies |
| `/mplads/search` | Full-text search across MPs, constituencies |
| `/mplads/states` | State list with utilization stats |
| `/mplads/mps` | MP list with performance metrics |
| `/mplads/mps/:mpId` | MP detail with works breakdown |
| `/mplads/admin` | Admin panel (protected) |
| `/login` | Admin login |

## Contribution
- Open an issue before PR (PRs without issues are closed)
- Branch: `feat/<short-description>`
- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`

## Full project context
Detailed project notes in Obsidian vault at `Projects/Empowered Indian/` including architecture, data models, MPLADS domain, and contributing guide.
