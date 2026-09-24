// Headless UI retest for data-01, data-06 and UI-path input classes. Run from this dir: node ui-retest.mjs > ui-retest.log 2>&1
import { chromium } from "@playwright/test";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..", "..");
const user = JSON.parse(readFileSync(join(root, "users.json"), "utf8")).find((u) => u.username === "buggy");
const ro = new Database(join(root, "backend", "data", "buggyboard.db"), { readonly: true, fileMustExist: true });
const dbRow = (id) => ro.prepare("SELECT id,title,severity,owner,description,state FROM bugs WHERE id=?").get(id);
const BASE = "http://localhost:5173";
const created = [];
const api = async (method, path, body) => {
  const r = await fetch(BASE + "/api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t }; }
};
const j = (v) => JSON.stringify(v);
const cps = (s) => [...String(s)].map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join(" ");
const cmp = (label, got, exp) => console.log(`${got === exp ? "OK  " : "DIFF"} ${label}: ${got === exp ? j(got) : `got ${j(got)} [${cps(got)}] expected ${j(exp)} [${cps(exp)}]`}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const table = () => page.getByRole("table", { name: "Bugs" });
const rowById = (id) => table().locator("tbody tr").filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^${id}$`) }) });
const filter = (name) => page.getByRole("group", { name: "Filter by bug state" }).getByRole("button", { name, exact: true });
async function reloadBoard() { await page.reload(); await table().waitFor(); }
async function openEdit(id) {
  await rowById(id).click();
  const dlg = page.getByRole("dialog", { name: `Edit bug #${id}` });
  await dlg.waitFor();
  await page.waitForTimeout(200);
  return dlg;
}
const closeModal = async () => { await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "hidden" }); };
const putOn = (dlg) => Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);

try {
  await page.goto(BASE + "/");
  await page.locator("#username").fill(user.username);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await table().waitFor();

  console.log("== data-01: API-created multi-line title through the edit modal ==");
  const ml = (await api("POST", "/bugs", { title: "[data] ml line1\nline2", severity: "low", owner: "buggy", description: "d" })).json;
  created.push(ml.id);
  await reloadBoard();
  cmp("board title cell", await rowById(ml.id).locator("td").nth(2).innerText(), "[data] ml line1\nline2");
  let dlg = await openEdit(ml.id);
  cmp("modal title value", await dlg.locator("#edit-bug-title").inputValue(), "[data] ml line1\nline2");
  await dlg.locator("#edit-bug-title").press("End");
  await dlg.locator("#edit-bug-title").pressSequentially("X");
  await dlg.locator("#edit-bug-title").press("Backspace");
  console.log(`save enabled after type+backspace: ${!(await dlg.getByRole("button", { name: "Save" }).isDisabled())}`);
  if (!(await dlg.getByRole("button", { name: "Save" }).isDisabled())) {
    const [r] = await putOn(dlg);
    console.log(`PUT ${r.status()} body.title=${j(JSON.parse(r.request().postData()).title)}`);
    cmp("DB.title after no intended title change", dbRow(ml.id).title, "[data] ml line1\nline2");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  } else await closeModal();

  console.log("\n== UI create with NBSP / bidi / NUL / lone surrogate, compare request, DB, board, modal ==");
  const uiCases = {
    nbsp_pad: [" [data] nbsp pad ", "[data] nbsp pad"],
    bidi_override: ["[data] bidi abc‮evil‬", "[data] bidi abc‮evil‬"],
    nul: ["[data] nul a\u0000b", "[data] nul a\u0000b"],
    lone_surrogate: ["[data] sur x\uD800y", "[data] sur x\uD800y"],
  };
  for (const [name, [input, exp]] of Object.entries(uiCases)) {
    await page.getByRole("button", { name: "New Bug" }).click();
    const c = page.getByRole("dialog", { name: /bug/i });
    await c.locator("#bug-title").fill(input);
    await c.locator("#bug-severity").selectOption("low");
    await c.locator("#bug-description").fill(`desc ${input}`);
    cmp(`${name} create input value before save`, await c.locator("#bug-title").inputValue(), input);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/bugs") && r.request().method() === "POST"),
      c.getByRole("button", { name: "Save" }).click(),
    ]);
    const posted = await resp.json().catch(() => ({}));
    if (posted.id) created.push(posted.id);
    console.log(`${name}: POST ${resp.status()} request title=${j(JSON.parse(resp.request().postData()).title)}`);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    if (!posted.id) continue;
    await page.waitForTimeout(200);
    cmp(`${name} DB.title`, dbRow(posted.id).title, exp);
    cmp(`${name} board title (textContent)`, await rowById(posted.id).locator("td").nth(2).textContent(), exp);
    dlg = await openEdit(posted.id);
    cmp(`${name} modal title`, await dlg.locator("#edit-bug-title").inputValue(), dbRow(posted.id).title);
    cmp(`${name} modal description`, await dlg.locator("#edit-bug-description").inputValue(), dbRow(posted.id).description);
    console.log(`${name} save enabled with no edits: ${!(await dlg.getByRole("button", { name: "Save" }).isDisabled())}`);
    await closeModal();
  }
  await page.screenshot({ path: join(here, "ui-bidi-nul-board.png") });

  console.log("\n== data-06: save after another client deleted the bug ==");
  const st = (await api("POST", "/bugs", { title: "[data] stale-ui", severity: "low", owner: "buggy", description: "d" })).json;
  created.push(st.id);
  await reloadBoard();
  dlg = await openEdit(st.id);
  await dlg.locator("#edit-bug-description").fill("edited after delete");
  const del = await api("DELETE", `/bugs/${st.id}`);
  const [sp] = await putOn(dlg);
  await page.waitForTimeout(300);
  console.log(`other client DELETE ${del.status}; UI PUT ${sp.status()}; alert=${j(await dlg.getByRole("alert").innerText().catch(() => "(none)"))}; resurrected=${!!dbRow(st.id)}`);
  await closeModal();
  console.log(`board rows for deleted id after closing modal: ${await rowById(st.id).count()}`);
  await page.screenshot({ path: join(here, "ui-06-stale-edit.png") });

  console.log("\n== Lifecycle: Closed via modal appears under Closed only ==");
  const lc = (await api("POST", "/bugs", { title: "[data] lifecycle", severity: "mid", owner: "buggy", description: "d" })).json;
  created.push(lc.id);
  await reloadBoard();
  console.log(`new bug state=${lc.state}; under Open=${await rowById(lc.id).count()}`);
  dlg = await openEdit(lc.id);
  await dlg.locator("#edit-bug-state").selectOption("closed");
  await putOn(dlg);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForTimeout(300);
  const underOpen = await rowById(lc.id).count();
  await filter("Closed").click();
  console.log(`after close: under Open=${underOpen}, under Closed=${await rowById(lc.id).count()}, DB.state=${dbRow(lc.id).state}`);
} finally {
  for (const id of created) {
    const r = dbRow(id);
    if (r && r.title.startsWith("[data]")) await api("DELETE", `/bugs/${id}`);
  }
  console.log(`\n[data] rows remaining: ${ro.prepare("SELECT count(*) n FROM bugs WHERE title LIKE '[data]%'").get().n}`);
  await browser.close();
}
