import assert from 'node:assert/strict';
import { createHash, scryptSync } from 'node:crypto';
import { equalVerifiers, normalizeIdentifier, passwordVerifier, readAccount } from '../src/credentials.ts';

assert.equal(normalizeIdentifier('email', ' Demo@Example.com '), 'demo@example.com');
assert.equal(normalizeIdentifier('email', 'demo@example'), null);
assert.equal(normalizeIdentifier('phone', '+7 (700) 123-45-67'), '+77001234567');
assert.equal(normalizeIdentifier('phone', '7001234567'), null);

const salt = '000102030405060708090a0b0c0d0e0f';
const digest = createHash('sha256').update('Құпиясөз Aftro demo').digest('hex');
const verifier = await passwordVerifier(digest, salt);
const reference = scryptSync(Buffer.from(digest, 'hex'), Buffer.from(salt, 'hex'), 32,
  { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString('hex');
assert.ok(equalVerifiers(verifier, reference));

const wrong = createHash('sha256').update('Different password').digest('hex');
assert.equal(equalVerifiers(await passwordVerifier(wrong, salt), verifier), false);

const account = { version: 1, method: 'email', identifier: 'demo@example.com', salt, verifier };
assert.deepEqual(readAccount(JSON.stringify(account)), account);
assert.throws(() => readAccount(JSON.stringify({ ...account, verifier: 'invalid' })), /Invalid local account/);
console.log('Local account checks passed: identifiers, password verification, and stored record validation.');
