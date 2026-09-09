Papyrus — Exam practice made less stressful

Overview

A small Next.js app (app-router) that helps students find past exam papers, mocks, and mark schemes.

Quick start

```bash
pnpm install
pnpm dev
```

What I changed

- Updated project name and description in `package.json`.
- Made the paper descriptions more conversational in `components/papyrus-data.ts`.
- Improved header semantics and accessibility in `components/site-header.tsx`.

Notes & suggestions

- The paper data is currently in `components/papyrus-data.ts`. Consider moving it to a `data/` folder or a simple JSON/MD source if you plan to scale or fetch remotely.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` which suppresses type errors during build — review this if you want stricter CI checks.
- Consider adding a small accessibility CSS helper (e.g. `.sr-only`) if you add skip links.

If you want, I can:

- Convert the in-memory data to a JSON API and add a simple server route.
- Run the project locally and open the dev server to verify the UI.
