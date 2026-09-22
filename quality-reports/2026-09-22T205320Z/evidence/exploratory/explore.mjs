// Exploratory charters, headless. Run: node explore.mjs [charterName...]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(DIR, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });
const BASE = "http://localhost:5173";
const P = "[exploratory]";
const TAG = Date.now().toString(36);
const log = {};
function note(charter, msg) {
  (log[charter] ??= []).push(msg);
  console.log(`[${charter}] ${msg}`);
}

async function api(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
  return { status: res.status, json };
}
async function mkBug(title, extra = {}) {
  const r = await api("POST", "/api/bugs", { title: `${P} ${title}`, severity: "high", owner: "buggy", description: "exploratory charter", ...extra });
  return r.json;
}
async function mine() {
  const r = await api("GET", "/api/bugs");
  return r.json.filter((b) => b.title.startsWith(P));
}

async function session(browser, user, pass) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.fill("#username", user);
  await page.fill("#password", pass);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/board");
  await page.getByRole("table", { name: "Bugs" }).waitFor();
  await page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
  return { ctx, page };
}
async function search(page, text) {
  await page.getByLabel("Search bugs by title").fill(text);
}
function row(page, title) {
  return page.locator("tbody tr").filter({ hasText: title });
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

const charters = {
  // C1: stale bug in a second session after delete in the first
  async c1_deleteWhileOpenElsewhere(browser) {
    const C = "C1";
    const bug = await mkBug(`C1 delete-elsewhere ${TAG}`);
    const a = await session(browser, "buggy", "1970beetle");
    const b = await session(browser, "vanny", "1979bus");
    await search(b.page, `C1 delete-elsewhere ${TAG}`);
    await row(b.page, TAG).click();
    await b.page.getByRole("dialog", { name: /Edit bug/ }).waitFor();
    note(C, `vanny opened edit modal for #${bug.id}`);
    // buggy deletes via UI
    await search(a.page, `C1 delete-elsewhere ${TAG}`);
    await row(a.page, TAG).click();
    await a.page.getByRole("dialog", { name: /Edit bug/ }).getByRole("button", { name: "Delete" }).click();
    await a.page.getByRole("dialog", { name: "Delete bug" }).getByRole("button", { name: "Delete" }).click();
    await a.page.getByRole("dialog", { name: /Edit bug/ }).waitFor({ state: "detached" });
    note(C, `buggy deleted #${bug.id}; GET now -> ${(await api("GET", `/api/bugs/${bug.id}`)).status}`);
    // vanny edits and saves
    const dlg = b.page.getByRole("dialog", { name: /Edit bug/ });
    await dlg.locator("#edit-bug-description").fill("vanny edit after delete");
    await dlg.getByRole("button", { name: "Save" }).click();
    await b.page.waitForTimeout(800);
    const alertText = await dlg.innerText();
    note(C, `vanny save result: modal still open=${await dlg.isVisible()}; contains 'Bug not found.'=${alertText.includes("Bug not found.")}`);
    await shot(b.page, "C1-save-after-delete-error");
    await dlg.getByRole("button", { name: "Cancel" }).click();
    const staleCount = await row(b.page, TAG).count();
    note(C, `after Cancel, stale row still on vanny board: ${staleCount}`);
    await shot(b.page, "C1-stale-row-after-cancel");
    if (staleCount) {
      await row(b.page, TAG).click();
      await b.page.waitForTimeout(800);
      const anyDialog = await b.page.getByRole("dialog").count();
      note(C, `clicking stale row opens a dialog? ${anyDialog > 0} (no feedback if false)`);
      await shot(b.page, "C1-stale-row-click-no-feedback");
    }
    // Delete-after-delete in vanny's tab: reopen impossible; check stale row via delete path using a second bug
    const bug2 = await mkBug(`C1b delete-twice ${TAG}`);
    await b.page.reload(); await b.page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await search(b.page, `C1b delete-twice ${TAG}`);
    await row(b.page, "C1b").click();
    const dlg2 = b.page.getByRole("dialog", { name: /Edit bug/ });
    await dlg2.waitFor();
    await api("DELETE", `/api/bugs/${bug2.id}`);
    await dlg2.getByRole("button", { name: "Delete" }).click();
    await b.page.getByRole("dialog", { name: "Delete bug" }).getByRole("button", { name: "Delete" }).click();
    await b.page.waitForTimeout(800);
    note(C, `second delete of already-deleted #${bug2.id}: edit modal visible=${await dlg2.isVisible()}, text has 'Bug not found.'=${(await dlg2.isVisible()) && (await dlg2.innerText()).includes("Bug not found.")}`);
    await shot(b.page, "C1-delete-already-deleted");
    await a.ctx.close(); await b.ctx.close();
  },

  // C2: lost update between two users
  async c2_lostUpdate(browser) {
    const C = "C2";
    const bug = await mkBug(`C2 lost-update ${TAG}`);
    const a = await session(browser, "buggy", "1970beetle");
    const b = await session(browser, "vanny", "1979bus");
    for (const s of [a, b]) { await search(s.page, TAG); await row(s.page, "C2").click(); await s.page.getByRole("dialog", { name: /Edit bug/ }).waitFor(); }
    const da = a.page.getByRole("dialog", { name: /Edit bug/ });
    const db = b.page.getByRole("dialog", { name: /Edit bug/ });
    await da.locator("#edit-bug-state").selectOption("closed");
    await da.getByRole("button", { name: "Save" }).click();
    await da.waitFor({ state: "detached" });
    note(C, `buggy closed #${bug.id}; server state=${(await api("GET", `/api/bugs/${bug.id}`)).json.state}`);
    await db.locator("#edit-bug-description").fill("vanny's description edit");
    await db.getByRole("button", { name: "Save" }).click();
    await db.waitFor({ state: "detached" });
    const after = (await api("GET", `/api/bugs/${bug.id}`)).json;
    note(C, `vanny saved description only; server now state=${after.state} description="${after.description}" (buggy's close silently reverted: ${after.state === "OPEN"})`);
    await shot(b.page, "C2-after-vanny-save-bug-reopened");
    await a.ctx.close(); await b.ctx.close();
  },

  // C3: logout in one tab, other tab of the same browser keeps working
  async c3_logoutOtherTab(browser) {
    const C = "C3";
    const a = await session(browser, "buggy", "1970beetle");
    const tab2 = await a.ctx.newPage();
    await tab2.goto(BASE + "/board");
    await tab2.getByRole("table", { name: "Bugs" }).waitFor();
    await a.page.getByRole("button", { name: "Logout", exact: true }).click();
    await a.page.waitForURL("**/login");
    note(C, `tab1 logged out; localStorage buggyboard_user in tab2 = ${await tab2.evaluate(() => localStorage.getItem("buggyboard_user"))}`);
    await tab2.getByRole("button", { name: "New Bug", exact: true }).click();
    const d = tab2.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} C3 created after logout ${TAG}`);
    await d.locator("#bug-description").fill("created from a logged-out tab");
    await d.getByRole("button", { name: "Save" }).click();
    await d.waitFor({ state: "detached" });
    const created = (await mine()).find((x) => x.title.includes(`C3 created after logout ${TAG}`));
    note(C, `tab2 still on ${new URL(tab2.url()).pathname}; created bug after logout: ${created ? `#${created.id} owner=${created.owner}` : "no"}`);
    await shot(tab2, "C3-tab2-still-active-after-logout");
    // switching user in tab1 while tab2 is open: tab2 default owner
    await a.page.fill("#username", "vanny"); await a.page.fill("#password", "1979bus");
    await a.page.getByRole("button", { name: "Login" }).click(); await a.page.waitForURL("**/board");
    await tab2.getByRole("button", { name: "New Bug", exact: true }).click();
    const owner = await tab2.getByRole("dialog", { name: "Create bug" }).locator("#bug-owner").inputValue();
    note(C, `tab1 now logged in as vanny; tab2 Create modal default owner = "${owner}"`);
    await shot(tab2, "C3-tab2-default-owner-after-user-switch");
    await a.ctx.close();
  },

  // C4: duplicate creates via double-click / held Enter
  async c4_doubleSubmit(browser) {
    const C = "C4";
    const a = await session(browser, "buggy", "1970beetle");
    const variants = {
      dblclick: async (d) => d.getByRole("button", { name: "Save" }).dblclick(),
      enterRepeat: async (d, page) => { await d.locator("#bug-title").focus(); for (let i = 0; i < 8; i++) page.keyboard.press("Enter"); await page.waitForTimeout(50); },
      syncDoubleClick: async (d, page) => page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button[type=submit]')][0]; b.click(); b.click(); }),
      doubleRequestSubmit: async (d, page) => page.evaluate(() => { const f = document.querySelector('[role=dialog] form'); f.requestSubmit(); f.requestSubmit(); }),
    };
    for (const [name, act] of Object.entries(variants)) {
      const title = `${P} C4 ${name} ${TAG}`;
      await a.page.getByRole("button", { name: "New Bug", exact: true }).click();
      const d = a.page.getByRole("dialog", { name: "Create bug" });
      await d.locator("#bug-title").fill(title);
      await d.locator("#bug-description").fill("double submit probe");
      await act(d, a.page);
      await a.page.waitForTimeout(1200);
      if (await d.isVisible()) await a.page.keyboard.press("Escape");
      const n = (await mine()).filter((x) => x.title === title).length;
      note(C, `${name}: bugs created = ${n}`);
    }
    await search(a.page, `C4`);
    await shot(a.page, "C4-duplicates");
    await a.ctx.close();
  },

  // C5: deep links, unknown routes, back/forward with modals
  async c5_deepLinks(browser) {
    const C = "C5";
    const a = await session(browser, "buggy", "1970beetle");
    for (const u of ["/board?x=1", "/board/1", "/bugs/1", "/nope", "/login?next=/board/1", "/BOARD"]) {
      await a.page.goto(BASE + u);
      await a.page.waitForTimeout(400);
      note(C, `logged in: ${u} -> ${new URL(a.page.url()).pathname}${new URL(a.page.url()).search}; dialog open=${(await a.page.getByRole("dialog").count()) > 0}`);
    }
    await a.page.goto(BASE + "/board");
    await a.page.getByRole("table", { name: "Bugs" }).waitFor();
    await a.page.getByRole("button", { name: "New Bug", exact: true }).click();
    await a.page.getByRole("dialog", { name: "Create bug" }).locator("#bug-title").fill(`${P} C5 typed then Back`);
    const urlBefore = a.page.url();
    await a.page.goBack();
    await a.page.waitForTimeout(600);
    note(C, `Back with Create modal open (url stays ${urlBefore === a.page.url()}) -> now at ${a.page.url()}; typed draft lost; dialog open=${(await a.page.getByRole("dialog").count()) > 0}`);
    await shot(a.page, "C5-back-with-modal-open");
    // Logout then Back
    await a.page.goto(BASE + "/board"); await a.page.getByRole("table", { name: "Bugs" }).waitFor();
    await a.page.getByRole("button", { name: "Logout", exact: true }).click(); await a.page.waitForURL("**/login");
    await a.page.goBack(); await a.page.waitForTimeout(500);
    note(C, `Logout then Back -> ${new URL(a.page.url()).pathname}`);
    // Anonymous deep link, then login: where do we land?
    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(BASE + "/board?search=foo");
    await ap.waitForURL("**/login");
    await ap.fill("#username", "buggy"); await ap.fill("#password", "1970beetle");
    await ap.getByRole("button", { name: "Login" }).click(); await ap.waitForURL("**/board**");
    note(C, `anon deep link /board?search=foo -> login -> ${new URL(ap.url()).pathname}${new URL(ap.url()).search}; search box="${await ap.getByLabel("Search bugs by title").inputValue()}"`);
    // search/filter state not in URL: reload loses it
    await search(ap, "exploratory"); await ap.getByRole("button", { name: "Closed", exact: true }).click();
    await ap.reload(); await ap.getByRole("table", { name: "Bugs" }).waitFor();
    note(C, `after setting search+Closed filter and reload: search="${await ap.getByLabel("Search bugs by title").inputValue()}", url=${ap.url()}`);
    await anon.close(); await a.ctx.close();
  },

  // C6: owner / username variants
  async c6_ownerVariants(browser) {
    const C = "C6";
    for (const [u, p] of [[" buggy ", "1970beetle"], ["Buggy", "1970beetle"], ["BUGGY", "1970beetle"], ["buggy", " 1970beetle"], ["matt", "<redacted>"]]) {
      const r = await api("POST", "/api/login", { username: u, password: p });
      note(C, `login ${JSON.stringify(u)}/${JSON.stringify(p)} -> ${r.status} ${JSON.stringify(r.json)}`);
    }
    for (const owner of ["nobody-such-user", "  buggy  ", "Buggy", "bug gy", "a".repeat(300)]) {
      const r = await api("POST", "/api/bugs", { title: `${P} C6 owner ${JSON.stringify(owner).slice(0, 20)} ${TAG}`, severity: "low", owner, description: "owner probe" });
      note(C, `create owner=${JSON.stringify(owner).slice(0, 40)} -> ${r.status} stored owner=${JSON.stringify(r.json.owner ?? r.json).slice(0, 50)}`);
    }
    // sort by owner with case variants
    const a = await session(browser, "buggy", "1970beetle");
    await search(a.page, `C6 owner`);
    await a.page.getByRole("button", { name: /^Owner/ }).click();
    const owners = await a.page.locator("tbody tr td:nth-child(4)").allInnerTexts();
    note(C, `owner-sorted (asc) C6 rows: ${JSON.stringify(owners.map((o) => o.slice(0, 20)))}`);
    await shot(a.page, "C6-owner-variants-and-long-owner");
    // Clear owner in create modal and log in as " buggy " via UI to see what default owner is
    await a.page.getByRole("button", { name: "Logout", exact: true }).click(); await a.page.waitForURL("**/login");
    await a.page.fill("#username", "  buggy "); await a.page.fill("#password", "1970beetle");
    await a.page.getByRole("button", { name: "Login" }).click(); await a.page.waitForURL("**/board");
    await a.page.getByRole("button", { name: "New Bug", exact: true }).click();
    note(C, `UI login with "  buggy " -> default owner="${await a.page.locator("#bug-owner").inputValue()}"`);
    await a.ctx.close();
  },

  // C7: long titles and many bugs
  async c7_longAndMany(browser) {
    const C = "C7";
    const longWord = "X".repeat(400);
    const b1 = await mkBug(`C7 longword ${TAG} ${longWord}`);
    const b2 = await mkBug(`C7 longsentence ${TAG} ` + "the quick brown fox jumps ".repeat(40));
    note(C, `created long-title bugs #${b1.id} (400-char unbroken word), #${b2.id} (1000+ chars with spaces)`);
    const lt = await api("POST", "/api/bugs", { title: `${P} C7 huge ${"Y".repeat(20000)}`, severity: "low", owner: "buggy", description: "d" });
    note(C, `20k-char title accepted by API: ${lt.status}`);
    const t0 = Date.now();
    const ids = [];
    for (let i = 0; i < 200; i++) ids.push((await mkBug(`C7 bulk ${TAG} ${String(i).padStart(3, "0")}`)).id);
    note(C, `created 200 bulk bugs in ${Date.now() - t0} ms`);
    const a = await session(browser, "buggy", "1970beetle");
    await search(a.page, `C7 longword ${TAG}`);
    const w = await a.page.evaluate(() => ({ doc: document.documentElement.scrollWidth, vw: innerWidth, table: document.querySelector("table").scrollWidth, wrap: document.querySelector("table").parentElement.clientWidth }));
    note(C, `unbroken 400-char title: table scrollWidth=${w.table} vs container=${w.wrap}, viewport=${w.vw}`);
    await shot(a.page, "C7-long-unbroken-title");
    await search(a.page, `C7 longsentence ${TAG}`);
    await shot(a.page, "C7-long-sentence-title");
    await search(a.page, `C7 huge`);
    const h = await a.page.locator("tbody tr").first().boundingBox();
    note(C, `20k-char title row height=${h && Math.round(h.height)}px`);
    await shot(a.page, "C7-20k-title-row");
    await search(a.page, `C7 huge`); await row(a.page, "C7 huge").first().click();
    await a.page.getByRole("dialog", { name: /Edit bug/ }).waitFor();
    await shot(a.page, "C7-20k-title-edit-modal");
    await a.page.keyboard.press("Escape");
    await search(a.page, "");
    const t1 = Date.now();
    await search(a.page, `C7 bulk ${TAG}`);
    const rows = await a.page.locator("tbody tr").count();
    note(C, `search to 200 bulk rows rendered in ${Date.now() - t1} ms; rows=${rows}; no pagination control present=${(await a.page.getByRole("navigation").count()) === 0}`);
    await a.page.screenshot({ path: path.join(SHOTS, "C7-200-bugs-fullpage.png"), fullPage: true });
    await a.ctx.close();
  },

  // C8: backend rejection while a modal is open
  async c8_backendRejects(browser) {
    const C = "C8";
    const a = await session(browser, "buggy", "1970beetle");
    await a.page.getByRole("button", { name: "New Bug", exact: true }).click();
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} C8 oversized description ${TAG}`);
    await d.locator("#bug-description").fill("Z".repeat(120_000));
    await d.getByRole("button", { name: "Save" }).click();
    await a.page.waitForTimeout(1000);
    note(C, `create with 120k description: modal open=${await d.isVisible()}; message="${(await d.locator("ul").allInnerTexts()).join(" | ")}"`);
    await shot(a.page, "C8-create-413-message");
    const direct = await api("POST", "/api/bugs", JSON.stringify({ title: "x", severity: "low", owner: "o", description: "Z".repeat(120_000) }));
    note(C, `direct POST 120k -> ${direct.status}, body starts: ${JSON.stringify(direct.json).slice(0, 80)}`);
    const bad = await api("POST", "/api/bugs", "{not json");
    note(C, `malformed JSON -> ${bad.status}, body starts: ${JSON.stringify(bad.json).slice(0, 80)}`);
    await a.page.keyboard.press("Escape");
    // Edit an existing bug: a server-rejected save keeps edits; does board reflect?
    const bug = await mkBug(`C8 edit reject ${TAG}`);
    await a.page.reload(); await a.page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await search(a.page, `C8 edit reject ${TAG}`); await row(a.page, "C8 edit").click();
    const e = a.page.getByRole("dialog", { name: /Edit bug/ });
    await e.locator("#edit-bug-description").fill("W".repeat(120_000));
    await e.getByRole("button", { name: "Save" }).click();
    await a.page.waitForTimeout(1000);
    note(C, `edit with 120k description: message="${(await e.locator("ul").allInnerTexts()).join(" | ")}"`);
    await shot(a.page, "C8-edit-413-message");
    await a.ctx.close();
  },
};

const want = process.argv.slice(2);
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, fn] of Object.entries(charters)) {
    if (want.length && !want.some((w) => name.startsWith(w))) continue;
    try { await fn(browser); } catch (err) { note(name, `ERROR ${err.message.split("\n")[0]}`); }
  }
} finally {
  await browser.close();
  const out = path.join(DIR, `session-log-${TAG}.json`);
  fs.writeFileSync(out, JSON.stringify(log, null, 2));
  console.log("log:", out);
}
