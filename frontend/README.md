Empowered Indian — Frontend (React + Vite)

Overview
The Empowered Indian frontend is a React (Vite) application that powers the public interface for transparency and accountability features: political/administrative hierarchy mapping, public works and expenditures (MPLADS/MLAADS), analytics, and civic engagement tools.

Getting Started

- Requirements: Node.js 18+ and npm.
- Install: `npm install`
- Dev: `npm run dev` (default: http://localhost:5173)
- Build: `npm run build`
- Preview: `npm run preview`

Environment Variables
Copy `.env.example` to `.env` and adjust values. Common keys:

- `VITE_API_URL` — Backend API base URL (e.g., http://localhost:5000/api)
- `VITE_API_URL_DEVELOPMENT`, `VITE_API_URL_PRODUCTION` — Optional overrides
- `VITE_SENTRY_DSN` and `VITE_SENTRY_ENVIRONMENT` — Error monitoring (DSN is not secret)
- `VITE_GA_TRACKING_ID` — Google Analytics tracking ID
- `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_SENTRY`, `VITE_ENABLE_PERFORMANCE_MONITORING`

Scripts

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview build output
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` / `npm run format:check` — Prettier

Project Structure

- `src/` — React sources and feature modules
- `public/` — Static assets
- `vite.config.js` — Vite configuration
- `eslint.config.js` — ESLint (flat config)

Security and Data

- Never commit `.env` files or secrets. Use `.env.example` instead.
- The Sentry DSN is public by design; use environment-specific projects.
- All data use must comply with applicable laws and terms of service for scraped or aggregated sources.

License
AGPL-3.0. See `LICENSE`.

Code of Conduct
See `CODE_OF_CONDUCT.md` for community expectations.
