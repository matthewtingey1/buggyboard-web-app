// Data slice API retest, run 2026-09-22T230611Z. Run from this dir: node api-retest.mjs > api-retest.log 2>&1
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
async function mk(body = {}) {
  const r = await req("POST", "/bugs", { title: `${P} x`, severity: "low", owner: "buggy", description: "d", ...body });
  if (r.json?.id) created.push(r.json.id);
  return r;
}
async function layers(label, id, field, expected, resp) {
  const g = await req("GET", `/bugs/${id}`);
  const list = (await req("GET", "/bugs")).json.find((b) => b.id === id);
  const l = { response: resp?.[field], get: g.json?.[field], list: list?.[field], db: dbRow(id)?.[field] };
  const bad = Object.entries(l).filter(([, v]) => v !== expected);
  console.log(`${bad.length ? "DIFF" : "OK  "} ${label} [${field}] id=${id} expected=${short(expected)}`);
  for (const [k, v] of bad) console.log(`       ${k}=${short(v)} cps[${typeof v === "string" && v.length < 60 ? cps(v) : ""}] expected cps[${expected.length < 60 ? cps(expected) : ""}]`);
}

console.log(`health: ${(await req("GET", "/health")).text}`);
console.log(`start sqlite_sequence.bugs=${ro.prepare("select seq from sqlite_sequence where name='bugs'").get().seq}; rows 1-3: ${j(ro.prepare("select id,title from bugs where id<=3").all().map((r) => r.id))}`);

console.log("\n== data-01 one-line titles (create and update), side effects of oneLine ==");
const titleCases = [
  ["LF", `${P} a\nb`, `${P} a b`],
  ["CRLF + indent", `${P} a\r\n    b`, `${P} a b`],
  ["CR only", `${P} a\rb`, `${P} a b`],
  ["blank lines", `${P} a\n\n\nb`, `${P} a b`],
  ["NBSP before LF (eaten by \\s*)", `${P} a \nb`, `${P} a b`],
  ["tab after LF", `${P} a\n\tb`, `${P} a b`],
  ["inner NBSP kept", `${P} a b`, `${P} a b`],
  ["inner double space kept", `${P} a  b`, `${P} a  b`],
  ["U+2028 line separator (not converted)", `${P} a b`, `${P} a b`],
  ["U+0085 NEL (not converted)", `${P} a\u0085b`, `${P} a\u0085b`],
  ["VT/FF (not converted)", `${P} a\u000Bb\u000Cc`, `${P} a\u000Bb\u000Cc`],
  ["ZWJ emoji across newline", `${P} \u{1F469}‍\u{1F4BB}\n\u{1F468}‍\u{1F469}‍\u{1F467}`, `${P} \u{1F469}‍\u{1F4BB} \u{1F468}‍\u{1F469}‍\u{1F467}`],
];
for (const [label, input, expected] of titleCases) {
  const r = await mk({ title: input });
  if (r.status !== 201) { console.log(`FAIL create ${label}: ${r.status} ${r.text}`); continue; }
  await layers(`create ${label}`, r.json.id, "title", expected, r.json);
  const u = await req("PUT", `/bugs/${r.json.id}`, { ...r.json, title: input + "\nedited" });
  await layers(`update ${label}`, r.json.id, "title", expected + " edited", u.json);
}
{
  const r = await mk({ description: "keep\nmy\r\nlines", owner: "own\ner" });
  await layers("description keeps newlines", r.json.id, "description", "keep\nmy\r\nlines", r.json);
  await layers("owner newline NOT one-lined", r.json.id, "owner", "own\ner", r.json);
}

