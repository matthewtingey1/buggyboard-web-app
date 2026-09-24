// N8: Back/Forward and reload during a pending save.
import { chromium, api, session, shot, note, saveLog, sleep, TAG, P } from "./lib.mjs";
const browser = await chromium.launch({ headless: true });
const C = "N8";
try {
  for (const nav of ["back", "reload"]) {
    const a = await session(browser); const pg = a.page;
    const reqs = [];
    await pg.route("**/api/bugs", async (r) => { if (r.request().method() !== "POST") return r.fallback(); reqs.push("POST"); await sleep(2500); await r.continue().catch((e) => reqs.push("continue failed: " + e.message.slice(0, 60))); });
    let dialogShown = false; pg.on("dialog", async (d) => { dialogShown = true; await d.dismiss(); });
    await pg.getByRole("button", { name: "New Bug", exact: true }).click(); await sleep(150);
    const t = `${P} N8 ${nav} pending ${TAG}`;
    await pg.locator("#bug-title").fill(t); await pg.locator("#bug-description").fill("pending during navigation");
    await pg.getByRole("button", { name: "Save", exact: true }).click(); await sleep(300);
    if (nav === "back") await pg.goBack(); else await pg.reload();
    await sleep(3000);
    const saved = (await api("GET", "/api/bugs")).json.filter((b) => b.title === t).length;
    note(C, `${nav} while request held in the browser: beforeunload prompt=${dialogShown}, url=${pg.url()}, reqs=${JSON.stringify(reqs)}, bug saved=${saved}`);
    if (nav === "back") { await pg.goForward(); await sleep(800); note(C, `forward: url=${pg.url()}, dialogs=${await pg.getByRole("dialog").count()}`); }
    await shot(pg, `N8-${nav}-during-pending-save`);
    await a.ctx.close();
  }
} finally { saveLog("n8"); await browser.close(); }
