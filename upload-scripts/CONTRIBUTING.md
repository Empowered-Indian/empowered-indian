Contributing to MPLADS Upload Scripts

Thanks for helping improve Empowered Indian’s data pipeline! This folder contains Node.js scripts that fetch, normalize, and upload MPLADS data to MongoDB.

Quick Start
- Requirements: Node.js 18+, MongoDB (Atlas or local)
- Install: `npm install`
- Run: `npm start` (basic uploader)

Environment
- Copy `.env.example` to `.env` and populate secrets.
- Never commit `.env` or credentials. Use placeholders in `.env.example` only.

Coding Guidelines
- Keep modules small and focused; prefer pure functions for transforms.
- Handle failures gracefully and retry API calls where appropriate.
- Avoid tight coupling to specific DB names/collections—centralize config.

Commits and Branching
- Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Create feature branches from `main` and keep PRs small.

Validation
- Dry-run fetches with `--fetch-only` to validate API availability.
- Confirm collection counts and index creation as part of PR notes.

Security
- Do not log secrets; redact on errors.
- Report vulnerabilities privately to `security@empoweredindian.in`.

Data & Legal
- Ensure compliance with source terms and applicable laws.
- Attribute sources where required.

Review Process
- Maintainers review for correctness, clarity, and performance.

Thank you for contributing to transparency and civic-tech in India.
