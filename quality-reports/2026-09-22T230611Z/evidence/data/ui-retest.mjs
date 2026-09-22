// Headless UI retest, run 2026-09-22T230611Z. Run from this dir: node ui-retest.mjs > ui-retest.log 2>&1
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
const mk = async (title, extra = {}) => { const r = (await api("POST", "/bugs", { title, severity: "low", owner: "buggy", description: "d", ...extra })).json; created.push(r.id); return r; };
const j = (v) => JSON.stringify(v);
const cps = (s) => [...String(s)].map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join(" ");
const cmp = (label, got, exp) => console.log(`${got === exp ? "OK  " : "DIFF"} ${label}: ${got === exp ? j(got) : `got ${j(got)} [${cps(got)}] expected ${j(exp)} [${cps(exp)}]`}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const table = () => page.getByRole("table", { name: "Bugs" });
const rowById = (id) => table().locator("tbody tr").filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^${id}$`) }) });
const filter = (name) => page.getByRole("group", { name: "Filter by bug state" }).getByRole("button", { name, exact: true });
async function reloadBoard() { await page.reload(); await table().waitFor(); await page.waitForTimeout(200); }
async function openEdit(id) {
  await rowById(id).click();
  const dlg = page.getByRole("dialog", { name: `Edit bug #${id}` });
  await dlg.waitFor();
  await page.waitForTimeout(200);
  return dlg;
}
const closeModal = async () => { await page.keyboard.press("Escape"); await page.getByRole("dialog").first().waitFor({ state: "hidden" }); };
const putOn = (dlg) => Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);
async function createViaUI(fields) {
  await page.getByRole("button", { name: "New Bug" }).click();
  const c = page.getByRole("dialog", { name: /bug/i });
  await c.locator("#bug-title").fill(fields.title);
  await c.locator("#bug-severity").selectOption("low");
  if (fields.owner !== undefined) await c.locator("#bug-owner").fill(fields.owner);
  await c.locator("#bug-description").fill(fields.description ?? "desc");
  const before = { title: await c.locator("#bug-title").inputValue(), description: await c.locator("#bug-description").inputValue() };
  const respP = page.waitForResponse((r) => r.url().endsWith("/api/bugs") && r.request().method() === "POST", { timeout: 4000 }).catch(() => null);
  await c.getByRole("button", { name: "Save" }).click();
  const resp = await respP;
  const posted = resp ? await resp.json().catch(() => ({})) : {};
  if (posted.id) created.push(posted.id);
  return { c, resp, posted, before };
}

