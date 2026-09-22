import { test, expect, users, defaultUser, uid } from '../fixtures';

const wrong = `${defaultUser.password}-wrong`;

for (const user of users) {
  test(`POST /api/login returns 200 and the username for ${user.username}`, async ({ bugApi }) => {
    const res = await bugApi.send('POST', '/api/login', { data: { username: user.username, password: user.password } });

    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ username: user.username });
  });
}

test('POST /api/login trims the username', async ({ bugApi }) => {
  const res = await bugApi.send('POST', '/api/login', { data: { username: `  ${defaultUser.username} `, password: defaultUser.password } });

  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ username: defaultUser.username });
});

const rejections = [
  { name: 'wrong password', body: { username: defaultUser.username, password: wrong }, status: 401, error: 'invalid_credentials' },
  { name: 'unknown user', body: { username: `no-such-user-${uid()}`, password: wrong }, status: 401, error: 'invalid_credentials' },
  { name: 'username in the wrong case', body: { username: defaultUser.username.toUpperCase(), password: defaultUser.password }, status: 401, error: 'invalid_credentials' },
  { name: 'blank username', body: { username: '', password: wrong }, status: 400, error: 'blank_username' },
  { name: 'whitespace-only username', body: { username: '   ', password: wrong }, status: 400, error: 'blank_username' },
  { name: 'missing password', body: { username: defaultUser.username }, status: 400, error: 'blank_password' },
  { name: 'blank password', body: { username: defaultUser.username, password: '' }, status: 400, error: 'blank_password' },
  { name: 'both blank', body: { username: '', password: '' }, status: 400, error: 'missing_credentials' },
  { name: 'empty body', body: {}, status: 400, error: 'missing_credentials' },
];

for (const r of rejections) {
  test(`POST /api/login with ${r.name} returns ${r.status} ${r.error}`, async ({ bugApi }) => {
    const res = await bugApi.send('POST', '/api/login', { data: r.body });

    expect(res.status()).toBe(r.status);
    expect(await res.json()).toMatchObject({ error: r.error });
  });
}

for (const [kind, username] of [['number', 123], ['array', ['buggy']], ['object', { name: 'buggy' }]] as const) {
  test(`POST /api/login with a ${kind} username returns a 400 JSON error`, async ({ bugApi }) => {

    const res = await bugApi.send('POST', '/api/login', { data: { username, password: wrong } });

    expect(res.status()).toBe(400);
    expect(res.headers()['content-type']).toContain('application/json');
  });
}
