// Probes whether the bugApi fixture cleans up when a test fails after creating a bug.
// Titles use [e2e] because that is the prefix the fixture manages; the token lets the DB be checked afterwards.
import { test, expect, uid } from '../../../../../tests/fixtures';

const token = process.env.RESIDUE_TOKEN ?? uid();

test('assertion fails after bugApi.create', async ({ bugApi }) => {
  await bugApi.create(`[data]probe fail ${token}`);
  expect(1).toBe(2);
});

test('assertion fails after createRaw, before track()', async ({ bugApi }) => {
  const res = await bugApi.createRaw({ title: `[e2e] [data]probe raw ${token}`, severity: 'low', owner: 'buggy', description: 'd' });
  expect(res.status()).toBe(999);
});

test('UI-style create registered with expectTitle, fails before read-back', async ({ bugApi, request }) => {
  const title = `[e2e] [data]probe expect ${token}`;
  bugApi.expectTitle(title);
  await request.post('/api/bugs', { data: { title, severity: 'low', owner: 'buggy', description: 'd' } });
  expect(1).toBe(2);
});

test('UI-style create NOT registered (pattern of whitespace-only / 5.2 tests on regression)', async ({ bugApi, request }) => {
  await request.post('/api/bugs', { data: { title: `[e2e] [data]probe unregistered ${token}`, severity: 'low', owner: 'buggy', description: `blank ${token}` } });
  expect(await bugApi.findContaining(token)).toHaveLength(0);
});

test('expectTitle registered, but server stores a different (trimmed) title', async ({ bugApi, request }) => {
  const title = `[e2e] [data]probe mismatch ${token}`;
  bugApi.expectTitle(`${title} `);
  await request.post('/api/bugs', { data: { title, severity: 'low', owner: 'buggy', description: 'd' } });
  expect(1).toBe(2);
});
