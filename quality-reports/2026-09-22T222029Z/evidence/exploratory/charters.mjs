// New charters N1..N7. Run: node charters.mjs n1 n2 ...
import { chromium, api, mkBug, session, search, row, shot, note, saveLog, sleep, TAG, P, BASE } from "./lib.mjs";
const EDIT = /Edit bug/;
// Server handles the request at once; the response reaches the page late (slow downlink).
async function slowResponse(page, glob, method, ms, override) {
  await page.route(glob, async (route) => {
    if (route.request().method() !== method) return route.fallback();
    const resp = await route.fetch();
    await sleep(ms);
    if (override) return route.fulfill(override);
    await route.fulfill({ response: resp });
  });
}
async function openCreate(page) { await page.getByRole("button", { name: "New Bug", exact: true }).click(); await sleep(150); return page.getByRole("dialog", { name: "Create bug" }); }
const byTitle = async (t) => (await api("GET", "/api/bugs")).json.filter((b) => b.title === t);

const charters = {
  async n1(browser) { // slow network during save/delete; Escape while pending
    const C = "N1";
    { const a = await session(browser); await slowResponse(a.page, "**/api/bugs", "POST", 2500);
      let d = await openCreate(a.page); const t1 = `${P} N1a first ${TAG}`;
      await d.locator("#bug-title").fill(t1); await d.locator("#bug-description").fill("slow save");
      await d.getByRole("button", { name: "Save" }).click(); await sleep(300);
      note(C, `a) during pending POST: button='${await d.locator("button[type=submit]").innerText()}', Cancel disabled=${await d.getByRole("button", { name: "Cancel" }).isDisabled()}`);
      await a.page.keyboard.press("Escape"); await sleep(200);
      note(C, `a) Escape while saving closes modal: ${(await a.page.getByRole("dialog").count()) === 0}`);
      d = await openCreate(a.page); await d.locator("#bug-title").fill("second draft being typed"); await d.locator("#bug-description").fill("half written");
      await shot(a.page, "N1a-second-draft-before-first-response");
      await sleep(2800);
      note(C, `a) after first POST resolves: second-draft modal still open=${(await a.page.getByRole("dialog").count()) > 0}; first bug saved=${(await byTitle(t1)).length}`);
      await shot(a.page, "N1a-second-draft-closed-by-first-response");
      await a.ctx.close(); }
    { const a = await session(browser); await slowResponse(a.page, "**/api/bugs", "POST", 1500, { status: 500, contentType: "application/json", body: JSON.stringify({ error: "x", message: "Simulated server error" }) });
      // Server still gets it via route.fetch, so use a title the backend rejects instead: blank-after-trim is blocked client-side, so rely on override only.
      await a.page.unroute("**/api/bugs");
      await a.page.route("**/api/bugs", async (r) => { if (r.request().method() !== "POST") return r.fallback(); await sleep(1500); await r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "server_error", message: "Simulated server error" }) }); });
      const d = await openCreate(a.page); await d.locator("#bug-title").fill(`${P} N1b never saved ${TAG}`); await d.locator("#bug-description").fill("lost");
      await d.getByRole("button", { name: "Save" }).click(); await sleep(200); await a.page.keyboard.press("Escape");
      await sleep(1800);
      note(C, `b) Escape during pending POST that then fails: dialog visible=${(await a.page.getByRole("dialog").count()) > 0}, any alert on page=${await a.page.getByRole("alert").count()}, bug exists=${(await byTitle(`${P} N1b never saved ${TAG}`)).length}`);
      await shot(a.page, "N1b-failed-save-after-escape-silent");
      // reopen during pending failure
      const d2 = await openCreate(a.page); await d2.locator("#bug-title").fill(`${P} N1b first ${TAG}`); await d2.locator("#bug-description").fill("x");
      await d2.getByRole("button", { name: "Save" }).click(); await sleep(200); await a.page.keyboard.press("Escape");
      const d3 = await openCreate(a.page); await d3.locator("#bug-title").fill("unrelated new draft"); await sleep(1800);
      note(C, `b) reopened modal after failed first save shows alert='${await d3.getByRole("alert").innerText().catch(() => "none")}', title='${await d3.locator("#bug-title").inputValue()}'`);
      await shot(a.page, "N1b-stale-error-in-new-draft");
      await a.ctx.close(); }
    { const A = await mkBug(`N1c bugA ${TAG}`); const B = await mkBug(`N1c bugB ${TAG}`);
      const a = await session(browser); await slowResponse(a.page, `**/api/bugs/${A.id}`, "PUT", 2500);
      await search(a.page, `N1c bug`); await row(a.page, "bugA").click(); let d = a.page.getByRole("dialog", { name: EDIT }); await d.waitFor();
      await d.locator("#edit-bug-description").fill("A edited slowly"); await d.getByRole("button", { name: "Save" }).click(); await sleep(200);
      await a.page.keyboard.press("Escape"); await sleep(200);
      note(C, `c) Escape during pending PUT closes edit modal: ${(await a.page.getByRole("dialog").count()) === 0}`);
      await row(a.page, "bugB").click(); d = a.page.getByRole("dialog", { name: EDIT }); await d.waitFor();
      await d.locator("#edit-bug-description").fill("B edit in progress");
      await sleep(2800);
      note(C, `c) after A's PUT resolves: B's edit modal still open=${(await a.page.getByRole("dialog").count()) > 0}; B description on server='${(await api("GET", `/api/bugs/${B.id}`)).json.description}'`);
      await shot(a.page, "N1c-B-modal-closed-by-A-response");
      await a.ctx.close(); }
    { const A = await mkBug(`N1d del ${TAG}`); const a = await session(browser); await slowResponse(a.page, `**/api/bugs/${A.id}`, "DELETE", 2500);
      await search(a.page, `N1d del ${TAG}`); await row(a.page, "N1d").click(); const d = a.page.getByRole("dialog", { name: EDIT }); await d.waitFor();
      await d.getByRole("button", { name: "Delete", exact: true }).click(); const cf = a.page.getByRole("dialog", { name: "Delete bug" });
      await cf.getByRole("button", { name: "Delete", exact: true }).click(); await sleep(200);
      note(C, `d) during pending DELETE: confirm label='${await cf.getByRole("button", { name: /Delet/ }).innerText()}'`);
      await a.page.keyboard.press("Escape"); await sleep(150);
      note(C, `d) Escape #1 during pending DELETE: confirm open=${await cf.isVisible()}, edit open=${await d.isVisible()}, edit fields enabled=${await d.locator("#edit-bug-title").isEnabled()}`);
      await shot(a.page, "N1d-pending-delete-after-escape");
      await d.locator("#edit-bug-title").fill(`${P} N1d renamed while deleting ${TAG}`).catch((e) => note(C, "fill failed " + e.message.slice(0, 60)));
      const saveEnabled = await d.getByRole("button", { name: "Save" }).isEnabled();
      note(C, `d) while delete pending, user could edit title; Save enabled=${saveEnabled}`);
      await sleep(2800);
      note(C, `d) after DELETE resolves: dialogs=${await a.page.getByRole("dialog").count()}, bug GET=${(await api("GET", `/api/bugs/${A.id}`)).status}`);
      await a.ctx.close(); }
  },

  async n2(browser) { // out-of-order responses: row clicks
    const C = "N2"; const A = await mkBug(`N2 slowA ${TAG}`); const B = await mkBug(`N2 fastB ${TAG}`);
    const a = await session(browser); await slowResponse(a.page, `**/api/bugs/${A.id}`, "GET", 1500);
    await search(a.page, `N2 `); await search(a.page, TAG);
    await row(a.page, "slowA").click(); await sleep(100); await row(a.page, "fastB").click().catch((e) => note(C, "second click blocked: " + e.message.slice(0, 80)));
    await a.page.getByRole("dialog", { name: EDIT }).waitFor();
    note(C, `first dialog to open: '${await a.page.locator("#edit-bug-modal-title").innerText()}' (B=#${B.id})`);
    await a.page.locator("#edit-bug-description").fill("typed into B");
    await sleep(1800);
    const title = await a.page.locator("#edit-bug-modal-title").innerText().catch(() => "none");
    note(C, `after A's slow GET arrives: dialog='${title}', description field='${await a.page.locator("#edit-bug-description").inputValue().catch(() => "")}'`);
    await shot(a.page, "N2-modal-swapped-to-A");
    // No feedback between click and slow modal
    await a.page.keyboard.press("Escape"); await sleep(200);
    await row(a.page, "slowA").click(); await sleep(700);
    note(C, `700ms after clicking a slow row: dialogs=${await a.page.getByRole("dialog").count()}, busy indicator=${await a.page.locator("[aria-busy=true]").count()}`);
    await shot(a.page, "N2-slow-row-no-feedback");
    await a.ctx.close();
  },

  async n3(browser) { // keyboard only
    const C = "N3"; const a = await session(browser); const pg = a.page; const k = pg.keyboard;
    const active = () => pg.evaluate(() => { const e = document.activeElement; return `${e.tagName}${e.id ? "#" + e.id : ""} '${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30)}'`; });
    const tabsTo = async (pred, max = 30) => { for (let i = 1; i <= max; i++) { await k.press("Tab"); if (await pred()) return i; } return -1; };
    const n = await tabsTo(async () => (await active()).includes("New Bug"));
    note(C, `Tabs from page load to New Bug: ${n}`);
    await k.press("Enter"); await sleep(150); note(C, `focus after open create: ${await active()}`);
    const t = `${P} N3 keyboard ${TAG}`;
    await k.type(t); await k.press("Tab"); await k.press("ArrowDown"); note(C, `severity after ArrowDown: ${await pg.locator("#bug-severity").inputValue()}`);
    await k.press("Tab"); await k.press("Tab"); await k.type("typed with keyboard only");
    await k.press("Tab"); await k.press("Tab"); note(C, `focus before submit: ${await active()}`); await k.press("Enter"); await sleep(600);
    note(C, `created: ${(await byTitle(t)).length}; focus after create closes: ${await active()}`);
    await shot(pg, "N3-after-create-focus");
    await search(pg, `N3 keyboard ${TAG}`); await sleep(100);
    const m = await tabsTo(async () => (await active()).startsWith("TR"));
    note(C, `Tabs from search box to first row: ${m}`);
    await k.press("Enter"); await sleep(400); note(C, `edit open=${await pg.getByRole("dialog", { name: EDIT }).count()}, focus=${await active()}`);
    await k.press("Tab"); await k.press("Tab"); note(C, `2 tabs from title: ${await active()}`);
    await k.type("c"); note(C, `state after type-ahead 'c': ${await pg.locator("#edit-bug-state").inputValue()}`);
    const s = await tabsTo(async () => (await active()).includes("Save"), 8); note(C, `Tabs from State to Save: ${s}`);
    await k.press("Enter"); await sleep(600);
    const saved = (await byTitle(t))[0]; note(C, `saved via keyboard: state=${saved?.state}; focus after edit closes: ${await active()}`);
    await pg.getByRole("button", { name: "Closed", exact: true }).focus(); await k.press("Enter"); await sleep(200);
    await row(pg, "N3").focus(); await k.press("Enter"); await sleep(400);
    const del = await tabsTo(async () => (await active()).includes("Delete"), 12); note(C, `Tabs from title to Delete: ${del}`);
    await k.press("Enter"); await sleep(200); note(C, `confirm open=${await pg.getByRole("dialog", { name: "Delete bug" }).count()}, focus=${await active()}`);
    await shot(pg, "N3-confirm-focus");
    let reach = -1;
    for (let i = 1; i <= 10; i++) { await k.press("Tab"); if (await pg.evaluate(() => !!document.activeElement.closest("[aria-labelledby=confirm-delete-title]") && document.activeElement.textContent.trim() === "Delete")) { reach = i; break; } }
    note(C, `Tabs to reach confirm Delete=${reach}`);
    if (reach > 0) { await k.press("Enter"); await sleep(600); }
    note(C, `after confirm: bug exists=${(await byTitle(t)).length}; dialogs=${await pg.getByRole("dialog").count()}; focus=${await active()}`);
    // Unchanged edit: Save is disabled, so Tab leaves the modal. Where does Enter land?
    const b2 = await mkBug(`N3b unchanged ${TAG}`); await pg.getByRole("button", { name: "Open", exact: true }).click(); await pg.reload(); await pg.waitForFunction(() => !document.body.innerText.includes("Loading…")); await search(pg, `N3b unchanged ${TAG}`); await row(pg, "N3b").focus(); await k.press("Enter"); await sleep(400);
    const trail = []; for (let i = 0; i < 9; i++) { await k.press("Tab"); trail.push(await active()); }
    note(C, `unchanged edit, Tab x9 from title: ${JSON.stringify(trail)}`);
    await a.ctx.close();
  },

  async n4(browser) { // narrow viewports and zoom
    const C = "N4"; const bug = await mkBug(`N4 narrow viewport bug with a normal length title ${TAG}`);
    for (const [w, h, label] of [[1280, 800, "1280"], [768, 1024, "768"], [375, 667, "375-phone"], [320, 568, "320-400pct-zoom"]]) {
      const a = await session(browser, "buggy", { viewport: { width: w, height: h } });
      await search(a.page, TAG).catch(() => {});
      const m = await a.page.evaluate(() => {
        const r = (sel) => { const e = typeof sel === "string" ? document.querySelector(sel) : sel; if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) }; };
        const btn = (t) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
        return { docW: document.documentElement.scrollWidth, vw: innerWidth, header: document.querySelector("header").scrollWidth, newBug: r(btn("New Bug")), logout: r(btn("Logout") || btn("Log out")), table: r("table"), search: r("input[role=search]") };
      });
      note(C, `${label}: ${JSON.stringify(m)}`);
      await shot(a.page, `N4-board-${label}`);
      await a.page.getByRole("button", { name: "New Bug", exact: true }).click({ force: true }).catch(() => {}); await sleep(200);
      const md = await a.page.evaluate(() => { const p = document.querySelector(".bug-modal-panel"); if (!p) return null; const b = p.getBoundingClientRect(); const s = document.querySelector("[role=dialog] button[type=submit]").getBoundingClientRect(); return { panelL: Math.round(b.left), panelR: Math.round(b.right), saveBottom: Math.round(s.bottom), vh: innerHeight }; });
      note(C, `${label} create modal: ${JSON.stringify(md)}`);
      await shot(a.page, `N4-create-modal-${label}`);
      await a.ctx.close();
    }
    // 200% zoom approximated by deviceScaleFactor-free CSS zoom
    const z = await session(browser); await z.page.evaluate(() => (document.body.style.zoom = "2")); await sleep(200);
    note(C, `CSS zoom 200% @1280: docW=${await z.page.evaluate(() => document.documentElement.scrollWidth)} vw=1280`);
    await shot(z.page, "N4-zoom-200"); await z.ctx.close();
  },

  async n5(browser) { // rapid open/close
    const C = "N5"; const bug = await mkBug(`N5 rapid ${TAG}`); const a = await session(browser); const pg = a.page;
    const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    for (let i = 0; i < 40; i++) { await pg.getByRole("button", { name: "New Bug", exact: true }).click(); await pg.keyboard.press("Escape"); }
    note(C, `40x open/Escape create: dialogs=${await pg.getByRole("dialog").count()}`);
    await pg.getByRole("button", { name: "New Bug", exact: true }).click(); await sleep(150);
    note(C, `then open: owner='${await pg.locator("#bug-owner").inputValue()}', severity='${await pg.locator("#bug-severity").inputValue()}'`);
    await pg.keyboard.press("Escape"); await pg.keyboard.press("Escape");
    await search(pg, `N5 rapid ${TAG}`);
    for (let i = 0; i < 20; i++) { await row(pg, "N5").click(); await pg.getByRole("dialog", { name: EDIT }).waitFor(); await pg.keyboard.press("Escape"); }
    note(C, `20x open/Escape edit: dialogs=${await pg.getByRole("dialog").count()}`);
    // Double-click on a row: two GETs -> one or two modals?
    const gets = []; pg.on("request", (r) => r.url().includes(`/api/bugs/${bug.id}`) && gets.push(r.method()));
    await row(pg, "N5").dblclick(); await sleep(500);
    note(C, `dblclick row: GETs=${gets.length}, dialogs=${await pg.getByRole("dialog").count()}`);
    // Escape in the edit modal with confirm open, then Escape again quickly
    await pg.getByRole("dialog", { name: EDIT }).getByRole("button", { name: "Delete", exact: true }).click();
    await pg.keyboard.press("Escape"); await pg.keyboard.press("Escape"); await sleep(200);
    note(C, `Escape x2 from confirm: dialogs=${await pg.getByRole("dialog").count()}; bug still exists=${(await api("GET", `/api/bugs/${bug.id}`)).status}`);
    // Hold Enter on the Delete button of edit modal then confirm
    await row(pg, "N5").click(); await pg.getByRole("dialog", { name: EDIT }).waitFor();
    await pg.getByRole("dialog", { name: EDIT }).getByRole("button", { name: "Delete", exact: true }).focus();
    for (let i = 0; i < 5; i++) await pg.keyboard.press("Enter");
    await sleep(500);
    note(C, `Enter x5 on Delete: confirm open=${await pg.getByRole("dialog", { name: "Delete bug" }).count()}, bug exists=${(await api("GET", `/api/bugs/${bug.id}`)).status}; focus=${await pg.evaluate(() => document.activeElement.textContent.trim().slice(0, 20))}`);
    await shot(pg, "N5-enter-held-on-delete");
    note(C, `page errors: ${JSON.stringify(errs.slice(0, 5))}`);
    await a.ctx.close();
  },

  async n6(browser) { // many bugs with long titles + sort + search
    const C = "N6"; const words = ["engine", "clutch", "carburetor", "distributor", "headlight", "bumper", "exhaust", "heater", "wiper", "gearbox"];
    const t0 = Date.now(); const made = [];
    for (let i = 0; i < 200; i++) { const title = `N6 ${TAG} ${String(i).padStart(3, "0")} ${words[i % 10]} ` + "long descriptive words ".repeat(1 + (i % 6)) + (i % 20 === 0 ? "Ünïcödé Åland ñandú" : ""); made.push(await mkBug(title, { severity: ["high", "mid", "low"][i % 3], owner: i % 2 ? "vanny" : "buggy" })); }
    note(C, `created 200 bugs in ${Date.now() - t0}ms`);
    const a = await session(browser); const pg = a.page;
    const t1 = Date.now(); await pg.reload(); await pg.waitForFunction(() => !document.body.innerText.includes("Loading…")); note(C, `board load with >=200 extra rows: ${Date.now() - t1}ms, rows=${await pg.locator("tbody tr").count()}`);
    const box = pg.getByLabel("Search bugs by title"); await box.click();
    const t2 = Date.now(); await pg.keyboard.type(`n6 ${TAG}`, { delay: 0 }); await sleep(50); note(C, `typing ${`n6 ${TAG}`.length} chars: ${Date.now() - t2}ms; rows=${await pg.locator("tbody tr").count()}`);
    await pg.getByRole("button", { name: /^Title/ }).click();
    const titles = await pg.locator("tbody tr td:nth-child(3)").allInnerTexts();
    const sortedOk = titles.every((t, i) => i === 0 || titles[i - 1].localeCompare(t) <= 0);
    note(C, `search+sort title asc: ${titles.length} rows, sorted=${sortedOk}, first='${titles[0]?.slice(0, 40)}'`);
    await pg.getByRole("button", { name: /^Owner/ }).click(); await pg.getByRole("button", { name: /^Owner/ }).click();
    note(C, `owner sort desc aria-sort=${await pg.locator("th", { hasText: "Owner" }).getAttribute("aria-sort")}; first owner=${await pg.locator("tbody tr td:nth-child(4)").first().innerText()}`);
    // Edit from a sorted+filtered view keeps sort/search?
    await pg.locator("tbody tr").first().click(); const d = pg.getByRole("dialog", { name: EDIT }); await d.waitFor();
    await d.locator("#edit-bug-title").fill(`${P} N6 ${TAG} renamed zzz no longer matching`); await d.getByRole("button", { name: "Save" }).click(); await d.waitFor({ state: "detached" }); await sleep(300);
    note(C, `after renaming a row out of the search: search box='${await box.inputValue()}', rows=${await pg.locator("tbody tr").count()}, owner sort kept=${await pg.locator("th", { hasText: "Owner" }).getAttribute("aria-sort")}`);
    // Search for the diacritic titles
    await box.fill("unicode"); note(C, `search 'unicode' finds 'Ünïcödé' rows: ${await pg.locator("tbody tr").count()}`);
    await box.fill("ünïcödé"); note(C, `search 'ünïcödé' rows: ${await pg.locator("tbody tr").filter({ hasText: TAG }).count()}`);
    await box.fill(""); await pg.getByRole("button", { name: /^Title/ }).click();
    const t3 = Date.now(); for (let i = 0; i < 6; i++) await pg.getByRole("button", { name: /^Severity/ }).click(); note(C, `6 severity sort toggles over full board: ${Date.now() - t3}ms`);
    await shot(pg, "N6-many-long-titles", true);
    await a.ctx.close();
  },

  async n7(browser) { // backend unreachable / failing reads
    const C = "N7"; const a = await session(browser); const pg = a.page;
    await pg.route("**/api/bugs", (r) => r.request().method() === "GET" ? r.fulfill({ status: 500, contentType: "application/json", body: '{"error":"server_error","message":"db down"}' }) : r.fallback());
    await pg.reload(); await sleep(800);
    note(C, `GET /api/bugs 500 on load: body shows '${(await pg.locator("tbody").innerText()).trim()}', alerts=${await pg.getByRole("alert").count()}`);
    await shot(pg, "N7-500-shows-no-bugs");
    await pg.unroute("**/api/bugs"); await pg.route("**/api/bugs", (r) => r.request().method() === "GET" ? r.abort("connectionrefused") : r.fallback());
    const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
    await pg.reload(); await sleep(800);
    note(C, `GET aborted on load: body shows '${(await pg.locator("tbody").innerText()).trim()}', page errors=${JSON.stringify(errs.slice(0, 2))}`);
    await shot(pg, "N7-abort-shows");
    await pg.unroute("**/api/bugs"); await pg.reload(); await pg.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    const bug = await mkBug(`N7 open-fails ${TAG}`); await search(pg, TAG); await pg.reload(); await pg.waitForFunction(() => !document.body.innerText.includes("Loading…")); await search(pg, TAG);
    await pg.route(`**/api/bugs/${bug.id}`, (r) => r.abort("connectionrefused"));
    await row(pg, "N7").click(); await sleep(600);
    note(C, `row click with network failure: dialogs=${await pg.getByRole("dialog").count()}, alerts=${await pg.getByRole("alert").count()}`);
    // Create succeeds but refetch fails: does the new bug show?
    await pg.unroute(`**/api/bugs/${bug.id}`);
    let first = true;
    await pg.route("**/api/bugs", (r) => { if (r.request().method() === "GET" && first) { first = false; return r.fulfill({ status: 503, body: "" }); } return r.fallback(); });
    const d = await openCreate(pg); const t = `${P} N7 saved-but-hidden ${TAG}`;
    await d.locator("#bug-title").fill(t); await d.locator("#bug-description").fill("refetch fails"); await d.getByRole("button", { name: "Save" }).click(); await sleep(700);
    note(C, `create OK but refetch 503: modal closed=${(await pg.getByRole("dialog").count()) === 0}, row visible=${await row(pg, "saved-but-hidden").count()}, server has it=${(await byTitle(t)).length}, alerts=${await pg.getByRole("alert").count()}`);
    await shot(pg, "N7-saved-but-not-shown");
    await a.ctx.close();
  },
};

const browser = await chromium.launch({ headless: true });
try { for (const n of process.argv.slice(2)) { try { await charters[n](browser); } catch (e) { note(n.toUpperCase(), "CHARTER ERROR " + e.message.split("\n")[0]); } } }
finally { saveLog(process.argv.slice(2).join("-")); await browser.close(); }
