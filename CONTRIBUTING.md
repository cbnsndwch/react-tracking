# Contributing

Thank you for your interest in contributing!

## Local Development

1. Fork the repo and clone your fork locally
2. `pnpm install`
3. `pnpm run test:watch` — runs tests in watch mode

## Scripts

| Command | Description |
| --- | --- |
| `pnpm run build` | Build the library to `dist/` |
| `pnpm run dev` | Build in watch mode |
| `pnpm run test` | Run tests once |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run lint` | Lint with oxlint |
| `pnpm run format` | Format with oxfmt |

## Testing against your own app

1. `pnpm install` in your local checkout of this repo
2. `pnpm link --global` in this repo
3. `pnpm link --global @cbnsndwch/react-tracking` in your app
4. `pnpm run dev` in this repo to rebuild on changes
