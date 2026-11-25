import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { aftroRequest, ApiError, problem, type Account, type ApiProblem, type AuthResult, type Session } from './api';
import { isLanguage, type Language } from './copy';
import { parseOrigin } from './preview';

const originKey = 'aftro.server-origin';
const languageKey = 'aftro.language';
const sessionKey = 'aftro.mobile-session';
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const defaultOrigin = parseOrigin(process.env.EXPO_PUBLIC_AFTRO_API_URL ?? '');

function readSession(raw: string | null, origin: string | null): Session | null {
  if (!raw || !origin) return null;
  try {
    const session = JSON.parse(raw);
    return session?.origin === origin && typeof session.token === 'string' && tokenPattern.test(session.token)
      ? { origin, token: session.token } : null;
  } catch {
    return null;
  }
}

export function useAccount() {
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('kk');
  const [origin, setOrigin] = useState<string | null>(defaultOrigin);
  const [account, setAccount] = useState<(Account & Session) | null>(null);
  const [error, setError] = useState<ApiProblem | null>(null);

  useEffect(() => {
    let active = true;
    async function restore() {
      const [settings, raw] = await Promise.all([
        AsyncStorage.multiGet([originKey, languageKey]).catch(() => []),
        SecureStore.getItemAsync(sessionKey).catch(() => null),
      ]);
      if (!active) return;
      const stored = new Map(settings);
      const locale = stored.get(languageKey);
      if (isLanguage(locale)) setLanguage(locale);
      const server = parseOrigin(stored.get(originKey) ?? '') ?? defaultOrigin;
      setOrigin(server);
      const session = readSession(raw, server);
      if (!session) return;
      try {
        const profile = await aftroRequest<Account>(session.origin, '/me', { token: session.token });
        if (active) setAccount({ ...profile, ...session });
      } catch (failure) {
        const reason = problem(failure);
        if (active) setError(reason);
        if (reason === 'sign_in_required') await SecureStore.deleteItemAsync(sessionKey).catch(() => {});
      }
    }
    void restore().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function chooseLanguage(value: Language) {
    setLanguage(value);
    void AsyncStorage.setItem(languageKey, value).catch(() => {});
  }

  function changeOrigin(value: string) {
    setOrigin(value);
    void AsyncStorage.setItem(originKey, value).catch(() => {});
  }

  async function signIn(result: AuthResult, source: string) {
    const token = result?.access_token;
    if (typeof token !== 'string' || !tokenPattern.test(token)) throw new ApiError('accounts_unavailable');
    const session = { origin: source, token };
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(session)).catch(() => {});
    setError(null);
    setAccount({ kind: result.kind, identifier: result.identifier, ...session });
  }

  async function signOut(expired = false) {
    if (!account) return;
    await SecureStore.deleteItemAsync(sessionKey).catch(() => {});
    if (expired) setError('sign_in_required');
    setAccount(null);
    if (!expired) await aftroRequest(account.origin, '/logout', { method: 'POST', token: account.token }).catch(() => {});
  }

  return { account, loading, language, origin, error, chooseLanguage, changeOrigin, signIn, signOut };
}
