import { schema } from "./schema";
import { seedExamples } from "./seed-data";

type QueryResult = {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
};
type PreparedStatement = QueryResult & {
  run(...params: unknown[]): {
    lastInsertRowid?: number | bigint;
    changes?: number;
  };
};
type SqlDatabase = {
  run(
    sql: string,
    ...params: unknown[]
  ): { lastInsertRowid?: number | bigint; changes?: number };
  query<T = unknown, _Params = unknown>(
    sql: string,
  ): {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | null;
  };
  prepare(sql: string): PreparedStatement;
};

let databasePromise: Promise<SqlDatabase> | undefined;

export async function getDb() {
  databasePromise ??= loadDatabase().then((database) => {
    const globalForPapyrus = globalThis as unknown as {
      papyrusDb?: SqlDatabase;
    };
    const sharedDatabase = globalForPapyrus.papyrusDb ?? database;
    globalForPapyrus.papyrusDb = sharedDatabase;
    seedDatabase(sharedDatabase);
    return sharedDatabase;
  });
  return databasePromise;
}

async function loadDatabase(): Promise<SqlDatabase> {
  const dynamicImport = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<Record<string, unknown>>;

  if ("Bun" in globalThis) {
    const { Database } = (await dynamicImport("bun:sqlite")) as {
      Database: new (path: string) => SqlDatabase;
    };
    const database = new Database(
      process.env.PAPYRUS_DB_PATH || "papyrus.sqlite",
    );
    database.run("PRAGMA foreign_keys = ON");
    database.run(schema);
    return database;
  }

  const { DatabaseSync } = (await dynamicImport("node:sqlite")) as {
    DatabaseSync: new (path: string) => {
      exec(sql: string): void;
      prepare(sql: string): {
        all(...params: unknown[]): unknown[];
        get(...params: unknown[]): unknown;
        run(...params: unknown[]): {
          lastInsertRowid?: number | bigint;
          changes?: number;
        };
      };
    };
  };
  const native = new DatabaseSync(
    process.env.PAPYRUS_DB_PATH || "papyrus.sqlite",
  );
  native.exec("PRAGMA foreign_keys = ON");
  native.exec(schema);
  return {
    run(sql, ...params) {
      return native.prepare(sql).run(...params);
    },
    query<T = unknown, _Params = unknown>(sql: string) {
      const statement = native.prepare(sql);
      return {
        all: (...params) => statement.all(...params) as T[],
        get: (...params) => statement.get(...params) as T | null,
      };
    },
    prepare(sql) {
      const statement = native.prepare(sql);
      return {
        all: (...params) => statement.all(...params),
        get: (...params) => statement.get(...params),
        run: (...params) => statement.run(...params),
      };
    },
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

function seedDatabase(db: SqlDatabase) {
  const count =
    db
      .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM papers")
      .get()?.count ?? 0;
  if (count > 0) return;

  const boardIds = new Map<string, number>();
  const levelIds = new Map<string, number>();
  const subjectIds = new Map<string, number>();
  const typeIds = new Map<string, number>();
  const addBoard = db.prepare(
    "INSERT OR IGNORE INTO boards (name, code) VALUES (?, ?)",
  );
  const addLevel = db.prepare(
    "INSERT OR IGNORE INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)",
  );
  const addSubject = db.prepare(
    "INSERT OR IGNORE INTO subjects (class_level_id, name, slug) VALUES (?, ?, ?)",
  );
  const addType = db.prepare(
    "INSERT OR IGNORE INTO resource_types (board_id, name) VALUES (?, ?)",
  );

  for (const [name, code, level] of [
    ["Central Board of Secondary Education", "CBSE", "Grade 10"],
    ["Indian Certificate of Secondary Education", "ICSE", "Grade 10"],
    ["Punjab University", "PU", "Grade 12"],
  ]) {
    addBoard.run(name, code);
    const boardId = db
      .query<{ id: number }, [string]>("SELECT id FROM boards WHERE code = ?")
      .get(code)!.id;
    addLevel.run(boardId, level, slugify(level));
    const levelId = db
      .query<{ id: number }, [number]>(
        "SELECT id FROM class_levels WHERE board_id = ?",
      )
      .get(boardId)!.id;
    boardIds.set(code, boardId);
    levelIds.set(code, levelId);
    for (const subject of [
      "Physics",
      "Mathematics",
      "Chemistry",
      "English Literature",
    ]) {
      addSubject.run(levelId, subject, slugify(subject));
      subjectIds.set(
        `${code}:${subject}`,
        db
          .query<{ id: number }, [number, string]>(
            "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
          )
          .get(levelId, subject)!.id,
      );
    }
    for (const type of [
      "Exam paper",
      "Worksheet",
      "Revision guide",
      "Chapter notes",
    ]) {
      addType.run(boardId, type);
      typeIds.set(
        `${code}:${type}`,
        db
          .query<{ id: number }, [number, string]>(
            "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
          )
          .get(boardId, type)!.id,
      );
    }
  }

  const addPaper = db.prepare(
    `INSERT INTO papers
      (id, title, description, duration, board_id, class_level_id, subject_id,
       resource_type_id, exam_year, file_path, file_size_bytes, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  );
  for (const [
    id,
    title,
    subject,
    board,
    type,
    read,
    year,
    description,
  ] of seedExamples) {
    const duration = read.includes("hr")
      ? Number(read.replace(" hrs", "")) * 60
      : Number(read.replace(" min", ""));
    const subjectId =
      subjectIds.get(`${board}:${subject}`) ?? [...subjectIds.values()][0];
    addPaper.run(
      id,
      title,
      description,
      duration,
      boardIds.get(board),
      levelIds.get(board),
      subjectId,
      typeIds.get(`${board}:${type}`),
      year,
      `papers/${id}.pdf`,
      0,
    );
  }
}
