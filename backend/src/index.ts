import express, { type ErrorRequestHandler, type Request, type Response, type RequestHandler } from "express";
import { db, initBugsTable } from "./db.js";
import { login } from "./authService.js";
import { createBug, deleteBug, getBug, listBugs, updateBug } from "./bugService.js";

const app = express();
const PORT = 3002;
// Loopback only: the UI reaches the API through the Vite proxy, so nothing else needs to.
const HOST = "127.0.0.1";

initBugsTable();

app.disable("x-powered-by");

// Only the Vite proxy (which rewrites Host to the target) and direct local calls may reach the API.
// Anything else is a DNS-rebinding page pretending to be localhost.
const ALLOWED_HOSTS = new Set([`${HOST}:${PORT}`, `localhost:${PORT}`]);
app.use((req, res, next) => {
  if (!ALLOWED_HOSTS.has(req.headers.host ?? "")) {
    res.status(403).json({ error: "forbidden_host", message: "Unexpected Host header." });
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// A body sent as anything but JSON would otherwise be read as empty and reported as blank fields.
// Applied per route, so a wrong method or unknown path still gets 405 or 404 rather than 415.
const requireJson: RequestHandler = (req, res, next) => {
  const hasBody = Number(req.headers["content-length"] ?? 0) > 0 || req.headers["transfer-encoding"] !== undefined;
  if (hasBody && !req.is("application/json")) {
    res.status(415).json({ error: "unsupported_media_type", message: "Send the request body as application/json." });
    return;
  }
  next();
};
const jsonBody = [requireJson, express.json()];

function parseId(req: Request, res: Response): number | null {
  if (!/^[1-9]\d*$/.test(String(req.params.id))) {
    res.status(400).json({ error: "invalid_id", message: "Bug ID must be a positive whole number." });
    return null;
  }
  return Number(String(req.params.id));
}

function readText(body: Record<string, unknown>, field: string, res: Response): string | null {
  const value = body[field];
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  res.status(400).json({ error: "invalid_type", message: `${field} must be text.` });
  return null;
}

// Consecutive failed logins per client and exact username, reset on success. Keying on the client too
// means a third party can't lock someone else out; the size cap keeps junk usernames from growing memory.
const MAX_FAILED_LOGINS = 20;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_TRACKED = 10_000;
const failedLogins = new Map<string, { count: number; since: number }>();

function loginKey(req: Request, username: string): string {
  return `${req.ip ?? ""}|${username.trim().slice(0, 256)}`;
}

function pruneFailedLogins(now: number) {
  for (const [key, record] of failedLogins) {
    if (now - record.since > LOCKOUT_MS) failedLogins.delete(key);
  }
  // Map keeps insertion order, so the first keys are the oldest.
  for (const key of failedLogins.keys()) {
    if (failedLogins.size <= MAX_TRACKED) break;
    failedLogins.delete(key);
  }
}

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/api/health", (_req, res) => {
  let database: string = "connected";
  try {
    db.prepare("SELECT 1").get();
  } catch {
    database = "error";
  }
  res.json({
    ok: true,
    message: "BuggyBoard API is running",
    database,
  });
});

app.post("/api/login", ...jsonBody, (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const username = readText(body, "username", res);
  if (username === null) return;
  const password = readText(body, "password", res);
  if (password === null) return;

  const now = Date.now();
  const key = loginKey(req, username);
  const record = failedLogins.get(key);
  if (record && now - record.since > LOCKOUT_MS) failedLogins.delete(key);
  const current = failedLogins.get(key);
  if (current && current.count >= MAX_FAILED_LOGINS) {
    res.setHeader("Retry-After", String(Math.ceil((current.since + LOCKOUT_MS - now) / 1000)));
    res.status(429).json({ error: "too_many_attempts", message: "Too many failed attempts. Try again later." });
    return;
  }

  const result = login(username, password);

  if (result.success) {
    failedLogins.delete(key);
    res.status(200).json({ username: result.username });
    return;
  }
  if (result.code === "INVALID_CREDENTIALS") {
    const previous = failedLogins.get(key);
    failedLogins.set(key, { count: (previous?.count ?? 0) + 1, since: previous?.since ?? now });
    if (failedLogins.size > MAX_TRACKED) pruneFailedLogins(now);
  }

  switch (result.code) {
    case "BLANK_USERNAME":
      res.status(400).json({
        error: "blank_username",
        message: "Username cannot be blank.",
      });
      return;
    case "BLANK_PASSWORD":
      res.status(400).json({
        error: "blank_password",
        message: "Password cannot be blank.",
      });
      return;
    case "MISSING_CREDENTIALS":
      res.status(400).json({
        error: "missing_credentials",
        message: "Please enter your username and password.",
      });
      return;
    case "INVALID_CREDENTIALS":
      res.status(401).json({
        error: "invalid_credentials",
        message: "Invalid username or password.",
      });
      return;
  }
});

function readBugFields(raw: unknown, res: Response, names: string[]): Record<string, string> | null {
  const body = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const fields: Record<string, string> = {};
  for (const name of names) {
    const value = readText(body, name, res);
    if (value === null) return null;
    fields[name] = value;
  }
  return fields;
}

app.get("/api/bugs", (_req, res) => {
  const bugs = listBugs();
  res.json(bugs);
});

app.get("/api/bugs/:id", (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const bug = getBug(id);
  if (!bug) {
    res.status(404).json({ error: "not_found", message: "Bug not found." });
    return;
  }
  res.json(bug);
});

app.put("/api/bugs/:id", ...jsonBody, (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const fields = readBugFields(req.body, res, ["title", "severity", "owner", "description", "state"]);
  if (!fields) return;
  const { title, severity, owner, description, state } = fields;

  const result = updateBug(id, { title, severity, owner, description, state });

  if (result.success) {
    res.status(200).json(result.bug);
    return;
  }

  if (result.code === "NOT_FOUND") {
    res.status(404).json({ error: "not_found", message: "Bug not found." });
    return;
  }

  switch (result.code) {
    case "BLANK_TITLE":
      res.status(400).json({ error: "blank_title", message: "Title is required." });
      return;
    case "BLANK_SEVERITY":
      res.status(400).json({ error: "blank_severity", message: "Severity is required (high, mid, or low)." });
      return;
    case "INVALID_SEVERITY":
      res.status(400).json({ error: "invalid_severity", message: "Severity must be high, mid, or low." });
      return;
    case "BLANK_OWNER":
      res.status(400).json({ error: "blank_owner", message: "Owner is required." });
      return;
    case "BLANK_DESCRIPTION":
      res.status(400).json({ error: "blank_description", message: "Description is required." });
      return;
    case "INVALID_STATE":
      res.status(400).json({ error: "invalid_state", message: "State must be Open or Closed." });
      return;
  }
});

app.delete("/api/bugs/:id", (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const result = deleteBug(id);
  if (result.success) {
    res.status(204).send();
    return;
  }
  res.status(404).json({ error: "not_found", message: "Bug not found." });
});

app.post("/api/bugs", ...jsonBody, (req, res) => {
  const fields = readBugFields(req.body, res, ["title", "severity", "owner", "description"]);
  if (!fields) return;
  const { title, severity, owner, description } = fields;

  const result = createBug({ title, severity: severity as "high" | "mid" | "low", owner, description });

  if (result.success) {
    res.status(201).json(result.bug);
    return;
  }

  switch (result.code) {
    case "BLANK_TITLE":
      res.status(400).json({ error: "blank_title", message: "Title is required." });
      return;
    case "BLANK_SEVERITY":
      res.status(400).json({ error: "blank_severity", message: "Severity is required (high, mid, or low)." });
      return;
    case "INVALID_SEVERITY":
      res.status(400).json({ error: "invalid_severity", message: "Severity must be high, mid, or low." });
      return;
    case "BLANK_OWNER":
      res.status(400).json({ error: "blank_owner", message: "Owner is required." });
      return;
    case "BLANK_DESCRIPTION":
      res.status(400).json({ error: "blank_description", message: "Description is required." });
      return;
  }
});

const ROUTES: Record<string, string> = {
  "/api/health": "GET",
  "/api/login": "POST",
  "/api/bugs": "GET, POST",
  "/api/bugs/:id": "GET, PUT, DELETE",
};
for (const [path, allow] of Object.entries(ROUTES)) {
  app.all(path, (req, res) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", `${allow}, OPTIONS`);
      res.status(204).send();
      return;
    }
    res.setHeader("Allow", allow);
    res.status(405).json({ error: "method_not_allowed", message: `Use ${allow} for ${path}.` });
  });
}

app.all(["/api", "/api/*"], (_req, res) => {
  res.status(404).json({ error: "not_found", message: "No such API route." });
});

// Body-parser and unexpected errors answer in JSON and never expose a stack trace.
// Express recognises an error handler by its four parameters, so _next stays even though it's unused.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const type = (err as { type?: string }).type;
  if (type === "entity.parse.failed") {
    res.status(400).json({ error: "invalid_json", message: "The request body is not valid JSON." });
  } else if (type === "entity.too.large") {
    res.status(413).json({ error: "payload_too_large", message: "The request body is too large." });
  } else if (type === "charset.unsupported" || type === "encoding.unsupported") {
    res.status(415).json({ error: "unsupported_media_type", message: "Send UTF-8 JSON without compression." });
  } else if (typeof (err as { status?: number }).status === "number" && (err as { status: number }).status < 500) {
    res.status((err as { status: number }).status).json({ error: "bad_request", message: "The request could not be read." });
  } else {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "Something went wrong." });
  }
};
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
});
