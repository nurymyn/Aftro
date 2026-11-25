import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

export type LoginMethod = 'email' | 'phone';
export type LocalAccount = {
  version: 1; method: LoginMethod; identifier: string; salt: string; verifier: string;
};

export const minPasswordLength = 15;
export const maxPasswordLength = 128;

export function normalizeIdentifier(method: LoginMethod, raw: string) {
  const value = raw.trim();
  if (method === 'phone') {
    const phone = value.replace(/[\s()-]/g, '');
    return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
  }
  return value.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)
    ? value.toLowerCase() : null;
}

export function readAccount(raw: string): LocalAccount {
  const value = JSON.parse(raw);
  if (value?.version !== 1 || (value.method !== 'email' && value.method !== 'phone') ||
    typeof value.identifier !== 'string' || normalizeIdentifier(value.method, value.identifier) !== value.identifier ||
    typeof value.salt !== 'string' || !/^[0-9a-f]{32}$/.test(value.salt) ||
    typeof value.verifier !== 'string' || !/^[0-9a-f]{64}$/.test(value.verifier)) {
    throw new Error('Invalid local account');
  }
  return value;
}

export async function passwordVerifier(passwordDigest: string, salt: string) {
  // The Expo native SHA-256 digest provides byte input on both platforms.
  const key = await scryptAsync(hexToBytes(passwordDigest), hexToBytes(salt), { N: 2 ** 15, r: 8, p: 3, dkLen: 32 });
  return bytesToHex(key);
}

export function equalVerifiers(first: string, second: string) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let i = 0; i < first.length; i++) difference |= first.charCodeAt(i) ^ second.charCodeAt(i);
  return difference === 0;
}
