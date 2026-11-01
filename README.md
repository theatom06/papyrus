# Papyrus

Papyrus is a student-focused archive for finding, viewing, rating, reporting,
and contributing exam papers. It is a single Next.js application with a
server-side SQLite catalog and Hack Club CDN file storage.

Live demo: <https://papyrus.steve.hackclub.app>

## Vision/Motivation

As a student who has navigated the board exam phase, I found that practicing past papers was one of the single most effective preparation tools. However, high-quality papers were often scattered across obscure websites or hidden behind paywalls. My friends and I spent countless hours scouring the internet just to find complete, clean PDFs.

Papyrus was created to eliminate that friction. By centralizing authentic exam papers and study materials into a fast, zero-distraction archive, Papyrus helps students focus on what actually matters: effective preparation.

## What is implemented

### Public front

- A beautiful Home page
- Archive browsing with search, board/class/subject/type/year filters, URL-synchronized filters, and client-side sorting.
- Paper view pages with metadata, PDF preview, download, sharing, pinning, helpful/issues voting, and paper reporting.
- Community PDF submissions that enter a moderation queue.
- A shelf to keep pin in various groups
- Full Support for Light, Dark and True Black!!
- Responsive layouts, loading states, empty states, error states and toast notifications system.
- A small feature is that when you click share on the paper view page it actully dosn't copy the current URL but instead copies to a proxy `/p/:paper_id` which redirects to the actual paper view page. 

### Admin front

- Password-protected admin login with an eight-hour signed session cookie. (AI helped make the JWT signing and verification code.)
- Admin Dashboard with statistics, recent activity, and quick links.
- Review queue for approving submitted papers.
- Paper Studio: for Paper management, metadata editing, approval,
  hiding, and soft deletion.
- Poor-performing paper view based on votes, downloads, and pending reports.
- Board Studio: for creating and editing boards, class-levels, subject, and resource-type management.
- Report management with pending, resolved, and dismissed states.

## Architecture

Papyrus is a Next.js App:

- **Runtime:** Bun
- **Framework:** Next.js 16
- **Language:** TypeScript
- **UI:** React, vanilla CSS, and Lucide icons
- **Database:** SQLite through Bun's `bun:sqlite` driver
- **Files:** Hack Club CDN through `db/hc-cdn.ts`
- **Authentication:** bcrypt password verification plus an HMAC-SHA256 signed
  admin token
  
## Data flow

### Browsing and viewing a paper

1. The user go to `/archive` which requests `GET /api/papers`.
2. The API returns approved papers by default which are shown on the frontend, with a maximum public page size of 100 and a default page size of 20.
3. Filters and search values are translated into parameterized SQLite queries.
4. The paper page requests `GET /api/papers/:id`.
5. The download/preview endpoint requests a CDN URL from the stored
   `file_id` and `file_name`.
6. If the user clicks the download button it increments `downloads_count`.

The reason I opted for parameterized URL queries is so that in the paper view page one can easily go back to the archive page with the same or related filters applied

### Upload and moderation

1. The upload page loads public catalog options from `GET /api/boards`.
2. A contributor submits contact information, title, metadata, comments, and a
   PDF to `POST /api/papers/upload`.
3. The server rate-limits the client address, checks the multipart request size,
   validates metadata relationships, validates the email and duration, and
   checks the PDF extension, MIME type, and `%PDF-` magic bytes.
4. The PDF is uploaded to the Hack Club CDN.
5. A `papers` row is created with `status = 'review'`, and private contributor
   details are stored in `contributor_submissions`.
6. An admin approves, hides, or soft-deletes the paper through the admin
   interface. Only approved papers appear in the public archive.
7. CDN cleanup is attempted if database creation fails.

### Voting

1. The browser creates a client identifier in `localStorage`.
2. `GET /api/papers/:id/vote` returns aggregate counts and that client's vote.
3. `POST` creates, changes, or removes one vote for that paper/client pair.
4. The server recalculates and stores aggregate up/down counters on `papers`.

### Reporting

1. A visitor selects a reason from the paper report dialog and may provide
   details and an email address.
2. `POST /api/papers/:id/report` stores a pending `paper_reports` row.
3. An admin reviews reports through `/admin/reports`.
4. Reports can be marked `resolved`, `dismissed`, returned to `pending`, or
   deleted.

## Routes

### Pages

| Route | Purpose |
| --- | --- |
| `/home` | Public landing page |
| `/archive` | Searchable and filterable approved-paper archive |
| `/paper/:id` | Paper metadata, preview, voting, reporting, and download actions |
| `/upload` | Community submission form |
| `/pins` | Browser-local pinned papers and groups |
| `/settings` | Browser-local preferences |
| `/login` | Admin login |
| `/admin` | Admin dashboard |
| `/admin/review` | Review queue |
| `/admin/papers` | Paper management |
| `/admin/papers/:id` | Paper editing and reports |
| `/admin/boards` | Board Studio |
| `/admin/boards/:id` | Board hierarchy management |
| `/admin/reports` | Report management |
| `/admin/poor-performing` | Low-performing paper report |

