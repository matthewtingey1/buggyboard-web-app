import { chromium } from "@playwright/test";
const E = process.argv[2];
const BASE = "http://localhost:5173";
const out = {};
const browser = await chromium.launch({ headless: true });

async function ctxWithForged(username) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((u) => localStorage.setItem("buggyboard_user", JSON.stringify({ username: u })), username);
  return ctx;
}

// 1. Forged session for a user that does not exist in users.json
{
  const ctx = await ctxWithForged("ghost-not-in-users-json");
  const page = await ctx.newPage();
  const apiCalls = [];
  page.on("request", (r) => r.url().includes("/api/") && apiCalls.push(`${r.method()} ${r.url()}`));
  await page.goto(BASE + "/board");
  await page.locator("tbody tr").first().waitFor({ timeout: 10000 });
  out.forged = {
    url: page.url(),
    rows: await page.locator("tbody tr").count(),
    ghostNameShown: (await page.content()).includes("ghost-not-in-users-json"),
    apiCalls,
  };
  await page.screenshot({ path: `${E}/forged-session-board.png`, fullPage: false });
  await ctx.close();
}

// 2. Logout: what does the server see?
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.getByLabel(/username/i).fill("buggy");
  await page.getByLabel(/password/i).fill("1970beetle");
  await page.getByRole("button", { name: /log ?in/i }).click();
  await page.waitForURL("**/board");
  const stored = await page.evaluate(() => localStorage.getItem("buggyboard_user"));
  const cookies = await ctx.cookies();
  const logoutCalls = [];
  page.on("request", (r) => r.url().includes("/api/") && logoutCalls.push(`${r.method()} ${r.url()}`));
  await page.getByRole("button", { name: /log ?out/i }).click();
  await page.waitForURL("**/login");
  await page.waitForTimeout(500);
  const afterLogoutApi = await page.evaluate(async () => (await fetch("/api/bugs")).status);
  await page.evaluate((s) => localStorage.setItem("buggyboard_user", s), stored);
  await page.goto(BASE + "/board");
  await page.locator("tbody tr").first().waitFor({ timeout: 10000 });
  out.logout = { storedValue: stored, cookies, apiRequestsDuringLogout: logoutCalls, apiStatusAfterLogout: afterLogoutApi, replayedStoredValueUrl: page.url() };
  await page.screenshot({ path: `${E}/logout-replay-board.png` });
  await ctx.close();
}

// 3. Stored XSS payloads on board, edit modal, delete confirm
{
  const ctx = await ctxWithForged("buggy");
  const page = await ctx.newPage();
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(BASE + "/board");
  await page.getByLabel("Search bugs by title").fill("[security] XSS");
  const row = page.locator("tbody tr", { hasText: "[security] XSS" }).first();
  await row.waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  const board = { xss: await page.evaluate(() => window.__xss ?? null), docTitle: await page.title(), injectedImgs: await page.locator("tbody img").count(), rowText: await row.innerText() };
  await page.screenshot({ path: `${E}/xss-board.png` });
  await row.click();
  const dlg = page.getByRole("dialog").first();
  await dlg.waitFor();
  await page.waitForTimeout(500);
  const modal = {
    xss: await page.evaluate(() => window.__xss ?? null),
    injectedNodes: await dlg.locator("img, script, svg[onload]").count(),
    fieldValues: await dlg.locator("input, textarea").evaluateAll((els) => els.map((e) => e.value)),
  };
  await page.screenshot({ path: `${E}/xss-edit-modal.png` });
  let confirm = null;
  const del = dlg.getByRole("button", { name: /delete/i });
  if (await del.count()) {
    await del.first().click();
    await page.waitForTimeout(500);
    confirm = { xss: await page.evaluate(() => window.__xss ?? null), text: await page.getByText(/Are you sure you want to delete bug/).innerText().catch(() => null) };
    await page.screenshot({ path: `${E}/xss-delete-confirm.png` });
  }
  out.xss = { board, modal, confirm, dialogs };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