console.log("\n== data-05 invisible-only values per field ==");
const invis = {
  "U+200B": "​", "U+200C": "‌", "U+200D": "‍", "U+2060": "⁠", "U+FEFF": "﻿",
  "mix 200B+2060+NBSP+LF": "​⁠ \n‍",
  "U+200E LRM": "‎", "U+200F RLM": "‏", "U+00AD soft hyphen": "­", "U+034F CGJ": "͏",
  "U+180E MVS": "᠎", "U+2061 func app": "⁡", "U+2063 invis sep": "⁣", "U+202E RLO": "‮",
  "U+2066 LRI": "⁦", "U+3164 hangul filler": "ㅤ", "U+115F hangul choseong filler": "ᅟ",
  "U+FFA0 halfwidth hangul filler": "ﾠ", "U+2800 braille blank": "⠀", "U+FE0F VS16": "️",
  "U+E0020 tag space": "\u{E0020}",
};
for (const [label, v] of Object.entries(invis)) {
  const out = [];
  for (const field of ["title", "owner", "description"]) {
    const r = await mk({ [field]: field === "title" ? v : v });
    out.push(`${field}=${r.status}${r.status !== 201 ? `(${r.json?.error})` : ""}`);
  }
  console.log(`${label.padEnd(34)} ${out.join("  ")}`);
}
console.log("-- legitimate values that contain the stripped characters --");
for (const [label, v] of [["ZWJ emoji only (owner)", "\u{1F469}‍\u{1F4BB}"], ["ZWNJ Persian (owner)", "می‌خواهم"], ["flag + VS16 (owner)", "❤️"], ["ZWSP-padded owner", "​buggy​"]]) {
  const r = await mk({ owner: v });
  if (r.status !== 201) { console.log(`FAIL ${label}: ${r.status} ${r.text}`); continue; }
  await layers(label, r.json.id, "owner", v, r.json);
}

console.log("\n== data-03 response is read back (lone surrogates) ==");
for (const [label, v] of [["lone high", "x\uD800y"], ["lone low", "x\uDC00y"]]) {
  for (const field of ["title", "owner", "description"]) {
    const input = field === "title" ? `${P} ${v}` : v;
    const r = await mk({ [field]: input });
    const stored = dbRow(r.json.id)[field];
    await layers(`create ${label}`, r.json.id, field, stored, r.json);
    const u = await req("PUT", `/bugs/${r.json.id}`, { ...r.json, state: "open", [field]: input + "2" });
    await layers(`update ${label}`, r.json.id, field, dbRow(r.json.id)[field], u.json);
    console.log(`       stored cps: ${cps(dbRow(r.json.id)[field])}`);
  }
}
{
  const r = await mk({ title: `  ${P} resp trim  `, severity: "High" });
  console.log(`create response severity=${r.json.severity} state=${r.json.state} title=${j(r.json.title)} keys=${Object.keys(r.json).join(",")}`);
}

console.log("\n== data-02 id parsing ==");
{
  const r = await mk({ title: `${P} idparse` });
  const id = r.json.id;
  for (const p of [`${id}abc`, `${id}.9`, `${id}e5`, `${id}%20junk`, `0${id}`, `+${id}`, `0`, `-1`, `99999999999999999999`, `%D9%A1`]) {
    const g = await req("GET", `/bugs/${p}`);
    const u = await req("PUT", `/bugs/${p}`, { ...r.json, state: "closed", title: `${P} MODIFIED` });
    const d = await req("DELETE", `/bugs/${p}`);
    console.log(`  /bugs/${p.padEnd(22)} GET ${g.status} PUT ${u.status} DELETE ${d.status}`);
  }
  console.log(`  row ${id} after: ${j(dbRow(id))}`);
}

console.log("\n== data-04 length ==");
{
  const r = await mk({ title: `${P} ` + "t".repeat(90_000) });
  console.log(`  90k title -> ${r.status}; stored length ${r.json?.id ? dbRow(r.json.id).title.length : "-"}`);
  const big = await req("POST", "/bugs", { title: `${P} big`, severity: "low", owner: "buggy", description: "d".repeat(120_000) });
  console.log(`  120k description -> ${big.status} ${big.ctype} ${big.text.slice(0, 120)}`);
  if (big.json?.id) created.push(big.json.id);
}

