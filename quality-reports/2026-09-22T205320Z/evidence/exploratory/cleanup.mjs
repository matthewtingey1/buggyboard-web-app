const B = "http://localhost:5173/api/bugs";
const mine = async () => (await (await fetch(B)).json()).filter((b) => b.title.startsWith("[exploratory]"));
let n = 0; for (const b of await mine()) { const r = await fetch(`${B}/${b.id}`, { method: "DELETE" }); if (r.status === 204) n++; }
console.log(`deleted ${n}; remaining [exploratory]: ${(await mine()).length}`);
