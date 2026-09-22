import { chromium, api, session, shot, note, saveLog, sleep, TAG, P, BASE } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
try {
  { const C = "P1b"; const a = await session(browser, "buggy"); const pg = a.page;
    const res = { fill: [], type: [] };
    for (let i = 0; i < 10; i++) {
      for (const mode of ["fill", "type"]) {
        await pg.getByRole("button", { name: "New Bug" }).click();
        if (mode === "fill") await pg.locator("#bug-title").fill("abc"); else await pg.keyboard.type("abc");
        await sleep(150);
        res[mode].push(await pg.locator("#bug-title").inputValue());
        await pg.keyboard.press("Escape"); await sleep(50);
      }
    }
    note(C, `title after fill right after open (10 runs): ${JSON.stringify(res.fill)}`);
    note(C, `title after keyboard.type right after open (10 runs): ${JSON.stringify(res.type)}`);
    // first open ever: owner
    const b = await session(browser, "vanny");
    await b.page.getByRole("button", { name: "New Bug" }).click();
    const ownerImmediate = await b.page.locator("#bug-owner").inputValue(); await sleep(150);
    note(C, `vanny first open: owner immediately='${ownerImmediate}', after 150ms='${await b.page.locator("#bug-owner").inputValue()}'`);
    await a.ctx.close(); await b.ctx.close(); }

  { const C = "R03"; const a = await session(browser, "buggy"); const t2 = await a.ctx.newPage();
    await t2.goto(BASE + "/board"); await t2.waitForFunction(() => !document.body.innerText.includes("Loading…"));
    await a.page.getByRole("button", { name: /log ?out/i }).click(); await a.page.waitForURL("**/login"); await sleep(300);
    await t2.getByRole("button", { name: "New Bug" }).click(); await sleep(200);
    await t2.locator("#bug-title").fill(`${P} R03 after-logout ${TAG}`); await t2.locator("#bug-description").fill("created by logged-out tab");
    await t2.getByRole("dialog").getByRole("button", { name: "Save" }).click(); await sleep(800);
    const made = (await api("GET", "/api/bugs")).json.find((b) => b.title === `${P} R03 after-logout ${TAG}`);
    note(C, `logged-out tab2 created bug: ${made ? `#${made.id} owner=${made.owner}` : "no"}`);
    await shot(t2, "R03-tab2-created-after-logout"); await a.ctx.close(); }

  { const C = "R06"; const a = await session(browser, "buggy"); await a.page.getByRole("button", { name: "New Bug" }).click(); await sleep(200);
    const d = a.page.getByRole("dialog", { name: "Create bug" });
    await d.locator("#bug-title").fill(`${P} R06 dup ${TAG}`); await d.locator("#bug-description").fill("dup");
    await a.page.evaluate(() => { const b = document.querySelector("[role=dialog] button[type=submit]"); b.click(); b.click(); });
    await sleep(1000);
    const n = (await api("GET", "/api/bugs")).json.filter((b) => b.title === `${P} R06 dup ${TAG}`).length;
    note(C, `two synchronous clicks created ${n} bugs`); await a.ctx.close(); }

  { const C = "R08"; const a = await session(browser, "buggy");
    note(C, `history length after login: ${await a.page.evaluate(() => history.length)}`);
    await a.page.getByRole("button", { name: "New Bug" }).click(); await sleep(200); await a.page.locator("#bug-title").fill("draft that will be lost");
    await a.page.goBack(); await sleep(600);
    note(C, `after Back with draft: url=${a.page.url()} dialogs=${await a.page.getByRole("dialog").count()}`); await shot(a.page, "R08-back-with-modal");
    await a.page.goForward(); await sleep(600);
    note(C, `after Forward: url=${a.page.url()} dialogs=${await a.page.getByRole("dialog").count()}`); await a.ctx.close(); }
} finally { saveLog("retest2"); await browser.close(); }
