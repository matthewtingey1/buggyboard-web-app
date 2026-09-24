// Data slice API retest + new input classes. Run from this dir: node api-retest.mjs > api-retest.log 2>&1
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const ro = new Database(join(here, "..", "..", "..", "..", "backend", "data", "buggyboard.db"), { readonly: true, fileMustExist: true });
const dbRow = (id) => ro.prepare("SELECT id,title,severity,owner,description,state FROM bugs WHERE id=?").get(id);
const API = process.env.API ?? "http://localhost:5173/api";
const P = "[data]";
const created = [];
const j = (v) => JSON.stringify(v);
const cps = (s) => [...String(s)].map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join(" ");
const short = (s) => (typeof s === "string" && s.length > 80 ? `${j(s.slice(0, 30))}..(len ${s.length})` : j(s));

async function req(method, path, body, raw) {
  const res = await fetch(API + path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text, ctype: res.headers.get("content-type") };
}
async function mk(extra = {}) {
  const r = await req("POST", "/bugs", { title: `${P} ${extra.t ?? "x"}`, severity: "low", owner: "buggy", description: "d", ...extra.body });
  if (r.json?.id) created.push(r.json.id);
  return r;
}

function layers(label, expected, l) {
  const bad = Object.entries(l).filter(([, v]) => v !== expected);
  console.log(`${bad.length ? "DIFF" : "OK  "} ${label} expected=${short(expected)}`);
  for (const [k, v] of bad) console.log(`       ${k}=${short(v)}  cps[${typeof v === "string" && v.length < 40 ? cps(v) : ""}]  expected cps[${expected.length < 40 ? cps(expected) : ""}]`);
  return bad.length === 0;
}

const cases = {
  nul: ["a\u0000b", "a\u0000b"],
  nbsp_lead_trail: [" nbsp ", "nbsp"],
  nbsp_inner: ["a b", "a b"],
  bom_lead: ["﻿bom", "bom"],
  bidi_override: ["abc‮evil‬", "abc‮evil‬"],
  bidi_isolate: ["⁧rtl⁩ x", "⁧rtl⁩ x"],
  line_sep_u2028: ["a b", "a b"],
  cr_only: ["a\rb", "a\rb"],
  c0_bell_esc: ["a\u0007\u001Bb", "a\u0007\u001Bb"],
  nfd_combining: ["é café", "é café"],
  nfc_precomposed: ["é café", "é café"],
  lone_high_surrogate: ["x\uD800y", "x\uD800y"],
  lone_low_surrogate: ["x\uDC00y", "x\uDC00y"],
  astral_math: ["\u{1D400}\u{1F9D1}‍\u{1F4BB}", "\u{1D400}\u{1F9D1}‍\u{1F4BB}"],
  ideographic_space_trail: ["pad　", "pad"],
  zwsp_only: ["​", null],
  word_joiner_only: ["⁠", null],
};

