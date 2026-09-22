// API + read-only DB round-trip for the data slice. Run: node api-roundtrip.mjs > api-roundtrip.log
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(here, "..", "..", "..", "..", "backend", "data", "buggyboard.db");
const API = process.env.API ?? "http://localhost:5173/api";
const P = "[data]";
const ro = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const dbRow = (id) => ro.prepare("SELECT id,title,severity,owner,description,state FROM bugs WHERE id=?").get(id);
const created = [];
const results = [];

async function req(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
const cps = (s) => (typeof s === "string" ? [...s].map((c) => c.codePointAt(0).toString(16)).join(" ") : String(s));
const short = (s) => (typeof s === "string" && s.length > 80 ? `${JSON.stringify(s.slice(0, 40))}...(len ${s.length})` : JSON.stringify(s));

function record(name, field, sent, layers, expected) {
  const diffs = Object.entries(layers).filter(([, v]) => v !== expected).map(([k, v]) => `${k}=${short(v)} [${cps(typeof v === "string" && v.length < 60 ? v : "")}]`);
  const r = { name, field, sent: short(sent), expected: short(expected), match: diffs.length === 0, diffs };
  results.push(r);
  console.log(`${r.match ? "OK  " : "DIFF"} ${field.padEnd(11)} ${name.padEnd(28)} sent=${r.sent} expected=${r.expected}${diffs.length ? "\n       " + diffs.join("\n       ") : ""}`);
}

const inputs = {
  latin1: "Crème brûlée naïve façade Ñandú",
  cjk: "中文漢字 日本語テキスト 한국어",
  emoji: "Bug 🐞 🧑‍💻 👍🏽 🇺🇸",
  rtl_arabic: "خطأ في تسجيل الدخول",
  rtl_hebrew_mixed: "באג ABC 123 בדיקה",
  bidi_override: "abc‮evil‬",
  newline_lf: "line1\nline2\n\nline4",
  newline_crlf: "line1\r\nline2",
  tabs_inner: "a\tb",
  lead_trail_space: "   padded value   ",
  lead_trail_nbsp: " nbsp ",
  lead_trail_newlines: "\n\nbody\n\n",
  zero_width_only: "​",
  quotes: `He said "hi" & 'bye' \`tick\` \\back\\slash`,
  html: "<script>alert(1)</script><b>x</b>",
  sqlish: "'); DROP TABLE bugs;--",
  nul_char: "before\u0000after",
  lone_surrogate: "x\uD800y",
  long_10k: "L".repeat(10_000),
  long_90k: "M".repeat(90_000),
};

async function roundTrip(field, name, value) {
  const body = { title: `${P} rt ${name}`, severity: "low", owner: "buggy", description: `${P} desc` };
  if (field === "title") body.title = `${P}` + value; else body[field] = value;
  const sent = body[field];
  const c = await req("POST", "/bugs", body);
  if (c.status !== 201) {
    results.push({ name, field, sent: short(sent), createStatus: c.status, body: c.text.slice(0, 200) });
    console.log(`REJ  ${field.padEnd(11)} ${name.padEnd(28)} status=${c.status} ${c.text.slice(0, 120)}`);
    return;
  }
  created.push(c.json.id);
  const g = await req("GET", `/bugs/${c.json.id}`);
  const list = await req("GET", "/bugs");
  const li = list.json.find((b) => b.id === c.json.id);
  const d = dbRow(c.json.id);
  const expected = sent.trim();
  record(name, field, sent, { created: c.json[field], get: g.json?.[field], list: li?.[field], db: d?.[field] }, expected);
}

async function main() {
  console.log("health", (await req("GET", "/health")).text);
  console.log("\n== Round trip: create -> POST response / GET :id / GET list / DB (read-only) ==");
  for (const field of ["title", "owner", "description"]) {
    for (const [name, v] of Object.entries(inputs)) await roundTrip(field, name, v);
  }
  // Oversize body
  const big = await req("POST", "/bugs", { title: `${P} huge`, severity: "low", owner: "buggy", description: "H".repeat(120_000) });
  console.log(`\nOversize description 120k chars -> status ${big.status} content-type-ish: ${big.text.slice(0, 80).replace(/\n/g, " ")}`);
  if (big.status === 201) created.push(big.json.id);

  console.log("\n== Enumerations ==");
  for (const sev of ["HIGH", "mid", " Low ", "High", "CRITICAL", "", "m i d"]) {
    const c = await req("POST", "/bugs", { title: `${P} sev ${sev}`, severity: sev, owner: "buggy", description: "d" });
    if (c.status === 201) created.push(c.json.id);
    console.log(`severity ${JSON.stringify(sev)} -> ${c.status} stored=${c.status === 201 ? dbRow(c.json.id).severity : "-"} state=${c.status === 201 ? dbRow(c.json.id).state : "-"}`);
  }
  // Client-supplied state/id on create must be ignored
  const cs = await req("POST", "/bugs", { id: 1, title: `${P} state-on-create`, severity: "low", owner: "buggy", description: "d", state: "closed" });
  created.push(cs.json.id);
  console.log(`create with state=closed,id=1 -> ${cs.status} id=${cs.json.id} response.state=${cs.json.state} db.state=${dbRow(cs.json.id).state}`);
  for (const st of ["closed", "OPEN", " Closed ", "done", ""]) {
    const u = await req("PUT", `/bugs/${cs.json.id}`, { title: `${P} state-on-create`, severity: "low", owner: "buggy", description: "d", state: st });
    console.log(`PUT state ${JSON.stringify(st)} -> ${u.status} db.state=${dbRow(cs.json.id).state}`);
  }

  console.log("\n== Lifecycle / ids ==");
  const a = await req("POST", "/bugs", { title: `${P} life A`, severity: "mid", owner: "buggy", description: "d" });
  const seqBefore = ro.prepare("SELECT seq FROM sqlite_sequence WHERE name='bugs'").get().seq;
  const del = await req("DELETE", `/bugs/${a.json.id}`);
  const afterDel = await req("GET", `/bugs/${a.json.id}`);
  const dbAfterDel = dbRow(a.json.id);
  const b = await req("POST", "/bugs", { title: `${P} life B`, severity: "mid", owner: "buggy", description: "d" });
  created.push(b.json.id);
  console.log(`A id=${a.json.id} state=${a.json.state}; delete -> ${del.status}; GET after -> ${afterDel.status}; db row after=${JSON.stringify(dbAfterDel ?? null)}; seq before delete=${seqBefore}`);
  console.log(`B id=${b.json.id} (reused A's id? ${b.json.id === a.json.id}); B > A ? ${b.json.id > a.json.id}`);
  const del2 = await req("DELETE", `/bugs/${a.json.id}`);
  console.log(`second delete of A -> ${del2.status}`);

  console.log("\n== Concurrency: two PUTs to same bug ==");
  const cc = await req("POST", "/bugs", { title: `${P} conc`, severity: "low", owner: "buggy", description: "orig" });
  created.push(cc.json.id);
  const put1 = req("PUT", `/bugs/${cc.json.id}`, { title: `${P} conc by buggy`, severity: "high", owner: "buggy", description: "writer 1", state: "open" });
  const put2 = req("PUT", `/bugs/${cc.json.id}`, { title: `${P} conc by vanny`, severity: "low", owner: "vanny", description: "writer 2", state: "closed" });
  const [r1, r2] = await Promise.all([put1, put2]);
  const final = dbRow(cc.json.id);
  console.log(`PUT1 ${r1.status} -> ${r1.json.title}; PUT2 ${r2.status} -> ${r2.json.title}; DB final=${JSON.stringify(final)}; mixed fields? ${!(JSON.stringify([final.title, final.severity, final.owner, final.description, final.state]) === JSON.stringify([r1.json.title, r1.json.severity, r1.json.owner, r1.json.description, r1.json.state]) || JSON.stringify([final.title, final.severity, final.owner, final.description, final.state]) === JSON.stringify([r2.json.title, r2.json.severity, r2.json.owner, r2.json.description, r2.json.state]))}`);
  // Sequential stale write: client X read, client Y wrote, client X writes its stale copy
  const stale = (await req("GET", `/bugs/${cc.json.id}`)).json;
  await req("PUT", `/bugs/${cc.json.id}`, { ...stale, description: "Y's important change" });
  await req("PUT", `/bugs/${cc.json.id}`, { ...stale, title: `${P} conc X renamed` });
  console.log(`stale overwrite: DB description after X's save = ${JSON.stringify(dbRow(cc.json.id).description)} (Y's change lost -> last write wins, spec 09 out-of-scope)`);

  console.log("\n== Edit / delete a bug another client deleted ==");
  const gone = await req("POST", "/bugs", { title: `${P} gone`, severity: "low", owner: "buggy", description: "d" });
  await req("DELETE", `/bugs/${gone.json.id}`);
  const putGone = await req("PUT", `/bugs/${gone.json.id}`, { title: `${P} gone edited`, severity: "low", owner: "buggy", description: "d", state: "open" });
  console.log(`PUT deleted id=${gone.json.id} -> ${putGone.status} ${putGone.text}; row resurrected? ${!!dbRow(gone.json.id)}`);

  console.log("\n== Id parsing: path id with trailing junk ==");
  const t = await req("POST", "/bugs", { title: `${P} idparse target`, severity: "low", owner: "buggy", description: "untouched" });
  created.push(t.json.id);
  for (const suffix of ["abc", ".9", "e5", "%20junk"]) {
    const g = await req("GET", `/bugs/${t.json.id}${suffix}`);
    console.log(`GET /bugs/${t.json.id}${suffix} -> ${g.status} id=${g.json?.id}`);
  }
  const pj = await req("PUT", `/bugs/${t.json.id}abc`, { title: `${P} idparse MODIFIED via ${t.json.id}abc`, severity: "high", owner: "buggy", description: "modified", state: "closed" });
  console.log(`PUT /bugs/${t.json.id}abc -> ${pj.status}; DB row now ${JSON.stringify(dbRow(t.json.id))}`);
  const dj = await req("DELETE", `/bugs/${t.json.id}.5`);
  console.log(`DELETE /bugs/${t.json.id}.5 -> ${dj.status}; DB row still there? ${!!dbRow(t.json.id)}`);

  console.log("\n== Cleanup own [data] bugs ==");
  for (const id of created) {
    const row = dbRow(id);
    if (row && row.title.startsWith(P)) await req("DELETE", `/bugs/${id}`);
  }
  const left = ro.prepare("SELECT count(*) n FROM bugs WHERE title LIKE '[data]%'").get().n;
  console.log(`[data] rows remaining (kept for UI run or leaked): ${left}`);
  const summary = { total: results.length, diffs: results.filter((r) => r.match === false).length, rejected: results.filter((r) => r.createStatus).length };
  console.log("\nSUMMARY", JSON.stringify(summary));
}
main().catch((e) => { console.error(e); process.exit(1); });
