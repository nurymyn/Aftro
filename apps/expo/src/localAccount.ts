import { bytesToHex } from '@noble/hashes/utils.js';
import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { equalVerifiers, passwordVerifier, readAccount, type LocalAccount, type LoginMethod } from './credentials';

const accountKey = 'aftro.local-account.v1';
const storage = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

async function derive(password: string, salt: string) {
  return passwordVerifier(await digestStringAsync(CryptoDigestAlgorithm.SHA256, password), salt);
}

export async function loadLocalAccount() {
  const raw = await SecureStore.getItemAsync(accountKey, storage);
  return raw === null ? null : readAccount(raw);
}

export async function createLocalAccount(method: LoginMethod, identifier: string, password: string): Promise<LocalAccount> {
  const salt = bytesToHex(await getRandomBytesAsync(16));
  const account: LocalAccount = { version: 1, method, identifier, salt, verifier: await derive(password, salt) };
  await SecureStore.setItemAsync(accountKey, JSON.stringify(account), storage);
  return account;
}

export async function verifyLocalPassword(account: LocalAccount, password: string) {
  return equalVerifiers(await derive(password, account.salt), account.verifier);
}