### API

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/login` | `POST`, `DELETE` | Create or clear admin session |
| `/api/boards` | `GET`, `POST` | List catalog options or create a board |
| `/api/boards/:id` | `GET`, `PATCH` | Read or edit a board |
| `/api/boards/:id/class-levels` | `POST` | Add a class level |
| `/api/boards/:id/resource-types` | `POST` | Add a resource type |
| `/api/class-levels/:id` | `PATCH`, `DELETE` | Edit or delete a class level |
| `/api/class-levels/:id/subjects` | `POST` | Add a subject |
| `/api/subjects/:id` | `PATCH`, `DELETE` | Edit or delete a subject |
| `/api/resource-types/:id` | `PATCH`, `DELETE` | Edit or delete a resource type |
| `/api/papers` | `GET` | List papers and apply filters |
| `/api/papers/upload` | `POST` | Validate and submit a PDF |
| `/api/papers/:id` | `GET`, `PATCH`, `DELETE` | Read or administer a paper |
| `/api/papers/:id/download` | `GET` | Redirect to CDN preview/download |
| `/api/papers/:id/vote` | `GET`, `POST` | Read or change client vote |
| `/api/papers/:id/report` | `POST` | Submit a paper report |
| `/api/papers/poor-performing` | `GET` | Admin performance report |
| `/api/reports` | `GET` | List admin reports |
| `/api/reports/:id` | `PATCH`, `DELETE` | Update or delete a report |

## Authentication and authorization

There are no user accounts. The only server-side account is the admin login:

1. The submitted password is compared with the bcrypt hash in
   `ADMIN_PASSWORD_HASH`.
2. Successful login sets the HTTP-only `papyrus-admin` cookie.
3. The token contains issuer, audience, subject, issue time, and an eight-hour
   expiry and is signed with `ADMIN_JWT_SECRET`.
4. Admin API handlers call `requireAdmin`; admin pages are also protected by
   `proxy.ts`.

Public archive reads, catalog reads, uploads, and votes are intentionally
available without an account. Reports are persisted by their API route and
admin report operations require the admin cookie. The current rate limiter is
process-local, so it does not coordinate across multiple instances.

## Environment variables

| Variable | Use | Default/requirement |
| --- | --- | --- |
| `ADMIN_PASSWORD_HASH` | Base64-encoded bcrypt hash for admin login | Required |
| `ADMIN_JWT_SECRET` | Secret used to sign admin tokens | Required |
| `HC_CDN_API_KEY` | Hack Club CDN upload/delete authorization | Required for uploads |
| `DB_PATH` | SQLite database path | `papyrus.sqlite` |
| `SERVER_LOG_PATH` | Directory for server logs | `./logs/server` |
| `ADMIN_LOG_PATH` | Directory for admin logs | `./logs/admin` |

## Storage and privacy

SQLite stores catalog metadata, aggregate counters, votes, reports, and
temporary contributor details.

PDF files are not stored in SQLite; the CDN is the file store and `papers.file_id`/`papers.file_name` identify the object.

Pins, groups, theme, default view, default board, and the voting client ID are
stored in each visitor's browser `localStorage`. They are not synchronized
between devices and are lost when browser storage is cleared.

## Development

Install dependencies and run the development server:

```bash
bun install
bun run dev
```

Create a production build:

```bash
bun run build
bun run start
```

Just Make sure you dont forget to set your env variables else it just doesnt work.

Also to set the password use the command:

```bash
bun run set:password
```

## Contributing

We welcome community contributions, whether you are submitting code or sharing study materials!

### 1. Contributing Code
Papyrus is open-source. To maintain code quality and maintainability:
* **Human Oversight Required:** We strictly prohibit unreviewed AI-generated slop. While AI tools can assist your workflow, all pull requests must be thoroughly reviewed, tested, and accompanied by clear, human-written documentation and explanations.

### 2. Contributing Papers & Materials
To submit papers for the archive, use the in-app **Upload** page. All submissions undergo a manual review process before being published to ensure quality.

When submitting materials, please ensure:
1. **Rights & Permissions:** Only submit materials you have the right to share. Do not upload copyrighted commercial content.
2. **Accurate Metadata:** Include clear details (Subject, Grade/Class, Board, Exam Year, and Chapter/Topic).
3. **Format & Integrity:** Upload clean, readable PDFs (Preferably soft copies) that are not password-protected or corrupted.
4. **Patience:** Manual review takes a little time, but approved submissions will be cataloged promptly!

---

Note: This readme was made in Obsidian