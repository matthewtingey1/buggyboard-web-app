// Renders probe-results.tsv as a markdown table (body truncated, pipes escaped).
const fs = require('fs');
const rows = fs.readFileSync(__dirname + '/probe-results.tsv', 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const esc = s => (s || '').replace(/\|/g, '\\|');
const shape = (ct, b) => /html/.test(ct) ? 'HTML: ' + ((b.match(/<pre>([^<]{0,60})/) || [,''])[1]) : (b.startsWith('{"error"') ? b.match(/"error":"[^"]+"/)[0] : (ct ? 'JSON ' + (b.startsWith('[') ? 'array' : 'object') : (b.startsWith('HTTP') ? 'headers only' : 'empty')));
console.log('| Row | Method | Path | Input | Expected | Actual | Content-Type | Body shape |\n|---|---|---|---|---|---|---|---|');
for (const [r, m, p, d, e, a, ct, b] of rows) console.log(`| ${r} | ${m} | \`${esc(p.replace(/(?<![0-9])[0-9]{4}(?![0-9])/, '<id>'))}\` | ${esc(d)} | ${esc(e)} | ${a} | ${esc((ct||'').split(';')[0]) || '-'} | ${m === 'HEAD' ? 'headers only, no body' : esc(shape(ct, b))} |`);
