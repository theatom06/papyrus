# Papyrus database

## 1. Overview

Papyrus uses SQLite to store its paper catalog and the metadata needed to
organize and retrieve papers.

The database path is configured with `DB_PATH` and defaults to
`papyrus.sqlite`. Bun's `bun:sqlite` driver is used for all database access.

The database implementation is split across these files:

- [schema.sql](./schema.sql) defines tables, relationships, constraints, and
  indexes.
- [db.ts](./db.ts) is the low-level Bun SQLite driver. It reads
  [schema.sql](./schema.sql) with Bun file APIs.
- [db-service.ts](./db-service.ts) is the application database wrapper. Routes
  use its typed operations instead of embedding SQL queries.
- [seed-data.ts](./seed-data.ts) contains the sample paper records.

## 2. Data model

The catalog is organized around a hierarchy:

```text
Board
└── Class level
    └── Subject
        └── Paper
```

Resource types provide a second classification for papers:

```text
Board
├── Class levels
│   └── Subjects
├── Resource types
└── Papers
    ├── Class level
    ├── Subject
    └── Resource type
```

The database is designed so that:

- A board can have many class levels, resource types, and papers.
- A class level belongs to one board and can have many subjects.
- A subject belongs to one class level and can have many papers.
- A resource type belongs to one board and can classify many papers.
- A paper belongs to one board, class level, subject, and resource type.

The relationships on `papers` are intentionally validated together. A paper
cannot use a class level from one board and a subject or resource type from
another board.

## 3. Tables

### 3.1 `boards`

Stores an education board or institution.

| Column | Type      | Constraints                 |
| ------ | --------- | --------------------------- |
| `id`   | `INTEGER` | Primary key, auto-increment |
| `name` | `TEXT`    | Required, unique            |
| `code` | `TEXT`    | Required, unique            |

### 3.2 `class_levels`

Stores a class or grade belonging to a board.

| Column         | Type      | Constraints                              |
| -------------- | --------- | ---------------------------------------- |
| `id`           | `INTEGER` | Primary key, auto-increment              |
| `board_id`     | `INTEGER` | Required, references `boards.id`         |
| `name`         | `TEXT`    | Required                                 |
| `slug`         | `TEXT`    | Required                                 |
| `accent_color` | `TEXT`    | Required; CSS color used by the frontend |

The following combinations must be unique:

- `(board_id, name)`
- `(board_id, slug)`

Deleting a board cascades to its class levels.

### 3.3 `subjects`

Stores a subject belonging to a class level.

| Column           | Type      | Constraints                            |
| ---------------- | --------- | -------------------------------------- |
| `id`             | `INTEGER` | Primary key, auto-increment            |
| `class_level_id` | `INTEGER` | Required, references `class_levels.id` |
| `name`           | `TEXT`    | Required                               |
| `slug`           | `TEXT`    | Required                               |

The following combinations must be unique:

- `(class_level_id, name)`
- `(class_level_id, slug)`

Deleting a class level cascades to its subjects.

### 3.4 `resource_types`

Stores a paper or resource category belonging to a board.

| Column     | Type      | Constraints                      |
| ---------- | --------- | -------------------------------- |
| `id`       | `INTEGER` | Primary key, auto-increment      |
| `board_id` | `INTEGER` | Required, references `boards.id` |
| `name`     | `TEXT`    | Required                         |

The combination `(board_id, name)` must be unique. Deleting a board cascades
to its resource types.

### 3.5 `papers`

Stores the paper catalog and its file metadata.

| Column             | Type      | Constraints                                                |
| ------------------ | --------- | ---------------------------------------------------------- |
| `id`               | `TEXT`    | Primary key                                                |
| `title`            | `TEXT`    | Required                                                   |
| `description`      | `TEXT`    | Optional                                                   |
| `duration`         | `INTEGER` | Optional; duration in minutes and must be positive         |
| `board_id`         | `INTEGER` | Required, references `boards.id`                           |
| `class_level_id`   | `INTEGER` | Required, references `class_levels.id`                     |
| `subject_id`       | `INTEGER` | Required, references `subjects.id`                         |
| `resource_type_id` | `INTEGER` | Required, references `resource_types.id`                   |
| `exam_year`        | `INTEGER` | Required; must be at least `1900`                          |
| `file_path`        | `TEXT`    | Required                                                   |
| `file_size_bytes`  | `INTEGER` | Required; must be non-negative                             |
| `downloads_count`  | `INTEGER` | Required; defaults to `0`                                  |
| `status`           | `TEXT`    | Required; `review`, `approved`, `soft_delete`, or `hidden` |
| `created_at`       | `TEXT`    | Required; defaults to `CURRENT_TIMESTAMP`                  |

The foreign keys on `papers` use `ON DELETE RESTRICT`. Therefore, a board,
class level, subject, or resource type cannot be deleted while a paper
references it.

`status` controls paper visibility and lifecycle:

- `review`: submitted but waiting for moderation; not visible in the public
  archive.
- `approved`: approved and visible in the public archive.
- `hidden`: retained in the database but not visible in the public archive.
- `soft_delete`: logically deleted and retained for administrative recovery;
  not visible in the public archive.

### 3.6 `contributor_submissions`

