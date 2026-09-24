import { api, mine, P } from "./lib.mjs";
const list = await mine();
for (const b of list) if (b.title.startsWith(P)) await api("DELETE", `/api/bugs/${b.id}`);
console.log(`deleted ${list.length} [exploratory] bugs; remaining mine: ${(await mine()).length}`);