try {
  await page.goto(BASE + "/");
  await page.locator("#username").fill(user.username);
  await page.locator("#password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await table().waitFor();

  console.log("== data-01: multi-line title via API, then through the edit modal ==");
  const ml = await mk("[data] ml line1\nline2");
  cmp("POST response title", ml.title, "[data] ml line1 line2");
  await reloadBoard();
  cmp("board title cell", await rowById(ml.id).locator("td").nth(2).innerText(), "[data] ml line1 line2");
  let dlg = await openEdit(ml.id);
  cmp("modal title value", await dlg.locator("#edit-bug-title").inputValue(), "[data] ml line1 line2");
  await dlg.locator("#edit-bug-description").fill("edited desc");
  let [r] = await putOn(dlg);
  await page.getByRole("dialog").first().waitFor({ state: "hidden" });
  cmp(`PUT ${r.status()} body.title`, JSON.parse(r.request().postData()).title, "[data] ml line1 line2");
  cmp("DB.title after description-only edit", dbRow(ml.id).title, "[data] ml line1 line2");

  console.log("\n== U+2028 title (not converted by oneLine) on the UI path ==");
  const ls = await mk("[data] ls a b");
  await reloadBoard();
  const cell = rowById(ls.id).locator("td").nth(2);
  cmp("board textContent", await cell.textContent(), "[data] ls a b");
  console.log(`   board cell height px=${(await cell.boundingBox()).height} vs normal row cell=${(await rowById(ml.id).locator("td").nth(2).boundingBox()).height}`);
  dlg = await openEdit(ls.id);
  cmp("modal title value", await dlg.locator("#edit-bug-title").inputValue(), "[data] ls a b");
  console.log(`   save enabled with no edits: ${!(await dlg.getByRole("button", { name: "Save" }).isDisabled())}`);
  await closeModal();

  console.log("\n== UI create: NBSP, bidi, NUL, ZWJ emoji, leading/trailing whitespace; compare request, response, DB, board, modal ==");
  const uiCases = {
    nbsp_pad_inner: [" [data] nbsp a b ", "[data] nbsp a b"],
    bidi_isolate: ["[data] bidi ⁧خطأ⁩ x", "[data] bidi ⁧خطأ⁩ x"],
    nul: ["[data] nul a\u0000b", "[data] nul a\u0000b"],
    zwj_family: ["[data] zwj \u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466} \u{1F3F3}️‍\u{1F308}", "[data] zwj \u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466} \u{1F3F3}️‍\u{1F308}"],
    spaces_pad: ["   [data] padded   ", "[data] padded"],
  };
  for (const [name, [input, exp]] of Object.entries(uiCases)) {
    const { resp, posted, before } = await createViaUI({ title: input, description: `\n desc ${name} \n` });
    console.log(`${name}: input value before save=${j(before.title)} [${cps(before.title)}]`);
    console.log(`${name}: POST ${resp?.status()} request title=${j(resp ? JSON.parse(resp.request().postData()).title : null)}`);
    await page.getByRole("dialog").first().waitFor({ state: "hidden" });
    if (!posted.id) continue;
    await page.waitForTimeout(300);
    cmp(`${name} response.title`, posted.title, exp);
    cmp(`${name} DB.title`, dbRow(posted.id).title, exp);
    cmp(`${name} DB.description`, dbRow(posted.id).description, `desc ${name}`);
    cmp(`${name} board title`, await rowById(posted.id).locator("td").nth(2).textContent(), exp);
    dlg = await openEdit(posted.id);
    cmp(`${name} modal title`, await dlg.locator("#edit-bug-title").inputValue(), exp);
    console.log(`${name} save enabled with no edits: ${!(await dlg.getByRole("button", { name: "Save" }).isDisabled())}`);
    await closeModal();
  }

  console.log("\n== data-05 / invisible-only via the UI ==");
  {
    const { c, resp } = await createViaUI({ title: "​", description: "zw" });
    console.log(`create modal title=U+200B: request sent=${!!resp}; alerts=${j(await c.getByRole("alert").allInnerTexts().catch(() => []))}`);
    await closeModal();
  }
  {
    const { c, resp, posted } = await createViaUI({ title: "‎", description: "lrm" });
    console.log(`create modal title=U+200E (LRM): POST ${resp?.status()} id=${posted.id} DB.title cps=[${posted.id ? cps(dbRow(posted.id).title) : ""}]`);
    await page.getByRole("dialog").first().waitFor({ state: "hidden" }).catch(async () => closeModal());
    if (posted.id) { await page.waitForTimeout(300); console.log(`   board row for it visible: ${await rowById(posted.id).count()}, title cell text=${j(await rowById(posted.id).locator("td").nth(2).innerText())}`); }
  }
  {
    const b = await mk("[data] edit-zw");
    await reloadBoard();
    dlg = await openEdit(b.id);
    await dlg.locator("#edit-bug-title").fill("​");
    const enabled = !(await dlg.getByRole("button", { name: "Save" }).isDisabled());
    console.log(`edit modal title changed to U+200B: Save enabled=${enabled}`);
    if (enabled) {
      const [p] = await putOn(dlg);
      await page.waitForTimeout(300);
      console.log(`   PUT ${p.status()} alert=${j(await dlg.getByRole("alert").innerText().catch(() => "(none)"))}; DB.title=${j(dbRow(b.id).title)}`);
    }
    await closeModal();
  }

  console.log("\n== data-06: save and delete after another client deleted the bug ==");
  {
    const st = await mk("[data] stale-ui save");
    await reloadBoard();
    dlg = await openEdit(st.id);
    await dlg.locator("#edit-bug-description").fill("edited after delete");
    const del = await api("DELETE", `/bugs/${st.id}`);
    const [sp] = await putOn(dlg);
    await page.waitForTimeout(500);
    console.log(`save: other client DELETE ${del.status}; UI PUT ${sp.status()}; alert=${j(await dlg.getByRole("alert").innerText().catch(() => "(none)"))}; resurrected=${!!dbRow(st.id)}; rows behind modal=${await rowById(st.id).count()}`);
    await closeModal();
    await page.waitForTimeout(300);
    console.log(`save: board rows for deleted id after closing modal: ${await rowById(st.id).count()}`);
    await page.screenshot({ path: join(here, "ui-06-stale-save.png") });
  }
  {
    const st = await mk("[data] stale-ui delete");
    await reloadBoard();
    dlg = await openEdit(st.id);
    await api("DELETE", `/bugs/${st.id}`);
    await dlg.getByRole("button", { name: "Delete" }).click();
    const confirm = page.getByRole("dialog").last();
    const [dr] = await Promise.all([page.waitForResponse((r) => r.request().method() === "DELETE"), confirm.getByRole("button", { name: /delete/i }).last().click()]);
    await page.waitForTimeout(500);
    console.log(`delete: UI DELETE ${dr.status()}; alert=${j(await page.getByRole("alert").allInnerTexts())}`);
    await closeModal().catch(() => {});
    await page.waitForTimeout(300);
    console.log(`delete: board rows for deleted id after closing modal: ${await rowById(st.id).count()}`);
  }
  {
    const st = await mk("[data] stale-ui rowclick");
    await reloadBoard();
    await api("DELETE", `/bugs/${st.id}`);
    await rowById(st.id).click();
    await page.waitForTimeout(600);
    console.log(`row click on deleted bug: dialog open=${await page.getByRole("dialog").count()}; status=${j(await page.getByRole("status").first().innerText())}; rows=${await rowById(st.id).count()}`);
  }

  console.log("\n== data-04: 120k description via UI ==");
  {
    const { c, resp } = await createViaUI({ title: "[data] big", description: "d".repeat(120_000) });
    await page.waitForTimeout(300);
    console.log(`POST ${resp?.status()}; alert=${j(await c.getByRole("alert").allInnerTexts().catch(() => []))}; description kept length=${(await c.locator("#bug-description").inputValue()).length}`);
    await closeModal();
  }

  console.log("\n== Lifecycle: Closed via modal appears under Closed only ==");
  {
    const lc = await mk("[data] lifecycle", { severity: "mid" });
    await reloadBoard();
    console.log(`new bug state=${lc.state}; under Open=${await rowById(lc.id).count()}`);
    dlg = await openEdit(lc.id);
    await dlg.locator("#edit-bug-state").selectOption("closed");
    await putOn(dlg);
    await page.getByRole("dialog").first().waitFor({ state: "hidden" });
    await page.waitForTimeout(300);
    const underOpen = await rowById(lc.id).count();
    await filter("Closed").click();
    console.log(`after close: under Open=${underOpen}, under Closed=${await rowById(lc.id).count()}, DB.state=${dbRow(lc.id).state}`);
    await filter("Open").click();
  }
} catch (e) {
  console.log("ERROR", e.message);
  await page.screenshot({ path: join(here, "ui-error.png") });
} finally {
  let n = 0;
  for (const id of created) if ((await api("DELETE", `/bugs/${id}`)).status === 204) n++;
  console.log(`\ncleanup: deleted ${n}/${created.length}; [data] rows left=${ro.prepare("select count(*) c from bugs where title like '[data]%'").get().c}; LRM/blank rows by me left=${ro.prepare("select count(*) c from bugs where description in ('lrm','zw')").get().c}`);
  await browser.close();
}
