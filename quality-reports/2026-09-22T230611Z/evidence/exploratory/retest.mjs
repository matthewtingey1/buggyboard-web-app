// Re-test previous run's exploratory-01..13.
import { chromium, api, mkBug, session, search, row, openRow, shot, note, saveLog, sleep, delay, TAG, P, BASE } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
const EDIT = /Edit bug/;
const only = process.argv.slice(2);
const run = (id) => only.length === 0 || only.includes(id);
try {
  if (run("R01")) { const C = "R01"; const bug = await mkBug(`R01 lost-update ${TAG}`);
    const a = await session(browser, "buggy"); const b = await session(browser, "vanny");
    for (const s of [a, b]) { await search(s.page, `R01 lost-update ${TAG}`); await openRow(s.page, "R01"); await s.page.getByRole("dialog", { name: EDIT }).waitFor(); }
    const da = a.page.getByRole("dialog", { name: EDIT });
    await da.locator("#edit-bug-state").selectOption("closed"); await da.getByRole("button", { name: "Save" }).click(); await da.waitFor({ state: "detached" });
    note(C, `after buggy close: state=${(await api("GET", `/api/bugs/${bug.id}`)).json.state}`);
    const db = b.page.getByRole("dialog", { name: EDIT });
    await db.locator("#edit-bug-description").fill("vanny edit"); await db.getByRole("button", { name: "Save" }).click(); await db.waitFor({ state: "detached" });
    const after = (await api("GET", `/api/bugs/${bug.id}`)).json;
    note(C, `after vanny description save: state=${after.state} description=${after.description} -> ${after.state === "OPEN" ? "REPRODUCES" : "fixed"}`);
    await shot(b.page, "R01-after-stale-save"); await a.ctx.close(); await b.ctx.close(); }

  if (run("R02")) { const C = "R02"; const bug = await mkBug(`R02 del-elsewhere ${TAG}`); const bug2 = await mkBug(`R02b click-deleted ${TAG}`); const bug3 = await mkBug(`R02c del-deleted ${TAG}`);
    const b = await session(browser, "vanny"); await search(b.page, `R02 del-elsewhere ${TAG}`);
    await openRow(b.page, "R02"); const d = b.page.getByRole("dialog", { name: EDIT }); await d.waitFor();
    await api("DELETE", `/api/bugs/${bug.id}`);
    await d.locator("#edit-bug-description").fill("after delete"); await d.getByRole("button", { name: "Save" }).click(); await sleep(800);
    note(C, `save after delete: modal open=${await d.isVisible()} alert='${await d.getByRole("alert").innerText().catch(() => "none")}'`);
    note(C, `row behind modal after save 404: ${await row(b.page, "R02").count()}`);
    await shot(b.page, "R02-save-after-delete");
    await d.getByRole("button", { name: "Cancel" }).click(); await sleep(300);
    note(C, `stale row after Cancel: ${await row(b.page, "R02").count()}`);
    // row still present in another session that never tried to save: click it
    await search(b.page, `R02b click-deleted ${TAG}`); await row(b.page, "R02b").waitFor();
    await api("DELETE", `/api/bugs/${bug2.id}`);
    await openRow(b.page, "R02b"); await sleep(800);
    note(C, `click deleted row: dialogs=${await b.page.getByRole("dialog").count()} status='${await b.page.getByRole("status").innerText()}' row left=${await row(b.page, "R02b").count()}`);
    // delete an already-deleted bug from the modal
    await search(b.page, `R02c del-deleted ${TAG}`); await openRow(b.page, "R02c"); await d.waitFor();
    await api("DELETE", `/api/bugs/${bug3.id}`);
    await d.getByRole("button", { name: "Delete" }).click(); await b.page.getByRole("dialog", { name: "Delete bug" }).getByRole("button", { name: "Delete" }).click(); await sleep(800);
    note(C, `delete already-deleted: edit modal open=${await d.isVisible()} alert='${await d.getByRole("alert").innerText().catch(() => "none")}' row left=${await row(b.page, "R02c").count()}`);
    await shot(b.page, "R02-delete-already-deleted");
    await b.ctx.close(); }

  if (run("R03")) { const C = "R03"; const a = await session(browser, "buggy"); const t2 = await a.ctx.newPage();
    await t2.goto(BASE + "/board"); await t2.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await a.page.getByRole("button", { name: /log ?out/i }).click(); await a.page.waitForURL("**/login");
    await sleep(600);
    note(C, `tab2 URL after tab1 logout: ${t2.url()} -> ${t2.url().includes("/login") ? "fixed" : "REPRODUCES"}`);
    await shot(t2, "R03-tab2-after-logout"); await a.ctx.close(); }

  if (run("R04")) { const C = "R04"; const r = await api("POST", "/api/bugs", { title: `${P} R04 ${TAG}`, severity: "high", owner: "buggy", description: "x".repeat(120000) });
    note(C, `120k description -> ${r.status}, body=${JSON.stringify(r.json).slice(0, 120)}`);
    const m = await api("POST", "/api/bugs", "{not json");
    note(C, `malformed JSON -> ${m.status} body=${JSON.stringify(m.json).slice(0, 120)}`);
    const a = await session(browser, "buggy"); await a.page.getByRole("button", { name: "New Bug" }).click();
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} R04 ui ${TAG}`); await d.locator("#bug-description").fill("y".repeat(120000));
    await d.getByRole("button", { name: "Save" }).click(); await sleep(800);
    note(C, `UI alert: '${await d.getByRole("alert").innerText().catch(() => "none")}'; title maxLength=${await d.locator("#bug-title").getAttribute("maxlength")} desc maxLength=${await d.locator("#bug-description").getAttribute("maxlength")}`);
    await shot(a.page, "R04-create-413"); await a.ctx.close(); }

  if (run("R05")) { const C = "R05"; await mkBug(`R05 ${TAG} ` + "X".repeat(400));
    const big = await api("POST", "/api/bugs", { title: `${P} R05big ${TAG} ` + "Y".repeat(20000), severity: "low", owner: "buggy", description: "d" });
    note(C, `20k title POST -> ${big.status}`);
    const a = await session(browser, "buggy"); await search(a.page, `R05 ${TAG}`);
    const w = await a.page.evaluate(() => ({ table: document.querySelector("table").scrollWidth, box: document.querySelector("table").parentElement.clientWidth }));
    note(C, `table scrollWidth=${w.table} container=${w.box} -> ${w.table > w.box ? "REPRODUCES (layout)" : "layout fixed"}`);
    await search(a.page, `R05big ${TAG}`);
    const h = await a.page.evaluate(() => document.querySelector("tbody tr")?.getBoundingClientRect().height);
    note(C, `20k-title row height=${h}px`);
    await shot(a.page, "R05-long-title"); await a.ctx.close(); }

  if (run("R06")) { const C = "R06"; const a = await session(browser, "buggy"); await a.page.getByRole("button", { name: "New Bug" }).click(); await sleep(200);
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} R06 dup ${TAG}`); await d.locator("#bug-description").fill("dup");
    await a.page.evaluate(() => { const b = document.querySelector("[role=dialog] button[type=submit]"); b.click(); b.click(); });
    await sleep(1000);
    const n = (await api("GET", "/api/bugs")).json.filter((b) => b.title === `${P} R06 dup ${TAG}`).length;
    note(C, `two synchronous clicks created ${n} bugs -> ${n > 1 ? "REPRODUCES" : "fixed"}`); await a.ctx.close(); }

  if (run("R07")) { const C = "R07"; const r1 = await mkBug(`R07 ${TAG}`, { owner: "nobody-such-user" }); const r2 = await mkBug(`R07b ${TAG}`, { owner: "Buggy" });
    note(C, `owner nobody-such-user stored='${r1.owner}', 'Buggy' stored='${r2.owner}' -> ${r1.owner ? "still open" : "fixed"}`); }

  if (run("R08")) { const C = "R08"; const a = await session(browser, "buggy");
    await a.page.goto(BASE + "/board/1"); await sleep(500); note(C, `/board/1 -> ${a.page.url()} dialogs=${await a.page.getByRole("dialog").count()}`);
    await a.page.goto(BASE + "/board"); await a.page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await a.page.getByRole("button", { name: "New Bug" }).click(); await a.page.locator("#bug-title").fill("draft that will be lost");
    await a.page.goBack(); await sleep(500);
    note(C, `after Back with draft: url=${a.page.url()}`); await shot(a.page, "R08-back-with-modal");
    await a.page.goForward(); await sleep(500);
    note(C, `after Forward: dialogs=${await a.page.getByRole("dialog").count()} -> ${(await a.page.getByRole("dialog").count()) === 0 ? "draft lost, REPRODUCES" : "?"}`); await a.ctx.close(); }

  if (run("R09")) { const C = "R09"; const a = await session(browser, "buggy"); const pg = a.page;
    const res = [];
    for (let i = 0; i < 5; i++) {
      await pg.getByRole("button", { name: "New Bug" }).click(); await pg.locator("#bug-title").fill("OLD");
      await pg.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await pg.getByRole("dialog").getByRole("alert").waitFor();
      await pg.keyboard.press("Escape"); await pg.getByRole("dialog").waitFor({ state: "detached" });
      await pg.evaluate(() => {
        window.__f = [];
        new MutationObserver((ms, o) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches?.("[role=dialog]")) {
          const snap = (t) => ({ t, title: document.querySelector("#bug-title")?.value, alert: document.querySelector("[role=dialog] [role=alert]")?.innerText ?? null });
          window.__f.push(snap("mut")); requestAnimationFrame(() => window.__f.push(snap("raf1"))); o.disconnect(); } }).observe(document.body, { childList: true, subtree: true });
      });
      await pg.getByRole("button", { name: "New Bug" }).click(); await pg.keyboard.type("new");
      await sleep(150);
      res.push({ value: await pg.locator("#bug-title").inputValue(), frames: await pg.evaluate(() => window.__f) });
      await pg.keyboard.press("Escape"); await pg.getByRole("dialog").waitFor({ state: "detached" });
    }
    note(C, `reopen+type 'new' x5: ${JSON.stringify(res)}`);
    await a.ctx.close(); }

  if (run("R10")) { const C = "R10";
    // (a) Escape during Saving
    const bug = await mkBug(`R10d ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    await delay(pg, "**/api/bugs", "POST", 2500);
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.locator("#bug-title").fill(`${P} R10a ${TAG}`); await pg.locator("#bug-description").fill("d");
    await pg.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await sleep(300);
    await pg.keyboard.press("Escape"); await sleep(300);
    note(C, `(a) Escape during Saving: dialog still open=${(await pg.getByRole("dialog").count()) === 1} -> ${(await pg.getByRole("dialog").count()) === 1 ? "Escape path fixed" : "REPRODUCES"}`);
    await pg.getByRole("dialog").waitFor({ state: "detached", timeout: 6000 });
    // (d) Escape during Deleting
    await pg.unrouteAll({ behavior: "wait" });
    await delay(pg, `**/api/bugs/${bug.id}`, "DELETE", 2500);
    await search(pg, `R10d ${TAG}`); await openRow(pg, "R10d");
    await pg.getByRole("dialog", { name: EDIT }).getByRole("button", { name: "Delete" }).click();
    await pg.getByRole("dialog", { name: "Delete bug" }).getByRole("button", { name: "Delete" }).click(); await sleep(300);
    await pg.keyboard.press("Escape"); await sleep(300);
    note(C, `(d) Escape during Deleting: confirm still open=${(await pg.getByRole("dialog", { name: "Delete bug" }).count()) === 1}`);
    await sleep(3000); await a.ctx.close(); }

  if (run("R11")) { const C = "R11"; const A = await mkBug(`R11 A ${TAG}`); const B = await mkBug(`R11 B ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    await delay(pg, `**/api/bugs/${A.id}`, "GET", 1500);
    await search(pg, `R11 `); await search(pg, `R11 `);
    await pg.getByRole("button", { name: `${P} R11 A ${TAG}` }).click(); await sleep(100);
    await pg.getByRole("button", { name: `${P} R11 B ${TAG}` }).click();
    const d = pg.getByRole("dialog", { name: EDIT }); await d.waitFor();
    await d.locator("#edit-bug-description").fill("typed into B");
    await sleep(2000);
    const head = await pg.locator("#edit-bug-modal-title").innerText();
    note(C, `after A's late response: header='${head}' (B=#${B.id}) desc='${await d.locator("#edit-bug-description").inputValue()}' -> ${head.includes(String(B.id)) ? "fixed" : "REPRODUCES"}`);
    await shot(pg, "R11-after-late-A"); await a.ctx.close(); }

  if (run("R12")) { const C = "R12"; const a = await session(browser, "buggy"); const pg = a.page;
    await pg.route("**/api/bugs", (r) => r.request().method() === "GET" ? r.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : r.fallback());
    await pg.reload(); await sleep(800);
    note(C, `load 500: body shows 'Couldn't load bugs.'=${(await pg.locator("tbody").innerText()).includes("Couldn")} 'No bugs.'=${(await pg.locator("tbody").innerText()).includes("No bugs.")}`);
    await shot(pg, "R12-load-500");
    await pg.unrouteAll({ behavior: "wait" });
    const bug = await mkBug(`R12 row ${TAG}`);
    await pg.getByRole("button", { name: "Try again" }).click(); await sleep(800);
    await search(pg, `R12 row ${TAG}`);
    await pg.route(`**/api/bugs/${bug.id}`, (r) => r.request().method() === "GET" ? r.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : r.fallback());
    await openRow(pg, "R12 row"); await sleep(600);
    note(C, `row GET 500: dialogs=${await pg.getByRole("dialog").count()} status='${await pg.getByRole("status").innerText()}' visible message on page=${(await pg.locator("body").innerText()).includes("Couldn't open")}`);
    await shot(pg, "R12-row-open-500");
    await pg.unrouteAll({ behavior: "wait" });
    // POST ok, refresh 503
    let posted = false;
    await pg.route("**/api/bugs", async (r) => { if (r.request().method() === "POST") { posted = true; return r.fallback(); } if (posted) return r.fulfill({ status: 503, contentType: "application/json", body: "{}" }); return r.fallback(); });
    await search(pg, `R12 refresh ${TAG}`);
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.locator("#bug-title").fill(`${P} R12 refresh ${TAG}`); await pg.locator("#bug-description").fill("d");
    await pg.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await sleep(1000);
    note(C, `POST ok + refresh 503: dialogs=${await pg.getByRole("dialog").count()} tbody='${(await pg.locator("tbody").innerText()).slice(0, 80)}' status='${await pg.getByRole("status").innerText()}'`);
    await shot(pg, "R12-saved-refresh-503");
    await a.ctx.close(); }

  if (run("R13")) { const C = "R13"; await mkBug(`R13 Ünïcödé café ${TAG}`);
    const a = await session(browser, "buggy"); await search(a.page, `unicode cafe ${TAG}`); await sleep(200);
    const n1 = await row(a.page, "R13").count(); await search(a.page, `ünïcödé café ${TAG}`); await sleep(200);
    note(C, `'unicode cafe' rows=${n1}, exact accents rows=${await row(a.page, "R13").count()} -> ${n1 ? "folds" : "still no folding"}`); await a.ctx.close(); }
} finally { saveLog(`retest-${only.join("-") || "all"}`); await browser.close(); }
