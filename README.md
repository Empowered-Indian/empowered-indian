# Empowered Indian

This is the monorepo we'll be using to contain all the code related to the empowered indian platform.

Work in progress:
- As of now, the frontend and backend components are available in their respective folders.
- The goal is to turn into a monorepo where frontend and backend will be apps sharing the same set of packages and dev tools & ergonomics.
- We are actively gathering data on MLALADS and plan to begin development around this dataset soon.

Initial plan is to have something like this,

```
.github/
.vscode/
apps/
    frontend/
    backend/
packages/
    features/
    data-access/
    ui/
    utils/
tooling/
....
```

Contributions are welcome. But please note that before raising a pull request, make sure to open an issue first. This way, we can streamline the discussions on the issue & proposed solutions and keep things organized. PRs without any issue will be closed without any consideration.

## Local setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (recommended for MongoDB)

### Quick Start with Docker

The easiest way to get started is using Docker Compose for the database:

1. **Start MongoDB and Mongo Express (database admin UI)**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - MongoDB on `localhost:27017`
   - Mongo Express web UI on `http://localhost:8081` (username: `admin`, password: `admin`)

2. **Set up backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

   The default `.env` is already configured to connect to the Docker MongoDB.

3. **Set up frontend**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

4. **Stop services**
   ```bash
   docker-compose down
   ```

5. **Reset database** (removes all data)
   ```bash
   docker-compose down -v
   ```

### Alternative Setup (without Docker)

If you prefer not to use Docker, you can use MongoDB Atlas or a local MongoDB installation. See the detailed documentation:
- FE: [README](frontend/README.md) [CONTRIBUTING](frontend/CONTRIBUTING.md)
- BE: [README](backend/README.md) [CONTRIBUTING](backend/CONTRIBUTING.md)

## License

- AGPL-3.0 — see [LICENSE](./LICENSE).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Empowered-Indian/empowered-indian&type=Date)](https://star-history.com/#Empowered-Indian/empowered-indian)

