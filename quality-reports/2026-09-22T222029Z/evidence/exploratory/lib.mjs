import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, "../../../..");
export const SHOTS = path.join(DIR, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });
export const BASE = "http://localhost:5173";
export const P = "[exploratory]";
export const TAG = Date.now().toString(36);
export { chromium };

// Credentials read at runtime; never written to disk.
const USERS = JSON.parse(fs.readFileSync(path.join(ROOT, "users.json"), "utf8"));
export function pass(username) { return USERS.find((u) => u.username === username).password; }

const logs = {};
export function note(c, msg) { (logs[c] ??= []).push(msg); console.log(`[${c}] ${msg}`); }
export function saveLog(name) {
  fs.writeFileSync(path.join(DIR, `session-log-${name}-${TAG}.json`), JSON.stringify(logs, null, 2));
}

export async function api(method, url, body) {
  const res = await fetch(BASE + url, {
    method, headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
  return { status: res.status, json };
}
export async function mkBug(title, extra = {}) {
  return (await api("POST", "/api/bugs", { title: `${P} ${title}`, severity: "high", owner: "buggy", description: "exploratory charter", ...extra })).json;
}
export async function mine() {
  return (await api("GET", "/api/bugs")).json.filter((b) => b.title.startsWith(P));
}
export async function session(browser, user = "buggy", opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login");
  await page.fill("#username", user);
  await page.fill("#password", pass(user));
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/board");
  await page.waitForFunction(() => !document.body.innerText.includes("Loading…"));
  return { ctx, page };
}
export async function search(page, text) { await page.getByLabel("Search bugs by title").fill(text); }
export function row(page, text) { return page.locator("tbody tr").filter({ hasText: text }); }
export async function shot(page, name, full = false) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
