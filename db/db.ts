import { Database } from "bun:sqlite";

export type QueryResult = {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
};

export type PreparedStatement = QueryResult & {
  run(...params: unknown[]): {
    lastInsertRowid?: number | bigint;
    changes?: number;
  };
};

export type SqlDatabase = {
  exec(sql: string): void;

  run(
    sql: string,
    ...params: unknown[]
  ): {
    lastInsertRowid?: number | bigint;
    changes?: number;
  };

  query<T = unknown>(
    sql: string,
  ): {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | null;
  };

  prepare(sql: string): PreparedStatement;
};

let databasePromise: Promise<SqlDatabase> | undefined;

export async function getSqlDatabase() {
  databasePromise ??= openDatabase();
  return databasePromise;
}

async function readSchema() {
  return Bun.file(new URL("./schema.sql", import.meta.url)).text();
}

async function openDatabase(): Promise<SqlDatabase> {
  const schema = await readSchema();
  const databasePath = process.env.DB_PATH || "papyrus.sqlite";

  const database = new Database(databasePath);
  database.run(schema);
  return database;
}
