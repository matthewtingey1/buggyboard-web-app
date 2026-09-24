import { test, expect, PREFIX, uid } from '../fixtures';

// The request fixture carries no session, so every call here is anonymous.
test('GET /api/bugs without a session returns 401', async ({ bugApi }) => {
  test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');

  const res = await bugApi.send('GET', '/api/bugs');

  expect(res.status()).toBe(401);
});

test('POST /api/bugs without a session returns 401', async ({ bugApi }) => {
  test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');

  const res = await bugApi.createRaw({ title: `${PREFIX} anon ${uid()}`, severity: 'low', owner: 'buggy', description: 'd' });

  expect(res.status()).toBe(401);
});

test('DELETE /api/bugs/:id without a session leaves the bug in place', async ({ bugApi }) => {
  test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  const bug = await bugApi.create(`anon delete ${uid()}`);

  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  expect(await bugApi.get(bug.id)).not.toBeNull();
});

test('responses do not advertise the server framework', async ({ bugApi }) => {
  const res = await bugApi.send('GET', '/api/health');

  expect(res.headers()['x-powered-by']).toBeUndefined();
});

test('responses carry basic security headers', async ({ bugApi }) => {
  const res = await bugApi.send('GET', '/api/health');

  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('DENY');
});

test('repeated failed logins for one username are refused with 429', async ({ bugApi }) => {
  // A throwaway username, so no real account is locked out.
  const username = `ratelimit-${uid()}`;
  for (let i = 0; i < 20; i++) {
    expect((await bugApi.send('POST', '/api/login', { data: { username, password: 'wrong' } })).status()).toBe(401);
  }

  const res = await bugApi.send('POST', '/api/login', { data: { username, password: 'wrong' } });

  expect(res.status()).toBe(429);
  expect(Number(res.headers()['retry-after'])).toBeGreaterThan(0);
  expect(await res.json()).toMatchObject({ error: 'too_many_attempts' });
});

test('failures for a case variant do not lock the real username', async ({ bugApi }) => {
  const username = `ratelimit-${uid()}`;
  for (let i = 0; i < 20; i++) {
    await bugApi.send('POST', '/api/login', { data: { username: username.toUpperCase(), password: 'wrong' } });
  }

  const res = await bugApi.send('POST', '/api/login', { data: { username, password: 'wrong' } });

  expect(res.status()).toBe(401);
});

// Direct to the backend: the Vite proxy rewrites Host, so only a direct call can carry a foreign one.
test('a request with a foreign Host header is refused', async ({ bugApi }) => {
  const res = await bugApi.send('GET', 'http://127.0.0.1:3002/api/health', { headers: { Host: 'evil.example' } });

  expect(res.status()).toBe(403);
  expect(await res.json()).toMatchObject({ error: 'forbidden_host' });
});

test('a direct local request is allowed', async ({ bugApi }) => {
  const res = await bugApi.send('GET', 'http://127.0.0.1:3002/api/health');

  expect(res.status()).toBe(200);
});
