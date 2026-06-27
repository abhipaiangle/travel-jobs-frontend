# travel-jobs-frontend

React 19 + CRA/Craco + Tailwind + shadcn/ui frontend for **TravelJobs**. See `../travel-jobs-docs/` for product + architecture context.

## Quick start

```bash
yarn install
cp .env.example .env       # fill in values (point REACT_APP_API_BASE at the backend)
yarn start                 # http://localhost:3000
```

## Layout

```
src/
├── App.js              # Router + Toaster
├── index.js / index.css
├── pages/              # Home, Jobs, (more to come)
├── components/ui/      # shadcn primitives — add via `npx shadcn@latest add ...`
├── lib/                # api.js (axios), firebase.js, utils.js (cn)
├── hooks/              # (useAuth, useVoiceRecorder — to be added)
└── constants/          # role categories, plans, voice script
```

`@/` is aliased to `src/` via Craco + jsconfig.

## Stack

React 19 · CRA + Craco · Tailwind + shadcn/ui (Radix) · react-router v7 · SWR + axios · react-hook-form + zod · Firebase JS SDK · sonner · framer-motion

## Where to read next

- `../travel-jobs-docs/AGENT_MEMORY.md` — operating rules
- `../travel-jobs-docs/PRD.md` — what to build (Phase 1 §3)
- `../travel-jobs-docs/ARCHITECTURE.md` — API surface, env vars
- `../Opsyjobs/frontend/` — sibling project, reference patterns