console.log("\n== data-07 concurrency ==");
{
  const r = await mk({ title: `${P} race` });
  const id = r.json.id;
  let a = 0, b = 0, mixed = 0, non200 = 0;
  for (let i = 0; i < 20; i++) {
    const A = { title: `${P} race A${i}`, severity: "high", owner: "buggy", description: `A${i}`, state: "open" };
    const B = { title: `${P} race B${i}`, severity: "low", owner: "vanny", description: `B${i}`, state: "closed" };
    const [ra, rb] = await Promise.all([req("PUT", `/bugs/${id}`, A), req("PUT", `/bugs/${id}`, B)]);
    if (ra.status !== 200 || rb.status !== 200) non200++;
    const row = dbRow(id);
    const isA = row.title.endsWith(`A${i}`) && row.description === `A${i}` && row.owner === "buggy" && row.severity === "HIGH" && row.state === "OPEN";
    const isB = row.title.endsWith(`B${i}`) && row.description === `B${i}` && row.owner === "vanny" && row.severity === "LOW" && row.state === "CLOSED";
    isA ? a++ : isB ? b++ : mixed++;
    // each response must equal what was in the DB right after that statement; the final one must match the DB
    const last = [ra, rb].find((x) => x.json.title === row.title);
    if (!last) console.log(`  round ${i}: no response matches final row ${j(row)}`);
  }
  console.log(`  20 rounds parallel full-row PUT: A won ${a}, B won ${b}, mixed ${mixed}, non-200 ${non200}`);
  // stale overwrite
  const s1 = (await req("GET", `/bugs/${id}`)).json;
  const s2 = (await req("GET", `/bugs/${id}`)).json;
  await req("PUT", `/bugs/${id}`, { ...s1, description: "client1 change" });
  await req("PUT", `/bugs/${id}`, { ...s2, owner: "client2" });
  console.log(`  stale overwrite: final ${j({ owner: dbRow(id).owner, description: dbRow(id).description })} (client1's description lost=${dbRow(id).description !== "client1 change"})`);
  // PUT vs DELETE race
  let resurrected = 0; const outcomes = {};
  for (let i = 0; i < 10; i++) {
    const x = await mk({ title: `${P} putdel ${i}` });
    const [p, d] = await Promise.all([req("PUT", `/bugs/${x.json.id}`, { ...x.json, state: "open", description: "late" }), req("DELETE", `/bugs/${x.json.id}`)]);
    outcomes[`${p.status}/${d.status}`] = (outcomes[`${p.status}/${d.status}`] ?? 0) + 1;
    if (dbRow(x.json.id)) resurrected++;
  }
  console.log(`  PUT||DELETE x10 outcomes (PUT/DELETE): ${j(outcomes)} rows surviving=${resurrected}`);
  const x = await mk({ title: `${P} after-del` });
  await req("DELETE", `/bugs/${x.json.id}`);
  console.log(`  PUT after delete ${(await req("PUT", `/bugs/${x.json.id}`, { ...x.json, state: "open" })).status}, DELETE again ${(await req("DELETE", `/bugs/${x.json.id}`)).status}, row=${j(dbRow(x.json.id) ?? null)}`);
  const y = await mk({ title: `${P} id-seq` });
  console.log(`  new id ${y.json.id} > deleted ${x.json.id}: ${y.json.id > x.json.id}`);
}

console.log("\n== lifecycle ==");
{
  const r = await mk({ title: `${P} lifecycle` });
  console.log(`  create state=${r.json.state} db=${dbRow(r.json.id).state}`);
  const u = await req("PUT", `/bugs/${r.json.id}`, { ...r.json, state: "Closed" });
  console.log(`  PUT state 'Closed' -> ${u.status} response=${u.json.state} db=${dbRow(r.json.id).state}`);
}

console.log("\n== cleanup ==");
let del = 0;
for (const id of created) { const d = await req("DELETE", `/bugs/${id}`); if (d.status === 204) del++; }
const left = ro.prepare("select count(*) c from bugs where title like '[data]%'").get().c;
console.log(`  deleted ${del}/${created.length} (others already deleted by the test); [data] rows left=${left}`);
console.log(`end sqlite_sequence.bugs=${ro.prepare("select seq from sqlite_sequence where name='bugs'").get().seq}; rows 1-3 still: ${j(ro.prepare("select id from bugs where id<=3").all().map((r) => r.id))}`);
