# prettier-config

Shared Prettier configuration for the Empowered Indian monorepo.

## Usage

Install the package in your workspace:

```bash
pnpm add -D prettier-config@workspace:*
```

Then reference it in your `package.json`:

```json
{
  "prettier": "prettier-config"
}
```

Or create a `.prettierrc.js` file:

```javascript
export { default } from 'prettier-config'
```

## Configuration

This package provides the following Prettier settings:

- `semi: false` - No semicolons
- `singleQuote: true` - Use single quotes
- `trailingComma: 'es5'` - Trailing commas where valid in ES5
- `printWidth: 100` - Line width of 100 characters
- `arrowParens: 'avoid'` - Omit parens when possible in arrow functions
