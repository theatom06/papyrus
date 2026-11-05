# Papyrus

**Exam practice made a little less stressful.**

Papyrus is a friendly place to find and practise with past exam papers.
Search for what you need, preview it, save it for later, and get back to
studying without digging through a hundred random links.

Live site: <https://papyrus.steve.hackclub.app>

## Why Papyrus?

Past papers are incredibly useful, but finding the right one is often harder
than it should be. They are spread across old websites, buried in search
results, and sometimes hidden behind paywalls.

Papyrus is our attempt to make that part easier. Less time hunting for PDFs
means more time learning, revising, and feeling ready for the exam.

## What it includes

- Search and filter papers by board, class, subject, type, year, or title.
- Preview and download PDFs.
- Save papers into personal shelves like **Study list** and **Exam week**.
- Vote on useful papers and report broken or incorrect material.
- Upload papers for community review.
- Choose light, dark, or true black mode.
- Manage papers, reports, boards, and submissions in the admin area.

Personal shelves and preferences are saved in the browser. No ordinary user
account is needed.

## Run it locally

Papyrus uses [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Open <http://localhost:3000>.

For a production build:

```bash
bun run build
bun run start
```

To set the admin password:

```bash
bun run set:password
```

Create a `.env.local` file before using admin or upload features:

```env
ADMIN_PASSWORD_HASH=
ADMIN_JWT_SECRET=
HC_CDN_API_KEY=
```

Optional settings include `DB_PATH`, `SERVER_LOG_PATH`, `ADMIN_LOG_PATH`, and
`NOLOGS`. Keep your secrets private and never commit `.env.local`.

## A little technical context

Papyrus is a Next.js app written in TypeScript. It uses React and Tailwind
CSS for the interface, SQLite for catalogue data, and the Hack Club CDN for
PDF storage.

The usual upload flow is simple:

1. Someone submits a PDF and its details.
2. The server checks the file and metadata.
3. The paper waits in the review queue.
4. An admin approves it.
5. It appears in the public archive.

Admin sessions use a signed, HTTP-only cookie. Public browsing does not need
an account.

## Useful pages

| Page | Purpose |
| --- | --- |
| `/home` | The starting point |
| `/archive` | Search the paper collection |
| `/paper/:id` | View, vote on, report, or download a paper |
| `/upload` | Share a paper |
| `/pins` | See saved papers |
| `/settings` | Choose local preferences |
| `/login` | Admin sign-in |
| `/admin` | Review and catalogue tools |

API routes are in [`app/api`](./app/api), and the database schema is in
[`db/schema.sql`](./db/schema.sql).

## Project folders

```text
app/          Pages and API routes
components/   Shared interface components
db/           Database and file-storage helpers
lib/          Server utilities
util/         Small shared helpers
public/       Static files
scripts/      Maintenance scripts
```

## Contributing

Papyrus is a small project, and small improvements genuinely help. You can
fix a rough edge, make a page clearer, improve search, or share useful study
material.

For code changes:

1. Make a focused branch.
2. Follow the existing TypeScript and Tailwind patterns.
3. Run:

   ```bash
   npx tsc --noEmit
   git diff --check
   ```

4. Explain what you changed and how you tested it.

For paper uploads, only share material you are allowed to share. Add accurate
metadata and make sure the PDF is readable. Every upload is checked before it
reaches the archive.

Thanks for helping make studying feel a little less overwhelming. 💛
