// Re-test previous run's exploratory-01..08 and the lead's P-1.
import { chromium, api, mkBug, session, search, row, shot, note, saveLog, sleep, TAG, P, BASE } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
const EDIT = /Edit bug/;
try {
  // R01 lost update
  { const C = "R01"; const bug = await mkBug(`R01 lost-update ${TAG}`);
    const a = await session(browser, "buggy"); const b = await session(browser, "vanny");
    for (const s of [a, b]) { await search(s.page, `R01 lost-update ${TAG}`); await row(s.page, "R01").click(); await s.page.getByRole("dialog", { name: EDIT }).waitFor(); }
    const da = a.page.getByRole("dialog", { name: EDIT });
    await da.locator("#edit-bug-state").selectOption("closed"); await da.getByRole("button", { name: "Save" }).click(); await da.waitFor({ state: "detached" });
    note(C, `after buggy close: state=${(await api("GET", `/api/bugs/${bug.id}`)).json.state}`);
    const db = b.page.getByRole("dialog", { name: EDIT });
    await db.locator("#edit-bug-description").fill("vanny edit"); await db.getByRole("button", { name: "Save" }).click(); await db.waitFor({ state: "detached" });
    const after = (await api("GET", `/api/bugs/${bug.id}`)).json;
    note(C, `after vanny description save: state=${after.state} description=${after.description} -> ${after.state === "OPEN" ? "REPRODUCES" : "fixed"}`);
    await shot(b.page, "R01-after-stale-save"); await a.ctx.close(); await b.ctx.close(); }

  // R02 deleted elsewhere
  { const C = "R02"; const bug = await mkBug(`R02 del-elsewhere ${TAG}`);
    const b = await session(browser, "vanny"); await search(b.page, `R02 del-elsewhere ${TAG}`);
    await row(b.page, "R02").click(); const d = b.page.getByRole("dialog", { name: EDIT }); await d.waitFor();
    await api("DELETE", `/api/bugs/${bug.id}`);
    await d.locator("#edit-bug-description").fill("after delete"); await d.getByRole("button", { name: "Save" }).click(); await sleep(700);
    note(C, `save after delete: modal open=${await d.isVisible()} text has 'Bug not found.'=${(await d.innerText()).includes("Bug not found.")}`);
    await shot(b.page, "R02-save-after-delete");
    await d.getByRole("button", { name: "Cancel" }).click();
    const stale = await row(b.page, "R02").count(); note(C, `stale row after Cancel: ${stale}`);
    if (stale) { await row(b.page, "R02").click(); await sleep(600); note(C, `click stale row opens dialog: ${(await b.page.getByRole("dialog").count()) > 0}`); }
    await b.ctx.close(); }

  // R03 multi-tab logout
  { const C = "R03"; const a = await session(browser, "buggy"); const t2 = await a.ctx.newPage();
    await t2.goto(BASE + "/board"); await t2.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await a.page.getByRole("button", { name: /log ?out/i }).click(); await a.page.waitForURL("**/login");
    await sleep(500);
    note(C, `tab2 URL after tab1 logout: ${t2.url()}; localStorage user=${await t2.evaluate(() => localStorage.getItem("buggyboard_user"))}`);
    await t2.getByRole("button", { name: "New Bug" }).click();
    const own = await t2.locator("#bug-owner").inputValue();
    note(C, `tab2 New Bug still opens, owner prefilled='${own}' -> ${t2.url().includes("/board") ? "REPRODUCES" : "fixed"}`);
    await shot(t2, "R03-tab2-after-logout"); await a.ctx.close(); }

  // R04 413 HTML body
  { const C = "R04"; const r = await api("POST", "/api/bugs", { title: `${P} R04 ${TAG}`, severity: "high", owner: "buggy", description: "x".repeat(120000) });
    note(C, `120k description -> ${r.status}, body JSON? ${typeof r.json === "object"} (${JSON.stringify(r.json).slice(0, 80)})`);
    const a = await session(browser, "buggy"); await a.page.getByRole("button", { name: "New Bug" }).click();
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} R04 ui ${TAG}`); await d.locator("#bug-description").fill("y".repeat(120000));
    await d.getByRole("button", { name: "Save" }).click(); await sleep(800);
    note(C, `UI alert: '${await d.getByRole("alert").innerText().catch(() => "none")}'`); await shot(a.page, "R04-create-413"); await a.ctx.close(); }

  // R05 long unbroken title
  { const C = "R05"; const r = await mkBug(`R05 ${TAG} ` + "X".repeat(400));
    const big = await api("POST", "/api/bugs", { title: `${P} R05big ${TAG} ` + "Y".repeat(20000), severity: "low", owner: "buggy", description: "d" });
    note(C, `20k title POST -> ${big.status}`);
    const a = await session(browser, "buggy"); await search(a.page, `R05 ${TAG}`);
    const w = await a.page.evaluate(() => ({ table: document.querySelector("table").scrollWidth, box: document.querySelector("table").parentElement.clientWidth }));
    note(C, `table scrollWidth=${w.table} container=${w.box} -> ${w.table > w.box ? "REPRODUCES" : "fixed"}`);
    await shot(a.page, "R05-long-title"); await a.ctx.close(); }

  // R06 double submit
  { const C = "R06"; const a = await session(browser, "buggy"); await a.page.getByRole("button", { name: "New Bug" }).click();
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} R06 dup ${TAG}`); await d.locator("#bug-description").fill("dup");
    await a.page.evaluate(() => { const b = document.querySelector("[role=dialog] button[type=submit]"); b.click(); b.click(); });
    await sleep(1000);
    const n = (await api("GET", "/api/bugs")).json.filter((b) => b.title === `${P} R06 dup ${TAG}`).length;
    note(C, `two synchronous clicks created ${n} bugs -> ${n > 1 ? "REPRODUCES" : "fixed"}`); await a.ctx.close(); }

  // R07 owner free text
  { const C = "R07"; const r1 = await mkBug(`R07 ${TAG}`, { owner: "nobody-such-user" }); const r2 = await mkBug(`R07b ${TAG}`, { owner: "Buggy" });
    note(C, `owner nobody-such-user stored='${r1.owner}', 'Buggy' stored='${r2.owner}' -> ${r1.owner ? "REPRODUCES" : "fixed"}`); }

  // R08 Back with modal open, deep link
  { const C = "R08"; const a = await session(browser, "buggy");
    await a.page.goto(BASE + "/board/1"); await sleep(500); note(C, `/board/1 -> ${a.page.url()} dialogs=${await a.page.getByRole("dialog").count()}`);
    await a.page.goto(BASE + "/board"); await a.page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await a.page.getByRole("button", { name: "New Bug" }).click(); await a.page.locator("#bug-title").fill("draft that will be lost");
    await a.page.goBack(); await sleep(500);
    note(C, `after Back with draft: url=${a.page.url()}`); await shot(a.page, "R08-back-with-modal");
    await a.page.goForward(); await sleep(500);
    note(C, `after Forward: dialogs=${await a.page.getByRole("dialog").count()} -> draft lost`); await a.ctx.close(); }

  // P-1: first-frame contents on reopen
  { const C = "P1"; const a = await session(browser, "buggy"); const pg = a.page;
    await pg.evaluate(() => {
      window.__frames = [];
      new MutationObserver((muts) => {
        for (const m of muts) for (const n of m.addedNodes) {
          if (n.nodeType === 1 && n.matches?.('[role=dialog]') && n.querySelector('#bug-title')) {
            const snap = (tag) => ({ tag, title: document.querySelector('#bug-title')?.value, alert: document.querySelector('[role=dialog] [role=alert]')?.innerText ?? null });
            window.__frames.push(snap('mutation'));
            requestAnimationFrame(() => { window.__frames.push(snap('rAF-before-first-paint')); requestAnimationFrame(() => window.__frames.push(snap('rAF-2'))); });
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    });
    for (const how of ["click", "keyboard"]) {
      await pg.evaluate(() => (window.__frames = []));
      // leave a draft and an error
      if (how === "click") await pg.getByRole("button", { name: "New Bug" }).click();
      else { await pg.getByRole("button", { name: "New Bug" }).focus(); await pg.keyboard.press("Enter"); }
      await pg.locator("#bug-title").fill("previous draft");
      await pg.getByRole("dialog").getByRole("button", { name: "Save" }).click(); // owner prefilled, description blank -> error
      await pg.getByRole("dialog").getByRole("alert").waitFor();
      await pg.keyboard.press("Escape");
      await pg.evaluate(() => (window.__frames = []));
      if (how === "click") await pg.getByRole("button", { name: "New Bug" }).click();
      else { await pg.getByRole("button", { name: "New Bug" }).focus(); await pg.keyboard.press("Enter"); }
      await sleep(200);
      note(C, `${how} reopen frames: ${JSON.stringify(await pg.evaluate(() => window.__frames))}`);
      await pg.keyboard.press("Escape");
    }
    // Typing in the same task as the open (fast typist / scanner / autofill)
    await pg.evaluate(() => (window.__frames = []));
    await pg.getByRole("button", { name: "New Bug" }).click(); await pg.locator("#bug-title").fill("previous draft"); await pg.keyboard.press("Escape");
    const lost = await pg.evaluate(async () => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "New Bug");
      btn.click();
      const r = await new Promise((res) => requestAnimationFrame(() => {
        const el = document.querySelector("#bug-title");
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        const before = el.value;
        setter.call(el, "typed-in-first-frame"); el.dispatchEvent(new Event("input", { bubbles: true }));
        res(before);
      }));
      await new Promise((res) => setTimeout(res, 300));
      return { valueAtFirstFrame: r, valueAfterSettle: document.querySelector("#bug-title").value };
    });
    note(C, `type during first frame: ${JSON.stringify(lost)}`);
    await shot(pg, "P1-after-first-frame-typing");
    await a.ctx.close(); }
} finally { saveLog("retest"); await browser.close(); }
