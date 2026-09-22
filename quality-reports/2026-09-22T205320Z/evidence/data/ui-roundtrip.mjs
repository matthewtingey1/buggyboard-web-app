// Headless UI round-trip for the data slice. Run: node ui-roundtrip.mjs > ui-roundtrip.log
import { chromium } from "@playwright/test";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const ro = new Database(join(here, "..", "..", "..", "..", "backend", "data", "buggyboard.db"), { readonly: true, fileMustExist: true });
const dbRow = (id) => ro.prepare("SELECT id,title,severity,owner,description,state FROM bugs WHERE id=?").get(id);
const BASE = "http://localhost:5173";
const API = BASE + "/api";
const created = [];
const api = async (method, path, body) => {
  const r = await fetch(API + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t }; }
};
const j = (v) => JSON.stringify(v);
const cmp = (label, a, b) => console.log(`${a === b ? "OK  " : "DIFF"} ${label}: ${a === b ? j(a).slice(0, 120) : `\n       got      ${j(a).slice(0, 200)}\n       expected ${j(b).slice(0, 200)}`}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function login() {
  await page.goto(BASE + "/");
  await page.locator("#username").fill("buggy");
  await page.locator("#password").fill("1970beetle");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("table", { name: "Bugs" }).waitFor();
}
const filter = (name) => page.getByRole("group", { name: "Filter by bug state" }).getByRole("button", { name, exact: true });
const rowById = (id) => page.getByRole("table", { name: "Bugs" }).locator("tbody tr").filter({ has: page.locator("td:first-child", { hasText: new RegExp(`^${id}$`) }) });
async function reloadBoard(state = "Open") {
  await page.reload();
  await page.getByRole("table", { name: "Bugs" }).waitFor();
  await filter(state).click();
}
async function openEdit(id) {
  await rowById(id).click();
  const dlg = page.getByRole("dialog", { name: `Edit bug #${id}` });
  await dlg.waitFor();
  return dlg;
}
async function modalValues(dlg) {
  return {
    title: await dlg.locator("#edit-bug-title").inputValue(),
    severity: await dlg.locator("#edit-bug-severity").inputValue(),
    state: await dlg.locator("#edit-bug-state").inputValue(),
    owner: await dlg.locator("#edit-bug-owner").inputValue(),
    description: await dlg.locator("#edit-bug-description").inputValue(),
  };
}
const closeModal = async () => { await page.keyboard.press("Escape"); await page.getByRole("dialog").waitFor({ state: "hidden" }); };

