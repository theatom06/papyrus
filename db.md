# Papyrus Database Documentation

## 1. Overview

Papyrus uses SQLite to store its paper catalog and the metadata needed to organize and retrieve papers.

The database path is configured with `DB_PATH` and defaults to `papyrus.sqlite`. Bun's `bun:sqlite` driver is used for all database access.

The database implementation is split across these files:

- [schema.sql](./schema.sql) defines tables, relationships, constraints, and indexes.
- [db.ts](./db.ts) is the low-level Bun SQLite driver. It reads [schema.sql](./schema.sql) with Bun file APIs.
- [db-service.ts](./db-service.ts) is the application database wrapper. Routes use its typed operations instead of embedding SQL queries.

---

## 2. Data Model

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

The relationships on `papers` are intentionally validated together. A paper cannot use a class level from one board and a subject or resource type from another board.

---

## 3. Tables

### 3.1 `boards`
Stores an education board or institution.

| Column | Type      | Constraints                 |
| ------ | --------- | --------------------------- |
| `id`   | `INTEGER` | Primary key, auto-increment |
| `name` | `TEXT`    | Required, unique            |
| `code` | `TEXT`    | Required, unique            |

---

### 3.2 `class_levels`
Stores a class or grade belonging to a board.

| Column     | Type      | Constraints                      |
| ---------- | --------- | -------------------------------- |
| `id`       | `INTEGER` | Primary key, auto-increment      |
| `board_id` | `INTEGER` | Required, references `boards.id` |
| `name`     | `TEXT`    | Required                         |
| `slug`     | `TEXT`    | Required                         |

The following combinations must be unique:
- `(board_id, name)`
- `(board_id, slug)`
- `(id, board_id)` *(used to support compound foreign keys)*

Deleting a board cascades to its class levels.

---

### 3.3 `subjects`
Stores a subject belonging to a class level.

| Column           | Type      | Constraints                            |
| ---------------- | --------- | -------------------------------------- |
| `id`             | `INTEGER` | Primary key, auto-increment            |
| `class_level_id` | `INTEGER` | Required, references `class_levels.id` |
| `name`           | `TEXT`    | Required                               |
| `slug`           | `TEXT`    | Required                               |
| `accent_color`   | `TEXT`    | Required; CSS color used by frontend   |

The following combinations must be unique:
- `(class_level_id, name)`
- `(class_level_id, slug)`
- `(id, class_level_id)` *(used to support compound foreign keys)*

Deleting a class level cascades to its subjects.

---

### 3.4 `resource_types`
Stores a paper or resource category belonging to a board.

| Column     | Type      | Constraints                      |
| ---------- | --------- | -------------------------------- |
| `id`       | `INTEGER` | Primary key, auto-increment      |
| `board_id` | `INTEGER` | Required, references `boards.id` |
| `name`     | `TEXT`    | Required                         |

The following combinations must be unique:
- `(board_id, name)`
- `(id, board_id)` *(used to support compound foreign keys)*

Deleting a board cascades to its resource types.

---

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
| `upvotes_count`    | `INTEGER` | Required; defaults to `0`                                  |
| `downvotes_count`  | `INTEGER` | Required; defaults to `0`                                  |
| `status`           | `TEXT`    | Required; `review`, `approved`, `soft_delete`, or `hidden` |
| `created_at`       | `TEXT`    | Required; defaults to `CURRENT_TIMESTAMP`                  |

The foreign keys on `papers` use `ON DELETE RESTRICT`. Therefore, a board, class level, subject, or resource type cannot be deleted while a paper references it.

`status` controls paper visibility and lifecycle:
- `review`: submitted but waiting for moderation; not visible in the public archive.
- `approved`: approved and visible in the public archive.
- `hidden`: retained in the database but not visible in the public archive.
- `soft_delete`: logically deleted and retained for administrative recovery; not visible in the public archive.

---