console.log(`health: ${(await req("GET", "/health")).text}`);
try {
  console.log("\n== Round-trip create (POST resp / GET :id / GET list / DB) and update (PUT resp / GET / DB) ==");
  const list = async () => (await req("GET", "/bugs")).json;
  for (const [name, [input, expected]] of Object.entries(cases)) {
    for (const field of ["title", "owner", "description"]) {
      const body = { title: `${P} rt ${name}`, severity: "low", owner: "buggy", description: "d" };
      body[field] = field === "title" ? `${P} ${input}` : input;
      const exp = expected === null ? null : field === "title" ? `${P} ${expected}` : expected;
      const r = await req("POST", "/bugs", body);
      if (r.json?.id) created.push(r.json.id);
      if (exp === null && field !== "title") {
        console.log(`${r.status === 400 ? "OK  " : "DIFF"} ${field} ${name}: POST ${r.status} ${r.status === 201 ? "(accepted; stored " + cps(dbRow(r.json.id)[field]) + ")" : j(r.json)}`);
        continue;
      }
      if (exp === null) { // title prefix makes it non-blank; test blank-title separately below
        continue;
      }
      if (r.status !== 201) { console.log(`DIFF ${field} ${name}: POST ${r.status} ${r.text.slice(0, 100)}`); continue; }
      const id = r.json.id;
      const g = (await req("GET", `/bugs/${id}`)).json;
      const l = (await list()).find((b) => b.id === id);
      layers(`create ${field.padEnd(11)} ${name}`, exp, { postResp: r.json[field], getId: g[field], getList: l[field], db: dbRow(id)[field] });
      const upd = { ...g, state: "closed" };
      upd[field] = field === "title" ? `${P} u ${input}` : input;
      const uexp = field === "title" ? `${P} u ${expected}` : expected;
      const u = await req("PUT", `/bugs/${id}`, upd);
      const g2 = (await req("GET", `/bugs/${id}`)).json;
      layers(`update ${field.padEnd(11)} ${name}`, uexp, { putResp: u.json?.[field], getId: g2[field], db: dbRow(id)[field] });
    }
  }

  console.log("\n== Blank-only titles (no prefix possible; created row deleted immediately by id) ==");
  for (const name of ["zwsp_only", "word_joiner_only"]) {
    const r = await req("POST", "/bugs", { title: cases[name][0], severity: "low", owner: "buggy", description: `${P} blank-title probe` });
    console.log(`title ${name}: POST ${r.status} ${r.status === 201 ? "(accepted, id " + r.json.id + ")" : j(r.json)}`);
    if (r.status === 201) console.log(`   cleanup DELETE ${(await req("DELETE", `/bugs/${r.json.id}`)).status}`);
  }

  console.log("\n== data-02 id parsing ==");
  const a = (await mk({ t: "idparse" })).json;
  for (const suffix of ["abc", ".9", "e5", "%20junk"]) {
    const r = await req("GET", `/bugs/${a.id}${suffix}`);
    console.log(`GET /bugs/${a.id}${suffix} -> ${r.status} id=${r.json?.id}`);
  }
  const pu = await req("PUT", `/bugs/${a.id}abc`, { title: `${P} idparse MODIFIED via ${a.id}abc`, severity: "high", owner: "buggy", description: "d", state: "closed" });
  console.log(`PUT /bugs/${a.id}abc -> ${pu.status}; DB row = ${j(dbRow(a.id))}`);
  const de = await req("DELETE", `/bugs/${a.id}.5`);
  console.log(`DELETE /bugs/${a.id}.5 -> ${de.status}; DB row after = ${j(dbRow(a.id) ?? null)}`);

  console.log("\n== data-04 oversize ==");
  const big = await req("POST", "/bugs", { title: `${P} oversize`, severity: "low", owner: "buggy", description: "O".repeat(120_000) });
  console.log(`POST 120k description -> ${big.status} content-type=${big.ctype} body starts ${j(big.text.slice(0, 40))}`);
  if (big.json?.id) created.push(big.json.id);
  const t90 = await mk({ t: "T".repeat(90_000) });
  console.log(`POST 90k title -> ${t90.status}; DB title length ${t90.json ? dbRow(t90.json.id).title.length : "-"}`);

  console.log("\n== data-07 concurrency: 20 rounds of two parallel full-row PUTs ==");
  const c = (await mk({ t: "conc" })).json;
  let mixed = 0, aWins = 0, bWins = 0;
  for (let i = 0; i < 20; i++) {
    const A = { title: `${P} conc A${i}`, severity: "high", owner: "buggy", description: `A${i}`, state: "open" };
    const B = { title: `${P} conc B${i}`, severity: "low", owner: "vanny", description: `B${i}`, state: "closed" };
    const [ra, rb] = await Promise.all([req("PUT", `/bugs/${c.id}`, A), req("PUT", `/bugs/${c.id}`, B)]);
    const d = dbRow(c.id);
    const isA = d.title === A.title && d.severity === "HIGH" && d.owner === "buggy" && d.description === A.description && d.state === "OPEN";
    const isB = d.title === B.title && d.severity === "LOW" && d.owner === "vanny" && d.description === B.description && d.state === "CLOSED";
    if (isA) aWins++; else if (isB) bWins++; else mixed++;
    if (ra.status !== 200 || rb.status !== 200) console.log(`round ${i}: statuses ${ra.status}/${rb.status}`);
  }
  console.log(`A won ${aWins}, B won ${bWins}, mixed rows ${mixed}`);
  const x = (await req("GET", `/bugs/${c.id}`)).json; // client X reads
  await req("PUT", `/bugs/${c.id}`, { ...x, description: "Y's important note" }); // client Y writes
  const xs = await req("PUT", `/bugs/${c.id}`, { ...x, title: `${P} conc X title` }); // X saves stale copy
  console.log(`stale overwrite: X PUT ${xs.status}; DB.description=${j(dbRow(c.id).description)} (Y's note lost: ${dbRow(c.id).description !== "Y's important note"})`);
  const del = await req("DELETE", `/bugs/${c.id}`);
  const after = await req("PUT", `/bugs/${c.id}`, x);
  const del2 = await req("DELETE", `/bugs/${c.id}`);
  console.log(`delete ${del.status}; PUT after delete ${after.status}; second DELETE ${del2.status}; row resurrected=${!!dbRow(c.id)}`);

  console.log("\n== Parallel create+delete race on one bug ==");
  const r2 = (await mk({ t: "race" })).json;
  const [p1, d1] = await Promise.all([req("PUT", `/bugs/${r2.id}`, { ...r2, description: "racing", state: "open" }), req("DELETE", `/bugs/${r2.id}`)]);
  console.log(`PUT ${p1.status} / DELETE ${d1.status}; row exists after=${!!dbRow(r2.id)}`);
} finally {
  let n = 0;
  for (const id of created) {
    const r = dbRow(id);
    if (r && r.title.startsWith(P)) { await req("DELETE", `/bugs/${id}`); n++; }
  }
  console.log(`\ncleanup deleted ${n}; [data] rows remaining: ${ro.prepare("SELECT count(*) n FROM bugs WHERE title LIKE '[data]%'").get().n}`);
  console.log(`zero-width-title rows by prefix-less residue: ${j(ro.prepare("SELECT id, hex(title) h, description FROM bugs WHERE title NOT LIKE '[%'").all())}`);
}
