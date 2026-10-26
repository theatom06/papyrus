import { Database, type SQLQueryBindings } from "bun:sqlite";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = new Database(process.env.DB_PATH || "papyrus.sqlite");

    const schemaFile = Bun.file("./schema.sql");
    const schema = await schemaFile.text();

    db.run(schema);
  }

  return db;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}