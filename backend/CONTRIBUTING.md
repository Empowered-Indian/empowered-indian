Contributing to Empowered Indian Backend

Thanks for your interest in improving Empowered Indian! This document explains local setup, coding standards, and how to propose changes for the backend API.

Quick Start

- Requirements: Node.js 18+, MongoDB (Atlas or local)
- Install: `npm install`
- Run dev: `npm run dev`
- Lint: `npm run lint` (auto-fix: `npm run lint:fix`)

Environment

- Copy `.env.example` to `.env` and populate secrets.
- Never commit `.env` or credentials. Use placeholders in `.env.example`.
- Required: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`; optional: `EMAIL_*`, `SENTRY_DSN`.

Code Style

- ESLint (flat config) with Node environment.
- Prefer small, focused modules and clear error handling.
- Validate inputs using `express-validator` or `joi` where applicable.

Commits and Branching

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Create feature branches from `main`: `feat/<short-description>`.
- Keep PRs focused and small; link related issues.

Testing and QA

- Add tests where practical (e.g., using `supertest`).
- Ensure `npm run dev` runs and `/health` responds before PR.
- Verify rate limits, CORS, and security middleware behave as expected.

Security

- No secrets in code or fixtures. Use env vars only.
- Report vulnerabilities privately to `security@empoweredindian.in`.
- Avoid verbose error messages in production.

Data & Legal

- Ensure data ingestion/scraping complies with source terms and laws.
- Attribute sources as required.

Review Process

- Automated checks: lint and optional CI.
- Maintainers review for correctness, security, and performance.

Thank you for contributing to transparency and civic-tech in India.
