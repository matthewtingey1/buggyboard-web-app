// Headless probe: logout replay, and <script>/SQL-metacharacter payloads in every text field.
// Credentials are read from users.json at runtime and never written out.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const E = process.argv[2];
const BASE = "http://localhost:5173";
const buggy = JSON.parse(readFileSync("users.json", "utf8")).find((u) => u.username === "buggy");
const out = {};
const browser = await chromium.launch({ headless: true });

{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.getByLabel(/username/i).fill(buggy.username);
  await page.getByLabel(/password/i).fill(buggy.password);
  await page.getByRole("button", { name: /log ?in/i }).click();
  await page.waitForURL("**/board");
  const stored = await page.evaluate(() => localStorage.getItem("buggyboard_user"));
  const cookies = await ctx.cookies();
  const logoutCalls = [];
  page.on("request", (r) => r.url().includes("/api/") && logoutCalls.push(`${r.method()} ${new URL(r.url()).pathname}`));
  await page.getByRole("button", { name: /log ?out/i }).click();
  await page.waitForURL("**/login");
  await page.waitForTimeout(500);
  const afterLogoutApi = await page.evaluate(async () => (await fetch("/api/bugs")).status);
  await page.evaluate((s) => localStorage.setItem("buggyboard_user", s), stored);
  await page.goto(BASE + "/board");
  await page.locator("tbody tr").first().waitFor({ timeout: 10000 });
  out.logout = { storedValue: stored, cookies, apiRequestsDuringLogout: logoutCalls, apiStatusAfterLogout: afterLogoutApi, replayedUrl: page.url() };
  await page.screenshot({ path: `${E}/logout-replay-board.png` });
  await ctx.close();
}

const tag = `[security] XSS2 ${Date.now()}`;
const script = `<script>window.__xss='script'</script>`;
const sql = `'; DROP TABLE bugs; -- " OR 1=1 /*`;
const svg = `<svg onload="window.__xss='svg'">`;
const created = await (await fetch(BASE + "/api/bugs", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: `${tag} ${script} ${sql}`, severity: "low", owner: `${svg} ${sql}`, description: `${script}\n${svg}\n${sql}` }) })).json();
out.created = created;
{
  const ctx = await browser.newContext();
  await ctx.addInitScript((u) => localStorage.setItem("buggyboard_user", JSON.stringify({ username: u })), buggy.username);
  const page = await ctx.newPage();
  const dialogs = [];
  page.on("dialog", async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  await page.goto(BASE + "/board");
  await page.getByLabel("Search bugs by title").fill(tag);
  const row = page.locator("tbody tr", { hasText: tag }).first();
  await row.waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  const board = { xss: await page.evaluate(() => window.__xss ?? null), injectedNodes: await page.locator("tbody script, tbody svg[onload]").count(), rowText: await row.innerText() };
  await page.screenshot({ path: `${E}/xss2-board.png` });
  await row.click();
  const dlg = page.getByRole("dialog").first();
  await dlg.waitFor();
  await page.waitForTimeout(500);
  const modal = { xss: await page.evaluate(() => window.__xss ?? null), injectedNodes: await dlg.locator("script, svg[onload]").count(),
    fieldValues: await dlg.locator("input, textarea").evaluateAll((els) => els.map((e) => e.value)) };
  await page.screenshot({ path: `${E}/xss2-edit-modal.png` });
  out.xss = { board, modal, dialogs };
  await ctx.close();
}
const after = await fetch(BASE + "/api/bugs");
out.bugsTableStillThere = after.status;
out.cleanup = (await fetch(`${BASE}/api/bugs/${created.id}`, { method: "DELETE" })).status;
await browser.close();
console.log(JSON.stringify(out, null, 2));