try {
  await login();

  console.log("== 1. Create via UI with mixed input, compare response/GET/board/modal/DB ==");
  const uiTitle = "  [data] UI 🐞 Crème خطأ \"q\" 'a' <b>x</b> 中文  ";
  const uiDesc = "  line1 🧑‍💻\nשורה 2 RTL\n\n  indented line\ttab  \n\n";
  await page.getByRole("button", { name: "New Bug" }).click();
  const cdlg = page.getByRole("dialog", { name: /bug/i });
  const defaultOwner = await cdlg.locator("#bug-owner").inputValue();
  await cdlg.locator("#bug-title").fill(uiTitle);
  await cdlg.locator("#bug-severity").selectOption("high");
  await cdlg.locator("#bug-description").fill(uiDesc);
  const [postResp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith("/api/bugs") && r.request().method() === "POST"),
    cdlg.getByRole("button", { name: "Save" }).click(),
  ]);
  const posted = await postResp.json();
  created.push(posted.id);
  const reqBody = JSON.parse(postResp.request().postData());
  console.log(`owner default=${j(defaultOwner)}; request body title=${j(reqBody.title)} desc=${j(reqBody.description)}`);
  console.log(`POST ${postResp.status()} id=${posted.id} state=${posted.state}`);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const g = (await api("GET", `/bugs/${posted.id}`)).json;
  const d = dbRow(posted.id);
  const expTitle = uiTitle.trim(), expDesc = uiDesc.trim();
  cmp("response.title vs trimmed input", posted.title, expTitle);
  cmp("GET.title", g.title, expTitle);
  cmp("DB.title", d.title, expTitle);
  cmp("response.description", posted.description, expDesc);
  cmp("GET.description", g.description, expDesc);
  cmp("DB.description", d.description, expDesc);
  cmp("DB.severity", d.severity, "HIGH");
  cmp("DB.state (new bug is OPEN)", d.state, "OPEN");
  const boardTitle = await rowById(posted.id).locator("td").nth(2).innerText();
  const boardSev = await rowById(posted.id).locator("td").nth(1).innerText();
  const boardOwner = await rowById(posted.id).locator("td").nth(3).innerText();
  cmp("board title cell (visible text)", boardTitle, expTitle);
  cmp("board severity cell", boardSev, "HIGH");
  cmp("board owner cell", boardOwner, "buggy");
  let dlg = await openEdit(posted.id);
  const mv = await modalValues(dlg);
  cmp("modal title", mv.title, expTitle);
  cmp("modal description", mv.description, expDesc);
  cmp("modal severity", mv.severity, "high");
  cmp("modal state", mv.state, "open");
  cmp("modal owner", mv.owner, "buggy");
  await page.screenshot({ path: join(here, "ui-01-edit-modal-unicode.png") });
  // trailing whitespace only is not a change
  await dlg.locator("#edit-bug-title").fill(mv.title + "   ");
  console.log(`save disabled after adding only trailing spaces to title: ${await dlg.getByRole("button", { name: "Save" }).isDisabled()}`);
  await closeModal();

  console.log("\n== 2. Lifecycle via UI: Open -> Closed via edit modal ==");
  console.log(`visible under Open before: ${await rowById(posted.id).count()}`);
  dlg = await openEdit(posted.id);
  await dlg.locator("#edit-bug-state").selectOption("closed");
  await Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForTimeout(300);
  console.log(`after close: under Open=${await rowById(posted.id).count()}`);
  await filter("Closed").click();
  console.log(`after close: under Closed=${await rowById(posted.id).count()}; DB.state=${dbRow(posted.id).state}; title/desc unchanged? ${dbRow(posted.id).title === expTitle && dbRow(posted.id).description === expDesc}`);
  await filter("Open").click();

  console.log("\n== 3. API-created multi-line title, opened in the UI modal ==");
  const ml = (await api("POST", "/bugs", { title: "[data] ml line1\nline2", severity: "low", owner: "buggy", description: "d" })).json;
  created.push(ml.id);
  await reloadBoard();
  cmp("board title cell", await rowById(ml.id).locator("td").nth(2).innerText(), "[data] ml line1\nline2");
  dlg = await openEdit(ml.id);
  const mlv = await modalValues(dlg);
  cmp("modal title input value", mlv.title, "[data] ml line1\nline2");
  console.log(`save disabled with no edits: ${await dlg.getByRole("button", { name: "Save" }).isDisabled()}`);
  // user edits only the description
  await dlg.locator("#edit-bug-description").fill("d2");
  const [mlPut] = await Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);
  console.log(`PUT body title after editing only description: ${j(JSON.parse(mlPut.request().postData()).title)}; DB.title=${j(dbRow(ml.id).title)}`);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  // user touches the title (types then deletes a char)
  await reloadBoard();
  dlg = await openEdit(ml.id);
  await dlg.locator("#edit-bug-title").press("End");
  await dlg.locator("#edit-bug-title").pressSequentially("X");
  await dlg.locator("#edit-bug-title").press("Backspace");
  const touched = await dlg.locator("#edit-bug-title").inputValue();
  console.log(`after type+backspace in title: input=${j(touched)} save disabled=${await dlg.getByRole("button", { name: "Save" }).isDisabled()}`);
  if (!(await dlg.getByRole("button", { name: "Save" }).isDisabled())) {
    await Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);
    console.log(`DB.title after save with no intended title change: ${j(dbRow(ml.id).title)}`);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  } else await closeModal();

  console.log("\n== 4. Long description (10k) via UI modal ==");
  const longD = "Z".repeat(10_000);
  const lg = (await api("POST", "/bugs", { title: "[data] long", severity: "mid", owner: "buggy", description: longD })).json;
  created.push(lg.id);
  await reloadBoard();
  dlg = await openEdit(lg.id);
  cmp("modal description length 10000", (await dlg.locator("#edit-bug-description").inputValue()).length, 10000);
  await closeModal();

  console.log("\n== 5. Oversize (120k) description via UI create ==");
  await page.getByRole("button", { name: "New Bug" }).click();
  const odlg = page.getByRole("dialog", { name: /bug/i });
  await odlg.locator("#bug-title").fill("[data] oversize");
  await odlg.locator("#bug-description").fill("O".repeat(120_000));
  const [oResp] = await Promise.all([page.waitForResponse((r) => r.url().endsWith("/api/bugs") && r.request().method() === "POST"), odlg.getByRole("button", { name: "Save" }).click()]);
  await page.waitForTimeout(300);
  const alertText = await odlg.getByRole("alert").innerText().catch(() => "(none)");
  console.log(`status=${oResp.status()} alert=${j(alertText)} modal open=${await odlg.isVisible()} description kept=${(await odlg.locator("#bug-description").inputValue()).length}`);
  await page.screenshot({ path: join(here, "ui-05-oversize.png") });
  await closeModal();

  console.log("\n== 6. Edit a bug another client deleted (UI stale modal) ==");
  const st = (await api("POST", "/bugs", { title: "[data] stale-ui", severity: "low", owner: "buggy", description: "d" })).json;
  await reloadBoard();
  dlg = await openEdit(st.id);
  await dlg.locator("#edit-bug-description").fill("edited after delete");
  const delRes = await api("DELETE", `/bugs/${st.id}`);
  const [sp] = await Promise.all([page.waitForResponse((r) => r.request().method() === "PUT"), dlg.getByRole("button", { name: "Save" }).click()]);
  await page.waitForTimeout(300);
  console.log(`other client DELETE ${delRes.status}; UI PUT ${sp.status()}; alert=${j(await dlg.getByRole("alert").innerText().catch(() => "(none)"))}; modal open=${await dlg.isVisible()}; row resurrected=${!!dbRow(st.id)}`);
  await page.screenshot({ path: join(here, "ui-06-stale-edit.png") });
  await closeModal();
  console.log(`board still lists deleted row after closing modal (no refresh on 404): ${await rowById(st.id).count()}`);

  console.log("\n== 7. Stale board after another client's edit, modal refetch ==");
  const sb = (await api("POST", "/bugs", { title: "[data] stale-board v1", severity: "low", owner: "buggy", description: "v1" })).json;
  created.push(sb.id);
  await reloadBoard();
  await api("PUT", `/bugs/${sb.id}`, { title: "[data] stale-board v2", severity: "high", owner: "vanny", description: "v2", state: "open" });
  const boardBefore = await rowById(sb.id).locator("td").nth(2).innerText();
  dlg = await openEdit(sb.id);
  console.log(`board shows ${j(boardBefore)} (stale until refresh); modal shows ${j(await dlg.locator("#edit-bug-title").inputValue())} (fresh GET)`);
  await closeModal();
} finally {
  for (const id of created) {
    const r = dbRow(id);
    if (r && r.title.startsWith("[data]")) await api("DELETE", `/bugs/${id}`);
  }
  console.log(`\n[data] rows remaining: ${ro.prepare("SELECT count(*) n FROM bugs WHERE title LIKE '[data]%'").get().n}`);
  await browser.close();
}
