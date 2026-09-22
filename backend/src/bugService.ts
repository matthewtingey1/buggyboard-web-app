import { db } from "./db.js";

/** Severity is stored in the database as HIGH, MID, LOW. */
export type Severity = "HIGH" | "MID" | "LOW";

/** State is stored in the database as OPEN, CLOSED. */
export type BugState = "OPEN" | "CLOSED";

export interface BugInput {
  title: string;
  /** Severity (accepts "high"/"mid"/"low" or "HIGH"/"MID"/"LOW"; stored as uppercase). */
  severity: string;
  owner: string;
  description: string;
}

export interface Bug extends BugInput {
  id: number;
  severity: Severity;
  state: BugState;
}

export type CreateBugResult =
  | { success: true; bug: Bug }
  | {
      success: false;
      code: "BLANK_TITLE" | "BLANK_SEVERITY" | "BLANK_OWNER" | "BLANK_DESCRIPTION" | "INVALID_SEVERITY";
    };

export interface UpdateBugInput extends BugInput {
  /** State (accepts "open"/"closed" or "OPEN"/"CLOSED"; stored as uppercase). */
  state: string;
}

export type UpdateBugResult =
  | { success: true; bug: Bug }
  | { success: false; code: "NOT_FOUND" }
  | {
      success: false;
      code: "BLANK_TITLE" | "BLANK_SEVERITY" | "BLANK_OWNER" | "BLANK_DESCRIPTION" | "INVALID_SEVERITY" | "INVALID_STATE";
    };

const SEVERITIES: Severity[] = ["HIGH", "MID", "LOW"];
const BUG_STATES: BugState[] = ["OPEN", "CLOSED"];

function normalizeSeverity(s: string): Severity | null {
  const u = s.trim().toUpperCase();
  return SEVERITIES.includes(u as Severity) ? (u as Severity) : null;
}

// Characters that render as nothing (zero-width, bidi marks, soft hyphen, fillers, braille blank),
// so a value made only of them is blank. They are only ignored for this check, never stripped.
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\u2800]/gu;

function isBlank(s: string): boolean {
  return s.replace(INVISIBLE, "").trim() === "";
}

// A title is a one-line summary; the edit form's single-line input would otherwise silently join its lines.
function oneLine(s: string): string {
  return s.replace(/\s*[\r\n\u0085\u2028\u2029]+\s*/g, " ");
}

type FieldCode = "BLANK_TITLE" | "BLANK_SEVERITY" | "INVALID_SEVERITY" | "BLANK_OWNER" | "BLANK_DESCRIPTION";

function validateFields(input: BugInput):
  | { ok: true; title: string; severity: Severity; owner: string; description: string }
  | { ok: false; code: FieldCode } {
  const title = oneLine(input.title.trim());
  const owner = input.owner.trim();
  const description = input.description.trim();
  if (isBlank(title)) return { ok: false, code: "BLANK_TITLE" };
  if (input.severity.trim() === "") return { ok: false, code: "BLANK_SEVERITY" };
  const severity = normalizeSeverity(input.severity);
  if (severity === null) return { ok: false, code: "INVALID_SEVERITY" };
  if (isBlank(owner)) return { ok: false, code: "BLANK_OWNER" };
  if (isBlank(description)) return { ok: false, code: "BLANK_DESCRIPTION" };
  return { ok: true, title, severity, owner, description };
}

function normalizeState(s: string): BugState | null {
  const u = s.trim().toUpperCase();
  return BUG_STATES.includes(u as BugState) ? (u as BugState) : null;
}

/**
 * Create a bug. Validates required fields; ID is set by the database. Severity is stored as HIGH, MID, LOW.
 */
export function createBug(input: BugInput): CreateBugResult {
  const v = validateFields(input);
  if (!v.ok) return { success: false, code: v.code };

  const stmt = db.prepare(
    `INSERT INTO bugs (title, severity, owner, description, state) VALUES (?, ?, ?, ?, 'OPEN')`
  );
  const result = stmt.run(v.title, v.severity, v.owner, v.description);
  // Read back rather than echo the input, so the response is exactly what was stored.
  return { success: true, bug: getBug(Number(result.lastInsertRowid)) as Bug };
}

/**
 * Return a single bug by id, or null if not found.
 */
export function getBug(id: number): Bug | null {
  const row = db
    .prepare("SELECT id, title, severity, owner, description, state FROM bugs WHERE id = ?")
    .get(id) as
    | { id: number; title: string; severity: string; owner: string; description: string; state: string }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    severity: row.severity as Severity,
    owner: row.owner,
    description: row.description,
    state: row.state as BugState,
  };
}

/**
 * Update an existing bug. Validates required fields and state. Returns NOT_FOUND if the bug does not exist.
 */
export function updateBug(id: number, input: UpdateBugInput): UpdateBugResult {
  const existing = getBug(id);
  if (!existing) return { success: false, code: "NOT_FOUND" };

  const v = validateFields(input);
  if (!v.ok) return { success: false, code: v.code };
  const state = normalizeState(input.state);
  if (state === null) return { success: false, code: "INVALID_STATE" };

  db.prepare(
    "UPDATE bugs SET title = ?, severity = ?, owner = ?, description = ?, state = ? WHERE id = ?"
  ).run(v.title, v.severity, v.owner, v.description, state, id);

  return { success: true, bug: getBug(id) as Bug };
}

/**
 * Delete a bug by id. Returns NOT_FOUND if the bug does not exist.
 */
export function deleteBug(id: number): { success: true } | { success: false; code: "NOT_FOUND" } {
  const existing = getBug(id);
  if (!existing) return { success: false, code: "NOT_FOUND" };
  db.prepare("DELETE FROM bugs WHERE id = ?").run(id);
  return { success: true };
}

/**
 * Return all bugs from the database, in table order (e.g. by id).
 */
export function listBugs(): Bug[] {
  const rows = db
    .prepare("SELECT id, title, severity, owner, description, state FROM bugs ORDER BY id")
    .all() as Array<{
    id: number;
    title: string;
    severity: string;
    owner: string;
    description: string;
    state: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity as Severity,
    owner: r.owner,
    description: r.description,
    state: r.state as BugState,
  })) as Bug[];
}
