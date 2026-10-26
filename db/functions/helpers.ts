import { getDb, slugify } from "../db";
import { type SQLQueryBindings } from "bun:sqlite";

export async function resolvePaperMetadata(input: {
  boardId?: number;
  classLevelId?: number;
  subjectId?: number;
  resourceTypeId?: number;
  board?: string;
  classLevel?: string;
  subject?: string;
  type?: string;
}) {
  const db = await getDb();
  let boardId = input.boardId;
  let classLevelId = input.classLevelId;
  let subjectId = input.subjectId;
  let resourceTypeId = input.resourceTypeId;
  if (!boardId && input.board) {
    boardId = db
      .query<{ id: number }, SQLQueryBindings[]>(
        "SELECT id FROM boards WHERE code = ? OR name = ?",
      )
      .get(input.board, input.board)?.id;
    if (!boardId) {
      const name = input.board.trim();
      const code = `CUSTOM-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      db.prepare("INSERT OR IGNORE INTO boards (name, code) VALUES (?, ?)").run(
        name,
        code,
      );
      boardId = db
        .query<{ id: number }, SQLQueryBindings[]>(
          "SELECT id FROM boards WHERE name = ?",
        )
        .get(name)?.id;
    }
  }
  if (boardId && !classLevelId && input.classLevel) {
    const name = input.classLevel.trim();
    db.prepare(
      "INSERT OR IGNORE INTO class_levels (board_id, name, slug) VALUES (?, ?, ?)",
    ).run(boardId, name, slugify(name));
    classLevelId = db
      .query<{ id: number }, SQLQueryBindings[]>(
        "SELECT id FROM class_levels WHERE board_id = ? AND name = ?",
      )
      .get(boardId, name)?.id;
  }
  if (classLevelId && !subjectId && input.subject) {
    subjectId = db
      .query<{ id: number }, SQLQueryBindings[]>(
        "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
      )
      .get(classLevelId, input.subject)?.id;
    if (!subjectId) {
      const name = input.subject.trim();
      db.prepare(
        "INSERT OR IGNORE INTO subjects (class_level_id, name, slug) VALUES (?, ?, ?)",
      ).run(classLevelId, name, slugify(name));
      subjectId = db
        .query<{ id: number }, SQLQueryBindings[]>(
          "SELECT id FROM subjects WHERE class_level_id = ? AND name = ?",
        )
        .get(classLevelId, name)?.id;
    }
  }
  if (boardId && !resourceTypeId) {
    const type = input.type || "";
    if (type) {
      resourceTypeId = db
        .query<{ id: number }, SQLQueryBindings[]>(
          "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
        )
        .get(boardId, type)?.id;
    }
    if (!resourceTypeId && type) {
      db.prepare(
        "INSERT OR IGNORE INTO resource_types (board_id, name) VALUES (?, ?)",
      ).run(boardId, type.trim());
      resourceTypeId = db
        .query<{ id: number }, SQLQueryBindings[]>(
          "SELECT id FROM resource_types WHERE board_id = ? AND name = ?",
        )
        .get(boardId, type.trim())?.id;
    }
  }
  return { boardId, classLevelId, subjectId, resourceTypeId };
}

export async function hasValidPaperMetadata(input: {
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
}) {
  const db = await getDb();
  const board = db
    .query("SELECT 1 FROM boards WHERE id = ?")
    .get(input.boardId);
  const classLevel = db
    .query("SELECT 1 FROM class_levels WHERE id = ? AND board_id = ?")
    .get(input.classLevelId, input.boardId);
  const subject = db
    .query("SELECT 1 FROM subjects WHERE id = ? AND class_level_id = ?")
    .get(input.subjectId, input.classLevelId);
  const resourceType = db
    .query("SELECT 1 FROM resource_types WHERE id = ? AND board_id = ?")
    .get(input.resourceTypeId, input.boardId);
  return Boolean(board && classLevel && subject && resourceType);
}

export async function incrementDownloads(id: string) {
  const db = await getDb();
  return Boolean(
    db
      .prepare(
        "UPDATE papers SET downloads_count = downloads_count + 1 WHERE id = ? AND status = 'approved'",
      )
      .run(id).changes,
  );
}
