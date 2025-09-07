Empowered Indian — MPLADS Upload Scripts

Overview
Automation utilities to fetch, transform, and upload MPLADS data into MongoDB for the Empowered Indian platform. Designed to replace manual CSV workflows with a streamlined, API-first pipeline.

Quick Start
- Requirements: Node.js 18+, access to MongoDB Atlas or local MongoDB
- Install: `npm install`
- Run: `npm start` (runs `basic-api-uploader.js`)

Environment Variables
Copy `.env.example` to `.env` and set values:
- `MONGODB_URI` — Connection string (DO NOT COMMIT)
- `DATABASE_NAME` — Target database
- `LS_TERM` — `17` | `18` | `both` (default `both`)

CLI Usage
```bash
cd upload-scripts
npm start  # or npm run basic

# Control Lok Sabha term scope
node index.js --ls-term=17   # 17th Lok Sabha only
node index.js --ls-term=18   # 18th Lok Sabha only
node index.js --ls-term=both # both terms (default)
```

What it does
- Fetches fresh data from MPLADS API
- Creates collections: `mps`, `expenditures`, `works_completed`, `works_recommended`, `summaries`
- Calculates utilization rates using official MPLADS standards
- Generates MP summaries and state-wise analytics
- Supports 17th and 18th Lok Sabha (adds `lsTerm` to LS records; Rajya Sabha `lsTerm=null`)

Data Structure
- `mps`: Members of Parliament
- `expenditures`: Expenditure records
- `works_completed`: Completed projects
- `works_recommended`: Recommended projects
- `summaries`: MP, state, overall aggregates

Performance
- Typical runtime: ~2 minutes; memory usage <150MB (varies by dataset)
- Proper indexes for dashboard query performance

Security
- Never commit `.env` or credentials. Use `.env.example` as a template only.
- Rotate any credentials previously committed and rewrite history before publishing.

License
AGPL-3.0. See `LICENSE`.

Code of Conduct
See `CODE_OF_CONDUCT.md` for community expectations.
