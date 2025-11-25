# Kanaria workspace

This workspace contains two packages under `packages/`:

- `packages/frontend` — React + Vite + TypeScript
- `packages/backend`  — Hono + TypeScript

Quick start:

1. Install dependencies from the workspace root:

```bash
pnpm install
```

2. Start frontend (in one terminal):

```bash
pnpm --filter @kanaria/frontend dev
```

3. Start backend (in another terminal):

```bash
pnpm --filter @kanaria/backend dev
```

Notes:

- These are minimal skeletons. Add or pin dependency versions as needed.
- You can run `pnpm -w install` from the repo root to install all workspace dependencies.
