# Papyrus database and data-flow documentation

## 1. Database implementation

Papyrus uses SQLite through Bun's `bun:sqlite` driver.

- [`schema.sql`](./db/schema.sql) creates tables, constraints, and indexes.
- [`db.ts`](./db/db.ts) lazily opens the database and runs the schema.
- [`db/functions/`](./db/functions/) contains the application queries and
  write operations.
- [`lib/`](./lib/) contains authentication, request metadata, rate limiting,
  and file logging rather than database models.

The database path is read from `DB_PATH` and defaults to `papyrus.sqlite`.
Foreign-key enforcement is enabled in the schema. The application currently
initializes the schema at startup with idempotent `CREATE TABLE IF NOT EXISTS`
and `CREATE INDEX IF NOT EXISTS` statements; it does not have a versioned
migration runner.

## 2. Catalog hierarchy

```text
Board
├── Class level
│   └── Subject
├── Resource type
└── Paper
    ├── Class level
    ├── Subject
    └── Resource type
```

Compound foreign keys on `papers` ensure that the selected class level belongs
to the selected board, the subject belongs to the selected class level, and
the resource type belongs to the selected board.

## 3. Tables

### `boards`

Education boards or institutions.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `name` | TEXT | Required, unique |
| `code` | TEXT | Required, unique |

### `class_levels`

Grades or class levels under a board.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `board_id` | INTEGER | Required; cascades when its board is deleted |
| `name` | TEXT | Required, unique per board |
| `slug` | TEXT | Required, unique per board |

### `subjects`

Subjects under a class level.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `class_level_id` | INTEGER | Required; cascades when its class level is deleted |
| `name` | TEXT | Required, unique per class level |
| `slug` | TEXT | Required, unique per class level |
| `accent_color` | TEXT | Required, defaults to `#c97732` |

### `resource_types`

Categories such as exam paper, guide, or notes under a board.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `board_id` | INTEGER | Required; cascades when its board is deleted |
| `name` | TEXT | Required, unique per board |

### `papers`

The central paper catalog and CDN object metadata.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | TEXT | UUIDv7-style application-generated primary key |
| `title` | TEXT | Required |
| `description` | TEXT | Optional |
| `duration` | INTEGER | Optional; positive minutes when present |
| `board_id` | INTEGER | Required; compound reference to `boards` hierarchy |
| `class_level_id` | INTEGER | Required; must belong to `board_id` |
| `subject_id` | INTEGER | Required; must belong to `class_level_id` |
| `resource_type_id` | INTEGER | Required; must belong to `board_id` |
| `exam_year` | INTEGER | Required; at least `1900` |
| `file_id` | TEXT | Required Hack Club CDN object ID |
| `file_name` | TEXT | Required CDN object filename |
| `file_size_bytes` | INTEGER | Required; non-negative |
| `downloads_count` | INTEGER | Aggregate non-preview download count |
| `upvotes_count` | INTEGER | Cached aggregate helpful votes |
| `downvotes_count` | INTEGER | Cached aggregate issue votes |
| `status` | TEXT | `review`, `approved`, `hidden`, or `soft_delete` |
| `created_at` | TEXT | Required; SQLite current timestamp by default |

Board hierarchy foreign keys use `ON DELETE RESTRICT`, so referenced catalog
records cannot be deleted while papers use them. A paper's `status` controls
visibility:

- `review`: awaiting moderation and excluded from public listings.
- `approved`: visible in public listings and downloadable.
- `hidden`: retained but excluded from public listings.
- `soft_delete`: logically removed and retained for admin visibility/recovery.

### `contributor_submissions`

Private submission contact data and comments.

| Column | Type | Rules |
| --- | --- | --- |
| `paper_id` | TEXT | Primary key and cascading paper reference |
| `contributor_email` | TEXT | Required |
| `comments` | TEXT | Optional |
| `created_at` | TEXT | Submission timestamp |

The application deletes this row when a paper changes from review to another
status or when the paper is deleted.

### `paper_reports`

Reports submitted by visitors and processed by admins.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `paper_id` | TEXT | Required, cascades with paper |
| `reason` | TEXT | Required |
| `details` | TEXT | Optional |
| `reporter_email` | TEXT | Optional |
| `status` | TEXT | `pending`, `resolved`, or `dismissed` |
| `created_at` | TEXT | Report timestamp |

### `paper_votes`

One client-based vote per paper.

