import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { accountApiOrigin, createAccountApi } from '../src/accountApi.ts';

assert.equal(accountApiOrigin(undefined, true, '192.168.1.25:8081'), 'http://192.168.1.25:8000');
assert.equal(accountApiOrigin(undefined, true, 'example.com:8081'), null);
assert.equal(accountApiOrigin('http://example.com', true), null);
assert.equal(accountApiOrigin('http://192.168.1.25:8000', false), null);
assert.equal(accountApiOrigin('https://account:password@example.com', true), null);
assert.equal(accountApiOrigin('https://example.com/', false), 'https://example.com');
await assert.rejects(createAccountApi(null).authenticate('register', {
  identifier: 'example@example.test', password: 'unused test password',
}), { issue: 'apiAddressMissing' });

const api = createAccountApi(process.env.AFTRO_TEST_URL ?? 'http://127.0.0.1:8000');
const identifier = `${randomUUID()}@example.test`;
const password = 'a longer test password';
await api.authenticate('register', { identifier, password });

const row = execFileSync('psql', ['-h', '127.0.0.1', '-t', '-A', '-F', '|',
  '-v', 'ON_ERROR_STOP=1', '-v', `identifier=${identifier}`], {
  input: "SELECT identifier, kind FROM public.aftro_accounts WHERE identifier = :'identifier';\n",
  encoding: 'utf8',
}).trim();
assert.equal(row, `${identifier}|email`);

await assert.rejects(api.authenticate('register', { identifier, password }), { issue: 'accountExists' });
await assert.rejects(api.authenticate('login', { identifier, password: 'an incorrect password' }), { issue: 'incorrectLogin' });
await api.authenticate('login', { identifier, password });
console.log('Expo account client registration, PostgreSQL row, duplicate rejection, and login passed.');
