# ESLint Configuration

Shared ESLint configuration for the Empowered Indian monorepo. This package centralizes linting rules and configurations used across all our JavaScript/React packages.

## What's Inside

This config package provides three main configurations:

- **Base Config** - Common rules for all JavaScript code
- **Node Config** - Server-side and script configurations
- **React Config** - Frontend React application settings

## Usage

Each package in our monorepo imports the appropriate configuration based on its needs.

### For Node.js packages (Backend, Upload Scripts)

```javascript
import node from '@empowered-indian/eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...node,
  {
    // Add package-specific rules or overrides here
  },
])
```

### For React packages (Frontend)

```javascript
import react from '@empowered-indian/eslint-config/react'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...react,
  {
    // Add package-specific rules or overrides here
  },
])
```

## Why a Shared Config?

We consolidated our ESLint configuration into a single package to:

1. Avoid duplicating rules across packages
2. Ensure consistent code quality standards
3. Simplify maintenance and updates
4. Make it easier to onboard new packages

## Customizing Rules

While we encourage using the shared configuration as-is, you can override specific rules in your package's ESLint config if needed. Just spread the base config first, then add your overrides:

```javascript
export default defineConfig([
  ...node,
  {
    rules: {
      'no-console': 'off',  // Example: allow all console methods
    },
  },
])
```

## Ignored Files

The base configuration automatically ignores:

- `node_modules/`
- Build outputs (`dist/`, `build/`)
- Logs and data directories
- Turbo cache
- ESLint config files themselves

Individual packages can add their own ignore patterns as needed.

## Contributing

If you need to update the shared ESLint rules:

1. Make changes in this package (`packages/eslint-config/`)
2. Test the changes across all packages by running `pnpm lint` from the root
3. Document any breaking changes in your PR description