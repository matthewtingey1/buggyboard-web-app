import { test, expect, users } from '../fixtures';

test('every account in users.json has a username and password', () => {
  for (const user of users) {
    expect(typeof user.username).toBe('string');
    expect(typeof user.password).toBe('string');
  }
});

test('usernames in users.json are unique', () => {
  const names = users.map((u) => u.username);

  expect(new Set(names).size).toBe(names.length);
});

// Spec 02 fixes this default credential; it is public in the spec itself.
const specDefault = { username: 'buggy', expected: '1970beetle' };

test('the default buggy account exists with the password spec 02 names', () => {
  const buggy = users.find((u) => u.username === specDefault.username);

  expect(buggy?.password).toBe(specDefault.expected);
});
