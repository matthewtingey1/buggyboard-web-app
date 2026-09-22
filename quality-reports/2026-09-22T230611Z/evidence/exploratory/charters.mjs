// New charters for run 2026-09-22T230611Z. Usage: node charters.mjs n1 n2 ...
import { chromium, api, mkBug, session, search, row, openRow, shot, note, saveLog, sleep, delay, TAG, P, BASE } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
const EDIT = /Edit bug/;
const only = process.argv.slice(2);
const run = (id) => only.length === 0 || only.includes(id);
const find = async (title) => (await api("GET", "/api/bugs")).json.filter((b) => b.title === title);
const active = (pg) => pg.evaluate(() => { const e = document.activeElement; return `${e.tagName}${e.id ? "#" + e.id : ""} '${(e.textContent || e.value || "").trim().slice(0, 40)}'`; });
try {
  // N1: the header Close (x) button during Saving / Deleting
  if (run("n1")) { const C = "N1";
    const A = await mkBug(`N1c A ${TAG}`); const B = await mkBug(`N1c B ${TAG}`); const D = await mkBug(`N1d ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    // (a) late success closes the next draft
    await delay(pg, "**/api/bugs", "POST", 2500);
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.locator("#bug-title").fill(`${P} N1a first ${TAG}`); await pg.locator("#bug-description").fill("first");
    const dlg = pg.getByRole("dialog", { name: "Create bug" });
    await dlg.getByRole("button", { name: "Save" }).click(); await sleep(300);
    note(C, `(a) during Saving: Cancel disabled=${await dlg.getByRole("button", { name: "Cancel" }).isDisabled()} Close(x) disabled=${await dlg.getByRole("button", { name: "Close" }).isDisabled()}`);
    await dlg.getByRole("button", { name: "Close" }).click(); await sleep(200);
    note(C, `(a) after clicking Close(x) during Saving: dialogs=${await pg.getByRole("dialog").count()}`);
    await pg.getByRole("button", { name: "New Bug" }).click(); await sleep(100);
    await pg.locator("#bug-title").fill(`${P} N1a second draft ${TAG}`);
    await pg.locator("#bug-description").fill("half typed second bug");
    await shot(pg, "N1a-second-draft-before-late-response");
    await sleep(3000);
    note(C, `(a) after first POST returned: dialogs=${await pg.getByRole("dialog").count()} (second draft ${await pg.getByRole("dialog").count() ? "kept" : "DISCARDED"}); first saved=${(await find(`${P} N1a first ${TAG}`)).length}, second saved=${(await find(`${P} N1a second draft ${TAG}`)).length}`);
    await shot(pg, "N1a-second-draft-closed-by-first-response");
    // (b) late failure lands its error in the next draft
    await pg.unrouteAll({ behavior: "wait" });
    await delay(pg, "**/api/bugs", "POST", 2500, { status: 500, contentType: "application/json", body: JSON.stringify({ message: "Simulated server error" }) });
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.locator("#bug-title").fill(`${P} N1b ${TAG}`); await pg.locator("#bug-description").fill("b");
    await dlg.getByRole("button", { name: "Save" }).click(); await sleep(300);
    await dlg.getByRole("button", { name: "Close" }).click(); await sleep(200);
    await pg.getByRole("button", { name: "New Bug" }).click(); await sleep(100);
    await pg.locator("#bug-title").fill("unrelated new draft");
    await sleep(3000);
    note(C, `(b) failed save after Close(x): new draft alert='${await dlg.getByRole("alert").innerText().catch(() => "none")}' saved=${(await find(`${P} N1b ${TAG}`)).length}`);
    await shot(pg, "N1b-stale-error-in-new-draft");
    await pg.keyboard.press("Escape");
    // (c) edit: A's late PUT closes B
    await pg.unrouteAll({ behavior: "wait" });
    await delay(pg, `**/api/bugs/${A.id}`, "PUT", 2500);
    await search(pg, `N1c `); await pg.getByRole("button", { name: `${P} N1c A ${TAG}` }).click();
    const ed = pg.getByRole("dialog", { name: EDIT }); await ed.waitFor();
    await ed.locator("#edit-bug-description").fill("edit to A"); await ed.getByRole("button", { name: "Save" }).click(); await sleep(300);
    await ed.getByRole("button", { name: "Close" }).click(); await sleep(200);
    await pg.getByRole("button", { name: `${P} N1c B ${TAG}` }).click(); await ed.waitFor();
    await ed.locator("#edit-bug-description").fill("half typed edit to B");
    await sleep(3000);
    const bNow = (await api("GET", `/api/bugs/${B.id}`)).json;
    note(C, `(c) after A's PUT returned: dialogs=${await pg.getByRole("dialog").count()} B description on server='${bNow.description}' (typed edit ${await pg.getByRole("dialog").count() ? "kept" : "DISCARDED"})`);
    await shot(pg, "N1c-B-closed-by-A-response");
    // (d) confirm-delete Close(x) during Deleting
    await pg.unrouteAll({ behavior: "wait" });
    await delay(pg, `**/api/bugs/${D.id}`, "DELETE", 2500);
    await search(pg, `N1d ${TAG}`); await openRow(pg, "N1d"); await ed.waitFor();
    await ed.getByRole("button", { name: "Delete" }).click();
    const cf = pg.getByRole("dialog", { name: "Delete bug" });
    await cf.getByRole("button", { name: "Delete" }).click(); await sleep(300);
    note(C, `(d) during Deleting: confirm Cancel disabled=${await cf.getByRole("button", { name: "Cancel" }).isDisabled()} confirm Close(x) disabled=${await cf.getByRole("button", { name: "Close" }).isDisabled()}`);
    await cf.getByRole("button", { name: "Close" }).click(); await sleep(200);
    note(C, `(d) after Close(x): confirm open=${await cf.count()} edit modal open=${await ed.count()} title input enabled=${await ed.locator("#edit-bug-title").isEnabled().catch(() => "n/a")} edit Close(x) enabled=${await ed.getByRole("button", { name: "Close" }).isEnabled().catch(() => "n/a")}`);
    await shot(pg, "N1d-after-close-during-delete");
    await sleep(3000); await a.ctx.close(); }

  // N2: slow row open, then New Bug -> stacked dialogs
  if (run("n2")) { const C = "N2"; const A = await mkBug(`N2 slow ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    await delay(pg, `**/api/bugs/${A.id}`, "GET", 2000);
    await search(pg, `N2 slow ${TAG}`); await openRow(pg, "N2 slow"); await sleep(400);
    note(C, `400ms after slow row click: dialogs=${await pg.getByRole("dialog").count()} busy indicators=${await pg.locator("[aria-busy=true]").count()}`);
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.keyboard.type("my new bug title");
    await sleep(2200);
    const names = await pg.getByRole("dialog").evaluateAll((els) => els.map((e) => e.getAttribute("aria-labelledby")));
    note(C, `after slow GET returned: dialogs=${names.length} ${JSON.stringify(names)} focus=${await active(pg)}`);
    await pg.keyboard.type(" more");
    note(C, `create title after typing ' more'='${await pg.locator("#bug-title").inputValue()}' edit title='${await pg.locator("#edit-bug-title").inputValue().catch(() => "n/a")}'`);
    await shot(pg, "N2-edit-stacked-over-create");
    await pg.keyboard.press("Escape"); await sleep(300);
    note(C, `one Escape: dialogs left=${await pg.getByRole("dialog").count()}`);
    await shot(pg, "N2-after-one-escape");
    await a.ctx.close(); }

  // N3: out-of-order list refreshes
  if (run("n3")) { const C = "N3"; const Y = await mkBug(`N3 delete-me ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    await search(pg, `N3 `);
    let afterPost = false; let delayed = false;
    await pg.route("**/api/bugs", async (r) => {
      const m = r.request().method();
      if (m === "POST") { afterPost = true; return r.fallback(); }
      if (m === "GET" && afterPost && !delayed) { delayed = true; const res = await r.fetch(); await sleep(3000); return r.fulfill({ response: res }); }
      return r.fallback();
    });
    await pg.getByRole("button", { name: "New Bug" }).click();
    await pg.locator("#bug-title").fill(`${P} N3 created ${TAG}`); await pg.locator("#bug-description").fill("x");
    await pg.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await pg.getByRole("dialog").waitFor({ state: "detached" });
    await openRow(pg, "N3 delete-me"); const ed = pg.getByRole("dialog", { name: EDIT }); await ed.waitFor();
    await ed.getByRole("button", { name: "Delete" }).click(); await pg.getByRole("dialog", { name: "Delete bug" }).getByRole("button", { name: "Delete" }).click();
    await ed.waitFor({ state: "detached" }); await sleep(400);
    note(C, `right after delete: rows=${JSON.stringify(await pg.locator("tbody tr").allInnerTexts())}`);
    await sleep(3200);
    const rows = await pg.locator("tbody tr").allInnerTexts();
    note(C, `after the slow post-create refresh landed: rows=${JSON.stringify(rows)}; server has deleted bug=${(await api("GET", `/api/bugs/${Y.id}`)).status}`);
    await shot(pg, "N3-deleted-bug-reappears");
    if (rows.some((t) => t.includes("delete-me"))) { await openRow(pg, "N3 delete-me"); await sleep(600);
      note(C, `click resurrected row: dialogs=${await pg.getByRole("dialog").count()} status='${await pg.getByRole("status").innerText()}' row left=${await row(pg, "delete-me").count()}`); }
    await a.ctx.close(); }

  // N4: login lockout as a third party (throwaway usernames only)
  if (run("n4")) { const C = "N4"; const rnd = Math.random().toString(36).slice(2, 8);
    const victim = `probe-exploratory-${rnd}`; const variant = victim.toUpperCase();
    const t0 = Date.now(); const codes = [];
    for (let i = 0; i < 20; i++) codes.push((await api("POST", "/api/login", { username: i % 2 ? variant : `  ${victim.replace("p", "P")} `, password: "wrong" })).status);
    note(C, `20 failed logins using case/space variants of '${victim}' took ${Date.now() - t0}ms: ${codes.join(",")}`);
    const lower = await api("POST", "/api/login", { username: victim, password: "any" + "thing" });
    note(C, `exact username '${victim}' afterwards -> ${lower.status} ${JSON.stringify(lower.json)}`);
    const pw = await api("POST", "/api/login", { username: victim, password: "" });
    note(C, `blank password for locked user -> ${pw.status} ${JSON.stringify(pw.json)}`);
    // UI view of a locked account
    const ctx = await browser.newContext(); const pg = await ctx.newPage(); await pg.goto(BASE + "/login");
    await pg.fill("#username", victim); await pg.fill("#password", "whatever"); await pg.getByRole("button", { name: "Login" }).click(); await sleep(600);
    note(C, `UI for locked user: alert='${await pg.getByRole("alert").innerText().catch(() => "none")}' focus=${await active(pg)} username aria-invalid=${await pg.locator("#username").getAttribute("aria-invalid")}`);
    await shot(pg, "N4-locked-login-ui");
    // Case-sensitive login vs case-folded counter: one wrong-case attempt for buggy with the right password.
    const { pass } = await import("./lib.mjs");
    const cap = await api("POST", "/api/login", { username: "Buggy", password: pass("buggy") });
    note(C, `'Buggy' + buggy's correct password (<redacted>) -> ${cap.status} ${JSON.stringify(cap.json)}`);
    const ok = await api("POST", "/api/login", { username: "buggy", password: pass("buggy") });
    note(C, `'buggy' + correct password -> ${ok.status} (resets buggy's counter)`);
    note(C, `login input autocapitalize=${await pg.locator("#username").getAttribute("autocapitalize")} autocorrect=${await pg.locator("#username").getAttribute("autocorrect")} spellcheck=${await pg.locator("#username").getAttribute("spellcheck")}`);
    await ctx.close(); }

  // N5: two tabs, user switch and in-flight work
  if (run("n5")) { const C = "N5"; const a = await session(browser, "buggy"); const t1 = a.page; const t2 = await a.ctx.newPage();
    await t2.goto(BASE + "/board"); await t2.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await t2.getByRole("button", { name: "New Bug" }).click(); await t2.locator("#bug-title").fill(`${P} N5 draft ${TAG}`); await t2.locator("#bug-description").fill("long careful write-up in tab 2");
    await t1.getByRole("button", { name: "Logout" }).click(); await t1.waitForURL("**/login"); await sleep(500);
    note(C, `tab2 with a typed draft after tab1 logout: url=${t2.url()} dialogs=${await t2.getByRole("dialog").count()} (no warning; draft gone)`);
    await t1.fill("#username", "vanny"); await t1.fill("#password", (await import("./lib.mjs")).pass("vanny")); await t1.getByRole("button", { name: "Login" }).click(); await t1.waitForURL("**/board"); await sleep(600);
    note(C, `tab1 logs in as vanny: tab2 url=${t2.url()}`);
    if (t2.url().includes("/board")) { await t2.getByRole("button", { name: "New Bug" }).click(); note(C, `tab2 New Bug owner default='${await t2.locator("#bug-owner").inputValue()}'`); await t2.keyboard.press("Escape"); }
    await shot(t2, "N5-tab2-after-user-switch");
    // in-flight save in tab2 when tab1 logs out
    await delay(t2, "**/api/bugs", "POST", 2000);
    await t2.getByRole("button", { name: "New Bug" }).click(); await t2.locator("#bug-title").fill(`${P} N5 inflight ${TAG}`); await t2.locator("#bug-description").fill("x");
    await t2.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await sleep(300);
    await t1.getByRole("button", { name: "Logout" }).click(); await sleep(2500);
    const saved = await find(`${P} N5 inflight ${TAG}`);
    note(C, `save pending in tab2 when tab1 logged out: tab2 url=${t2.url()} bug created=${saved.length} owner=${saved[0]?.owner}; any message in tab2=${await t2.getByRole("alert").count()}`);
    await a.ctx.close(); }

  // N6: focus and keyboard with the new title buttons and dialogs
  if (run("n6")) { const C = "N6"; const E = await mkBug(`N6 edit ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page;
    // (a) same-task close+reopen vs the deferred focus return
    const r = await pg.evaluate(async () => {
      const nb = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "New Bug");
      nb.focus(); nb.click(); await new Promise((s) => setTimeout(s, 50));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await new Promise((s) => requestAnimationFrame(() => s()));
      nb.click(); await new Promise((s) => setTimeout(s, 100));
      const e = document.activeElement; return { dialogOpen: !!document.querySelector("[role=dialog]"), focus: `${e.tagName}#${e.id} ${e.textContent.trim().slice(0, 20)}` };
    });
    note(C, `(a) Escape then reopen within one frame: ${JSON.stringify(r)}`);
    await pg.keyboard.press("Escape"); await sleep(100);
    // (a2) realistic: keyboard Escape then Enter on New Bug
    await pg.getByRole("button", { name: "New Bug" }).focus(); await pg.keyboard.press("Enter"); await pg.keyboard.press("Escape"); await pg.keyboard.press("Enter"); await sleep(100);
    note(C, `(a2) keyboard Enter,Escape,Enter: dialogs=${await pg.getByRole("dialog").count()} focus=${await active(pg)}`);
    await pg.keyboard.press("Escape"); await sleep(100);
    // (b) Enter held on New Bug
    await pg.getByRole("button", { name: "New Bug" }).focus(); await pg.keyboard.down("Enter"); await sleep(50); await pg.keyboard.down("Enter"); await pg.keyboard.down("Enter"); await pg.keyboard.up("Enter"); await sleep(200);
    note(C, `(b) Enter held on New Bug: dialogs=${await pg.getByRole("dialog").count()} alert='${await pg.getByRole("dialog").getByRole("alert").innerText().catch(() => "none")}' title aria-invalid=${await pg.locator("#bug-title").getAttribute("aria-invalid")}`);
    await shot(pg, "N6b-enter-held-on-new-bug");
    await pg.keyboard.press("Escape"); await sleep(100);
    // (c) keyboard to title button, Enter held
    await search(pg, `N6 edit ${TAG}`);
    let gets = 0; pg.on("request", (q) => { if (q.url().includes(`/api/bugs/${E.id}`) && q.method() === "GET") gets++; });
    await pg.getByRole("button", { name: `${P} N6 edit ${TAG}` }).focus();
    await pg.keyboard.down("Enter"); await pg.keyboard.down("Enter"); await pg.keyboard.down("Enter"); await pg.keyboard.up("Enter"); await sleep(400);
    note(C, `(c) Enter held on title button: GETs=${gets} dialogs=${await pg.getByRole("dialog").count()} focus=${await active(pg)}`);
    // (d) focus return after edit save that keeps the row, and after a save that filters it out
    const ed = pg.getByRole("dialog", { name: EDIT });
    await ed.locator("#edit-bug-description").fill("changed"); await ed.getByRole("button", { name: "Save" }).click(); await ed.waitFor({ state: "detached" }); await sleep(200);
    note(C, `(d) after Save (row stays): focus=${await active(pg)}`);
    await pg.getByRole("button", { name: `${P} N6 edit ${TAG}` }).click(); await ed.waitFor();
    await ed.locator("#edit-bug-state").selectOption("closed"); await ed.getByRole("button", { name: "Save" }).click(); await ed.waitFor({ state: "detached" }); await sleep(200);
    note(C, `(d) after Save that closes the bug (row leaves Open view): focus=${await active(pg)}`);
    // (e) delete confirm cancel -> focus
    await pg.getByRole("button", { name: "Closed", exact: true }).click();
    await pg.getByRole("button", { name: `${P} N6 edit ${TAG}` }).click(); await ed.waitFor();
    await ed.getByRole("button", { name: "Delete" }).click(); await sleep(100);
    note(C, `(e) confirm opened: focus=${await active(pg)}`);
    await pg.keyboard.press("Escape"); await sleep(100);
    note(C, `(e) Escape on confirm: confirm open=${await pg.getByRole("dialog", { name: "Delete bug" }).count()} edit open=${await ed.count()} focus=${await active(pg)}`);
    // Tab trap in edit with Save disabled
    const seen = []; for (let i = 0; i < 12; i++) { await pg.keyboard.press("Tab"); seen.push(await pg.evaluate(() => !!document.activeElement.closest("[role=dialog]"))); }
    note(C, `(f) 12 Tabs inside unchanged edit modal all inside dialog=${seen.every(Boolean)}`);
    await pg.keyboard.press("Escape"); await sleep(100);
    // (g) Try again by keyboard
    await pg.route("**/api/bugs", (q) => q.request().method() === "GET" ? q.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : q.fallback());
    await pg.reload(); await pg.getByRole("button", { name: "Try again" }).waitFor();
    await pg.getByRole("button", { name: "Try again" }).focus(); await pg.keyboard.press("Enter"); await sleep(400);
    note(C, `(g) Try again (still failing): focus=${await active(pg)}`);
    await pg.unrouteAll({ behavior: "wait" });
    await pg.getByRole("button", { name: "Try again" }).focus(); await pg.keyboard.press("Enter"); await sleep(500);
    note(C, `(g) Try again (recovers): focus=${await active(pg)} rows=${await pg.locator("tbody tr").count()}`);
    // (h) Try again double-press while loading
    await a.ctx.close(); }

  // N7: row padding vs title button, text selection, header wrap
  if (run("n7")) { const C = "N7"; await mkBug(`N7 select this title to copy ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page; await search(pg, `N7 select this title to copy ${TAG}`);
    const r = row(pg, "N7");
    for (const [label, sel] of [["ID cell", "td:nth-child(1)"], ["owner cell", "td:nth-child(4)"], ["title cell padding (right of text)", "td:nth-child(3)"]]) {
      const box = await r.locator(sel).boundingBox();
      await pg.mouse.click(box.x + box.width - 6, box.y + box.height / 2); await sleep(400);
      note(C, `click ${label}: dialog opened=${(await pg.getByRole("dialog").count()) === 1}`); await pg.keyboard.press("Escape"); await sleep(150);
    }
    const tb = await r.getByRole("button").boundingBox();
    await pg.mouse.move(tb.x + 3, tb.y + tb.height / 2); await pg.mouse.down(); await pg.mouse.move(tb.x + tb.width - 3, tb.y + tb.height / 2, { steps: 8 }); await pg.mouse.up(); await sleep(400);
    note(C, `drag-select across title: selection='${await pg.evaluate(() => String(getSelection()))}' dialog opened=${(await pg.getByRole("dialog").count()) === 1}`);
    await shot(pg, "N7-drag-select-title"); await pg.keyboard.press("Escape"); await sleep(150);
    const rb = await r.boundingBox(); const idb = await r.locator("td:nth-child(1)").boundingBox();
    await pg.mouse.move(idb.x + 2, idb.y + idb.height / 2); await pg.mouse.down(); await pg.mouse.move(rb.x + rb.width - 2, rb.y + rb.height / 2, { steps: 8 }); await pg.mouse.up(); await sleep(400);
    note(C, `drag-select across whole row: selection='${await pg.evaluate(() => String(getSelection()).replace(/\s+/g, " "))}' dialog opened=${(await pg.getByRole("dialog").count()) === 1}`);
    await pg.keyboard.press("Escape"); await sleep(150);
    for (const w of [375, 320]) { await pg.setViewportSize({ width: w, height: 700 });
      const m = await pg.evaluate(() => ({ doc: document.documentElement.scrollWidth, header: document.querySelector("header").scrollWidth, logoutRight: [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Logout").getBoundingClientRect().right }));
      note(C, `viewport ${w}: ${JSON.stringify(m)}`); await shot(pg, `N7-header-${w}`); }
    await a.ctx.close(); }

  // N8: one-line titles and invisible characters through the edit form
  if (run("n8")) { const C = "N8";
    const ml = await api("POST", "/api/bugs", { title: `${P} N8 line one\r\n\n  line two ${TAG}`, severity: "low", owner: "buggy", description: "a\nb" });
    note(C, `multi-line title POST -> ${ml.status} stored='${JSON.stringify(ml.json.title)}' description=${JSON.stringify(ml.json.description)}`);
    const zw = await mkBug(`N8 zw ${TAG}`);
    const a = await session(browser, "buggy"); const pg = a.page; await search(pg, `N8 zw ${TAG}`); await openRow(pg, "N8 zw");
    const ed = pg.getByRole("dialog", { name: EDIT }); await ed.waitFor();
    await ed.locator("#edit-bug-title").fill("​"); await sleep(100);
    note(C, `edit title to a zero-width space: Save enabled=${await ed.getByRole("button", { name: "Save" }).isEnabled()}`);
    await ed.getByRole("button", { name: "Save" }).click().catch(() => {}); await sleep(600);
    note(C, `after Save: alert='${await ed.getByRole("alert").innerText().catch(() => "none")}' server title='${(await api("GET", `/api/bugs/${zw.id}`)).json.title}'`);
    await shot(pg, "N8-zero-width-title-edit");
    await ed.locator("#edit-bug-title").fill("   "); await sleep(100);
    note(C, `edit title to spaces: Save enabled=${await ed.getByRole("button", { name: "Save" }).isEnabled()} (create modal shows 'Title is required.' on submit; edit gives no message)`);
    await a.ctx.close(); }
} finally { saveLog(`charters-${only.join("-") || "all"}`); await browser.close(); }
