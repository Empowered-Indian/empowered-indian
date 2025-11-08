Contributing to Empowered Indian Frontend

Thanks for your interest in improving Empowered Indian! This document explains how to set up your environment, coding standards, and how to propose changes.

Quick Start

- Requirements: Node.js 18+ and npm
- Install: `npm install`
- Run: `npm run dev` (default: http://localhost:5173)
- Lint: `npm run lint` (fix: `npm run lint:fix`)
- Format: `npm run format` (check: `npm run format:check`)

Environment

- Copy `.env.example` to `.env`.
- Do not commit `.env` or secrets. Use placeholders only in `.env.example`.
- Key variables: `VITE_API_URL`, `VITE_SENTRY_DSN`, `VITE_GA_TRACKING_ID`.

Code Style

- ESLint (flat config) with React + React Hooks rules.
- Prettier for formatting (no semicolons, single quotes, width 100).
- Prefer functional components and hooks.
- Keep modules cohesive and files small.

Commits and Branching

- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Create feature branches from `main`: `feat/<short-description>`.
- Keep PRs focused and small; link related issues.

Testing and QA

- Add smoke or unit tests where feasible.
- Ensure the app builds and runs before opening a PR.
- Verify no console errors and basic routes function.

Security

- Do not include credentials or tokens in code or tests.
- Report vulnerabilities privately to `security@empoweredindian.in`.
- Use `.env.example` to document configuration only.

Legal and Data Use

- Ensure any scraping or data use respects source terms and local law.
- Attribute sources when required.

Review Process

- Automated checks: lint and format (and optional CI).
- A maintainer will review for scope, style, and security.

Thank you for contributing to transparency and civic-tech in India.
