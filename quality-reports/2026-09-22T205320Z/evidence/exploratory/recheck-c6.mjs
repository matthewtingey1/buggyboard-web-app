import { chromium } from "@playwright/test";
const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
await p.goto("http://localhost:5173/login");
await p.fill("#username", "  buggy "); await p.fill("#password", "1970beetle");
await p.getByRole("button", { name: "Login" }).click(); await p.waitForURL("**/board");
await p.getByRole("button", { name: "New Bug", exact: true }).click();
await p.waitForTimeout(500);
console.log("default owner:", JSON.stringify(await p.locator("#bug-owner").inputValue()), "stored:", await p.evaluate(() => localStorage.getItem("buggyboard_user")));
await b.close();
