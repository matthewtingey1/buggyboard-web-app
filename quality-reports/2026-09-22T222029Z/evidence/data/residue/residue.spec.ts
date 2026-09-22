// Probes whether the bugApi fixture cleans up when a test fails, times out, or creates before tracking.
// Titles use [e2e] because only that prefix is cleaned; each run token is printed so the DB can be checked afterwards.
import { test, expect, uid } from '../../../../../tests/fixtures';

const token = process.env.RESIDUE_TOKEN ?? uid();

test('assertion fails after bugApi.create', async ({ bugApi }) => {
  await bugApi.create(`[data]probe fail ${token}`);
  expect(1).toBe(2);
});

test('test times out after bugApi.create', async ({ bugApi }) => {
  test.setTimeout(1500);
  await bugApi.create(`[data]probe timeout ${token}`);
  await new Promise((r) => setTimeout(r, 5000));
});

test('assertion fails between a UI-style create and track()', async ({ bugApi }) => {
  const res = await bugApi.createRaw({ title: `[e2e] [data]probe untracked ${token}`, severity: 'low', owner: 'buggy', description: 'd' });
  expect(res.status()).toBe(999); // stands in for `expect(dialog).toBeHidden()` failing before findByTitle/track
  bugApi.track((await res.json()).id);
});