### 3.6 `contributor_submissions`
Stores contact details and private moderator notes while a paper is awaiting review. The row is deleted when the paper is approved, hidden, or soft-deleted.

| Column              | Type   | Constraints                           |
| ------------------- | ------ | ------------------------------------- |
| `paper_id`          | `TEXT` | Primary key, references `papers.id`   |
| `contributor_email` | `TEXT` | Required contact email                |
| `comments`          | `TEXT` | Optional private contributor comments |
| `created_at`        | `TEXT` | Creation timestamp                    |

---

### 3.7 `paper_reports`
Stores user-submitted flags or reports against specific papers.

| Column           | Type      | Constraints                                         |
| ---------------- | --------- | --------------------------------------------------- |
| `id`             | `INTEGER` | Primary key, auto-increment                         |
| `paper_id`       | `TEXT`    | Required, references `papers.id` ON DELETE CASCADE  |
| `reason`         | `TEXT`    | Required                                            |
| `details`        | `TEXT`    | Optional                                            |
| `reporter_email` | `TEXT`    | Optional                                            |
| `status`         | `TEXT`    | Required; `pending`, `resolved`, or `dismissed`     |
| `created_at`     | `TEXT`    | Required; defaults to `CURRENT_TIMESTAMP`           |

---

### 3.8 `paper_votes`
Tracks user upvotes and downvotes on papers per client to prevent duplicate voting.

| Column      | Type      | Constraints                                         |
| ----------- | --------- | --------------------------------------------------- |
| `id`        | `INTEGER` | Primary key, auto-increment                         |
| `paper_id`  | `TEXT`    | Required, references `papers.id` ON DELETE CASCADE  |
| `vote_type` | `TEXT`    | Required; `up` or `down`                            |
| `client_id` | `TEXT`    | Required identifier for the voter/client            |
| `created_at`| `TEXT`    | Required; defaults to `CURRENT_TIMESTAMP`           |

*Constraint:* The combination `(paper_id, client_id)` must be unique.

---

## 4. Integrity Rules

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

---

## 5. Indexes

The schema defines these indexes for hierarchy lookups, filtering, and performance:

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
| `idx_reports_paper`        | `paper_reports(paper_id)`                                                   |
| `idx_reports_status`       | `paper_reports(status)`                                                     |
| `idx_votes_paper`          | `paper_votes(paper_id)`                                                     |
| `idx_votes_client`         | `paper_votes(paper_id, client_id)`                                          |

SQLite also creates automatic indexes for primary keys and unique constraints.

---

## 6. What Lives Outside the Database?

Not everything makes it into SQLite! Some things are kept lightweight, client-side, or managed via environment configurations. Here is how we handle the rest:

### Local Storage (Browser Side)
* **Pins & Pin Groups:** If users bookmark or pin papers for quick access, we keep track of those lists right in the browser's `localStorage` so they persist seamlessly across visits without needing a full user account system.
* **Theme Preferences:** Dark mode, light mode, and other visual styling choices are saved locally on the client.

### Environment & Authentication
* **Admin Security:** We don’t have an `admins` table in the database. Instead, admin authentication relies on a server-side bcrypt hash stored securely in the `ADMIN_PASSWORD_HASH` environment variable, paired with a signed JWT session backed by `ADMIN_JWT_SECRET`. 
* *Tip:* You can generate a new admin password hash anytime by running `bun run set:admin-password`.

### Temporary Review Data
* **Contributor Submissions:** When someone uploads a paper, their contact email and any private notes they leave for moderators are stored temporarily in the `contributor_submissions` table. As soon as a moderator approves, hides, or soft-deletes the paper, this submission data is wiped clean to protect contributor privacy. 

### What's Completely Omitted for Now
Papyrus currently keeps things simple by omitting heavy features like full user accounts, role-based access control lists, download history logs, topics/tags mapping, reviews, ratings, and formal audit logs.