Stores contact details and private moderator notes while a paper is awaiting
review. The row is deleted when the paper is approved, hidden, or soft-deleted.

| Column              | Type   | Constraints                           |
| ------------------- | ------ | ------------------------------------- |
| `paper_id`          | `TEXT` | Primary key, references `papers.id`   |
| `contributor_email` | `TEXT` | Required contact email                |
| `comments`          | `TEXT` | Optional private contributor comments |
| `created_at`        | `TEXT` | Creation timestamp                    |

## 4. Integrity rules

SQLite foreign-key enforcement is enabled when the database connection opens.

The schema enforces the following rules:

- Board names and codes must be unique.
- Class-level names and slugs must be unique within a board.
- Subject names and slugs must be unique within a class level.
- Resource-type names must be unique within a board.
- Paper duration is either `NULL` or a positive integer.
- Paper exam years must be at least `1900`.
- Paper file sizes must be non-negative.
- `status` can only be `review`, `approved`, `soft_delete`, or `hidden`.
- Paper hierarchy references must belong to the correct parent records.

## 5. Indexes

The schema defines these indexes for hierarchy lookups and paper filtering:

| Index                      | Columns                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `idx_papers_filter`        | `papers(board_id, class_level_id, subject_id, resource_type_id, exam_year)` |
| `idx_resource_types_board` | `resource_types(board_id)`                                                  |
| `idx_class_levels_board`   | `class_levels(board_id)`                                                    |
| `idx_subjects_class_level` | `subjects(class_level_id)`                                                  |
| `idx_papers_board`         | `papers(board_id)`                                                          |
| `idx_papers_class_level`   | `papers(class_level_id)`                                                    |
| `idx_papers_subject`       | `papers(subject_id)`                                                        |
| `idx_papers_resource_type` | `papers(resource_type_id)`                                                  |
| `idx_papers_exam_year`     | `papers(exam_year)`                                                         |

SQLite also creates automatic indexes for primary keys and unique constraints.

## 6. Current database contents

The local development database currently contains:

| Table            | Rows |
| ---------------- | ---: |
| `boards`         |    3 |
| `class_levels`   |    3 |
| `subjects`       |   12 |
| `resource_types` |   12 |
| `papers`         |   30 |

### Boards and class levels

| Board code | Board                                     | Class level |
| ---------- | ----------------------------------------- | ----------- |
| `CBSE`     | Central Board of Secondary Education      | Grade 10    |
| `ICSE`     | Indian Certificate of Secondary Education | Grade 10    |
| `PU`       | Punjab University                         | Grade 12    |

Each class level currently has these subjects:

- Physics
- Mathematics
- Chemistry
- English Literature

Each board currently has these resource types:

- Exam paper
- Worksheet
- Revision guide
- Chapter notes

Each board currently has 10 papers.

## 7. Initialization and seed behavior

When the application starts:

1. SQLite foreign-key enforcement is enabled.
2. Tables and indexes are created if they do not already exist.
3. The application counts rows in `papers`.
4. If `papers` is empty, the default boards, class levels, subjects, resource
   types, and sample papers are inserted.
5. If at least one paper exists, seeding is skipped.

There is currently no migration framework. The schema uses
`CREATE TABLE IF NOT EXISTS`, so changing [db/schema.sql](./db/schema.sql) does not
alter an existing database automatically. Future schema changes require an
explicit migration or database upgrade step.

## 8. Admin action logging

Administrative actions are recorded as newline-delimited JSON files in the
directory configured by `ADMIN_LOG_PATH` (default `logs/admin`). General server
events are recorded in the directory configured by `SERVER_LOG_PATH` (default
`logs/server`).

Admin logs include successful and failed admin logins, logouts, paper creation,
paper updates, paper soft deletion, and board creation or updates. Server logs
include requests, uploads, downloads, and failures.
Passwords are never written to the log.

The log file is intentionally separate from the database so routine admin
activity does not create database rows. Log rotation and centralized log
storage should be added before production deployment.

## 9. Data outside SQLite

The following features do not currently have database tables:

- Users, roles, and admin accounts
- Password records
- Pin records and pin groups
- Download history
- Upload history
- Topics, chapters, and tags
- Reviews and ratings
- Audit logs
- Application settings

Current storage behavior:

- Pins and pin groups are stored in browser `localStorage`.
- Theme preferences are stored in browser `localStorage`.
- Admin authentication uses a server-side bcrypt hash in
  `ADMIN_PASSWORD_HASH` and a signed JWT session using `ADMIN_JWT_SECRET`.
  Generate the password hash with `bun run set:admin-password`.
- Upload contributor emails and private comments are stored in
  `contributor_submissions` while review is pending. They are returned only to
  authenticated admin views and removed when the paper leaves moderation.

## 10. Potential future tables

If these features are added, they should be modeled explicitly rather than
stored only in browser state or environment variables:

- `users` and `roles` for account-based authentication
- `pin_groups` and `pins` for synchronized user collections
- `downloads` for download history and analytics
- `uploads` for upload tracking and processing status
- `topics` or `chapters` for finer paper categorization
- `tags` and a paper-to-tag join table for flexible filtering
- `reviews` or `ratings` for user feedback
- `audit_logs` for administrative changes
- `settings` for persistent application configuration