| Column | Type | Rules |
| --- | --- | --- |
| `id` | INTEGER | Primary key, auto-increment |
| `paper_id` | TEXT | Required, cascades with paper |
| `vote_type` | TEXT | `up` or `down` |
| `client_id` | TEXT | Required browser-generated identifier |
| `created_at` | TEXT | Vote timestamp |

`(paper_id, client_id)` is unique. Changing or removing a vote updates the
cached counters on `papers`.

## 4. Database data flows

### Catalog management

Admins create a board. The create operation also creates a default class level,
subject, and `Exam paper` resource type. Admins can then add, edit, or delete
class levels, subjects, and resource types. Catalog deletion is constrained by
foreign keys when papers still reference the record.

Public catalog reads use `getBoardOptions()` and include boards with nested
class levels, subjects, and resource types. The upload form uses this response
to build dependent metadata selectors.

### Submission transaction-like flow

`POST /api/papers/upload` performs these operations in order:

1. Validate request size, content type, IP rate limit, fields, hierarchy, and
   PDF signature.
2. Upload the PDF to the Hack Club CDN.
3. Insert the paper metadata with `review` status.
4. Insert private contributor details.
5. Log the successful creation.

If a later operation fails, the route attempts to delete the CDN object and
the paper row. These compensating operations are not a single database/CDN
transaction.

### Public paper queries

`listPapers()` returns approved papers to public callers and supports:

- text search across title, description, board, class, subject, and type;
- board, class-level, subject, resource-type, and year filters;
- `limit` and `offset` pagination;
- admin-only status filtering and contributor-email search.

`getPaper()` returns public approved details or admin details when the caller
has authenticated. `incrementDownloads()` increments only approved papers and
is skipped for preview requests.

### Moderation and reports

Admin paper updates change metadata or status. Leaving `review` removes the
private contributor row. Soft deletion changes status rather than deleting the
paper or CDN file. Reports remain separate rows and can be listed, resolved,
dismissed, or deleted by admins.

### Logging

Server and admin events are written to separate line-oriented log files using
`SERVER_LOG_PATH` and `ADMIN_LOG_PATH`. Logs include events such as login,
paper creation/failure, downloads, votes, reports, catalog changes, and admin
status changes. Logs are outside SQLite and are not a durable audit table.

## 5. Indexes

The schema includes:

| Index | Purpose |
| --- | --- |
| `idx_papers_filter` | Combined catalog filtering |
| `idx_papers_status_created` | Public/admin status listings ordered by creation |
| `idx_papers_file_id` | CDN object lookup |
| `idx_papers_board` | Board filtering |
| `idx_papers_class_level` | Class-level filtering |
| `idx_papers_subject` | Subject filtering |
| `idx_papers_resource_type` | Resource-type filtering |
| `idx_papers_exam_year` | Year filtering |
| `idx_resource_types_board` | Board resource-type lookup |
| `idx_class_levels_board` | Board class-level lookup |
| `idx_subjects_class_level` | Class-level subject lookup |
| `idx_reports_paper` | Reports for a paper |
| `idx_reports_status` | Report status filtering |
| `idx_reports_status_created` | Report queues ordered by creation |
| `idx_votes_paper` | Vote aggregation by paper |
| `idx_votes_client` | Vote lookup for a paper/client pair |

Primary keys and unique constraints also create SQLite indexes.

## 6. Data outside SQLite

- PDF bytes live on the Hack Club CDN.
- Pins and pin groups live in browser `localStorage` under
  `papyrus-pins` and `papyrus-groups`.
- Theme is stored under `papyrus-theme`.
- The preferred landing page is stored under `papyrus-default-view`.
- The preferred board is stored under `papyrus-default-board`.
- The voting identifier is stored under `papyrus-client-id`.
- Admin sessions live in the HTTP-only `papyrus-admin` cookie.
- Server and admin logs live in configured filesystem directories.

No user table, download-history table, role table, or durable moderation-audit
table currently exists.

## 7. Current limitations and operational requirements

- Schema initialization is repeatable but there are no versioned migrations.
- Database writes and CDN writes cannot be atomic; the upload route uses
  cleanup attempts instead.
- The process-local rate limiter does not coordinate across instances.
- SQLite and local logs require persistent volumes and are not automatically
  backed up by the application.
- Restoring SQLite does not restore CDN files; both stores need retention and
  recovery plans.
- Votes use browser identifiers and can be reset or duplicated across browsers.
- Contributor and reporter email fields have application validation but no
  account ownership verification.
- The repository has build and formatting scripts, but no complete automated
  test, lint, migration, backup, or restore workflow.
