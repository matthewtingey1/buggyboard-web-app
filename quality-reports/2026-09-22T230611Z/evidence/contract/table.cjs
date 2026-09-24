// Renders probe-proxy.tsv as a markdown table; the exact curl for each row is the matching p line in probe.sh.
const fs = require("fs");
const rows = fs.readFileSync(__dirname + "/probe-proxy.tsv", "utf8").trim().split("\n").slice(1).map((l) => l.split("\t"));
const esc = (s) => (s || "").replace(/\|/g, "\\|").slice(0, 90);
console.log("| row | request | input | expected | actual | content-type | Allow | body |\n|---|---|---|---|---|---|---|---|");
for (const [row, m, path, input, exp, st, ct, allow, body] of rows)
  console.log(`| ${row} | \`${m} ${esc(path)}\` | ${esc(input)} | ${esc(exp)} | ${st} | ${esc(ct)} | ${esc(allow)} | \`${esc(body).replace(/`/g, "'")}\` |`);
