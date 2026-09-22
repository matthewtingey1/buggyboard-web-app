// P-1: what happens to keystrokes typed right after reopening the create modal.
import { chromium, session, shot, note, saveLog, sleep } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
try {
  const a = await session(browser); const pg = a.page; const C = "P1c";
  const open = () => pg.getByRole("button", { name: "New Bug", exact: true }).click();
  for (const wait of [0, 16, 50, 200]) {
    const out = [];
    for (let i = 0; i < 5; i++) {
      await open(); await sleep(200); await pg.locator("#bug-title").fill("OLD"); await pg.keyboard.press("Escape");
      await open(); if (wait) await sleep(wait); await pg.keyboard.type("new");
      await sleep(200); out.push(await pg.locator("#bug-title").inputValue());
      if (wait === 0 && i === 0) await shot(pg, "P1-stale-draft-merged-with-new-typing");
      await pg.keyboard.press("Escape");
    }
    note(C, `previous draft 'OLD', type 'new' ${wait}ms after reopen click: ${JSON.stringify(out)}`);
  }
  // First-time open (no previous draft): owner starts blank for a frame
  const b = await session(browser, "vanny");
  await b.page.getByRole("button", { name: "New Bug", exact: true }).click();
  await b.page.keyboard.type("x"); await sleep(200);
  note(C, `first-ever open, type 'x' at once: title='${await b.page.locator("#bug-title").inputValue()}', owner='${await b.page.locator("#bug-owner").inputValue()}'`);
  await a.ctx.close(); await b.ctx.close();
} finally { saveLog("p1"); await browser.close(); }
