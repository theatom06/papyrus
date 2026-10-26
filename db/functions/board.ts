import { getDb, slugify } from "../db";

// Board

export async function getBoardOptions() {
  const db = await getDb();
  const boards = db
    .query(
      `SELECT b.id, b.name, b.code, COUNT(DISTINCT cl.id) AS class_count,
    COUNT(DISTINCT p.id) AS paper_count FROM boards b
    LEFT JOIN class_levels cl ON cl.board_id = b.id LEFT JOIN papers p ON p.board_id = b.id
    GROUP BY b.id ORDER BY b.name`,
    )
    .all() as Array<{ id: number; [key: string]: unknown }>;
  return boards.map((board) => ({
    ...board,
    classLevels: db
      .query(
        "SELECT id, name, slug FROM class_levels WHERE board_id = ? ORDER BY name",
      )
      .all(board.id),
    subjects: db
      .query(
        "SELECT s.id, s.name, s.slug, s.accent_color, cl.id AS class_level_id FROM subjects s JOIN class_levels cl ON cl.id = s.class_level_id WHERE cl.board_id = ? ORDER BY s.name",
      )
      .all(board.id),
    types: db
      .query(
        "SELECT id, name FROM resource_types WHERE board_id = ? ORDER BY name",
      )
      .all(board.id),
  }));
}

export async function createBoard(input: {
  name: string;
  code: string;
  className: string;
  subjectName: string;
}) {
  const db = await getDb();
  const board = db
    .prepare("INSERT INTO boards (name, code) VALUES (?, ?)")
    .run(input.name, input.code);
  const boardId = Number(board.lastInsertRowid);
  const level = db
    .prepare("INSERT INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)")
    .run(boardId, input.className, slugify(input.className));
  db.prepare(
    "INSERT INTO subjects (class_level_id, name, slug, accent_color) VALUES (?, ?, ?, '#c97732')",
  ).run(
    Number(level.lastInsertRowid),
    input.subjectName,
    slugify(input.subjectName),
  );
  db.prepare("INSERT INTO resource_types (board_id, name) VALUES (?, ?)").run(
    boardId,
    "Exam paper",
  );
  return boardId;
}

export async function updateBoard(id: number, name: string, code: string) {
  const db = await getDb();
  return Boolean(
    db
      .prepare("UPDATE boards SET name = ?, code = ? WHERE id = ?")
      .run(name, code, id).changes,
  );
}

// Subjects

export async function createSubject(input: {
  classLevelId: number;
  name: string;
  accent_color?: string;
}) {
  const db = await getDb();
  const accent = input.accent_color || "#c97732";
  const result = db
    .prepare(
      "INSERT INTO subjects (class_level_id, name, slug, accent_color) VALUES (?, ?, ?, ?)",
    )
    .run(input.classLevelId, input.name, slugify(input.name), accent);
  return { id: Number(result.lastInsertRowid) };
}

export async function updateSubject(
  id: number,
  updates: { name?: string; accent_color?: string },
) {
  const db = await getDb();
  const fields = Object.keys(updates).filter(
    (field) => updates[field as keyof typeof updates] !== undefined,
  );
  if (!fields.length) return false;
  const values = fields.map(
    (field) => updates[field as keyof typeof updates] as string,
  );
  const result = db
    .prepare(
      `UPDATE subjects SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    )
    .run(...values, id);
  return Boolean(result.changes);
}

export async function deleteSubject(id: number) {
  const db = await getDb();
  db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
}

// Class Levels

export async function createClassLevel(input: {
  boardId: number;
  name: string;
}) {
  const db = await getDb();
  const result = db
    .prepare("INSERT INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)")
    .run(input.boardId, input.name, slugify(input.name));
  return { id: Number(result.lastInsertRowid) };
}

export async function updateClassLevel(
  id: number,
  updates: { name?: string; slug?: string; accent_color?: string },
) {
  const db = await getDb();
  const fields = Object.keys(updates).filter(
    (field) => updates[field as keyof typeof updates] !== undefined,
  );
  if (!fields.length) return false;
  const values = fields.map(
    (field) => updates[field as keyof typeof updates] as string,
  );
  const result = db
    .prepare(
      `UPDATE class_levels SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    )
    .run(...values, id);
  return Boolean(result.changes);
}

export async function deleteClassLevel(id: number) {
  const db = await getDb();
  db.prepare("DELETE FROM class_levels WHERE id = ?").run(id);
}

// Resource Types

export async function createResourceType(input: {
  boardId: number;
  name: string;
}) {
  const db = await getDb();
  const result = db
    .prepare("INSERT INTO resource_types (board_id, name) VALUES (?, ?)")
    .run(input.boardId, input.name);
  return { id: Number(result.lastInsertRowid) };
}

export async function updateResourceType(id: number, name: string) {
  const db = await getDb();
  return Boolean(
    db.prepare("UPDATE resource_types SET name = ? WHERE id = ?").run(name, id)
      .changes,
  );
}

export async function deleteResourceType(id: number) {
  const db = await getDb();
  db.prepare("DELETE FROM resource_types WHERE id = ?").run(id);
}