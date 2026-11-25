import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountApiError, accountApiOrigin, createAccountApi, type AccountApiIssue } from './accountApi';
import { copy, type Language } from './copy';
import { maxPasswordLength, minPasswordLength, normalizeIdentifier, type LocalAccount, type LoginMethod } from './credentials';
import { cacheSharedAccount, markAccountShared, verifyLocalPassword } from './localAccount';
import { Brand, Button, Field, LanguagePicker, Status, Switcher, colors, layout, roomImages } from './ui';

const api = createAccountApi(accountApiOrigin(
  process.env.EXPO_PUBLIC_AFTRO_API_URL,
  __DEV__,
  Constants.expoConfig?.hostUri,
));

type AuthMode = 'login' | 'register' | 'link';
type ErrorKey = AccountApiIssue | 'passwordMismatch' | 'accountUnavailable';

export function AuthScreen({ account, language, onLanguage, onAuth }: {
  account: LocalAccount | null; language: Language; onLanguage: (locale: Language) => void;
  onAuth: (account: LocalAccount) => void;
}) {
  const text = copy[language];
  const [mode, setMode] = useState<AuthMode>(account ? 'login' : 'register');
  const [method, setMethod] = useState<LoginMethod>(account?.method ?? 'email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const submitting = useRef(false);
  const phoneVerification = method === 'phone' && mode !== 'login';
  const action = mode === 'register' ? text.signUp : mode === 'link' ? text.linkAccount : text.signIn;
  const modeOptions: { id: AuthMode; name: string }[] = [{ id: 'login', name: text.signIn }];
  if (!account) modeOptions.push({ id: 'register', name: text.signUp });
  else if (!account.serverLinked) modeOptions.push({ id: 'link', name: text.linkAccount });

  function resetCode() {
    setCode('');
    setCodeSent(false);
    setError(null);
  }

  async function run(operation: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (failure) {
      setError(failure instanceof AccountApiError ? failure.issue : 'accountUnavailable');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function requestPhoneCode() {
    const phone = normalizeIdentifier('phone', identifier);
    if (!phone) { setError('invalidLogin'); return; }
    if (account && phone !== account.identifier) { setError('incorrectLogin'); return; }
    await run(async () => {
      setCodeSent(false);
      await api.requestPhoneCode(phone);
      setCodeSent(true);
    });
  }

  async function submit() {
    const normalized = normalizeIdentifier(method, identifier);
    if (!normalized) { setError('invalidLogin'); return; }
    const length = Array.from(password).length;
    if (mode === 'register' && (length < minPasswordLength || length > maxPasswordLength)) {
      setError('passwordLength');
      return;
    }
    if (mode === 'register' && password !== confirmation) { setError('passwordMismatch'); return; }
    if ((account && normalized !== account.identifier) || !length || length > maxPasswordLength) {
      setError('incorrectLogin');
      return;
    }
    if (phoneVerification && !/^\d{4,10}$/.test(code.trim())) { setError('invalidCode'); return; }

    await run(async () => {
      const credentials = { identifier: normalized, password, code: phoneVerification ? code.trim() : undefined };
      if (account) {
        if (!await verifyLocalPassword(account, password)) { setError('incorrectLogin'); return; }
        if (mode === 'link') {
          try {
            await api.authenticate('register', credentials);
          } catch (failure) {
            if (!(failure instanceof AccountApiError) || failure.issue !== 'accountExists') throw failure;
            await api.authenticate('login', { identifier: normalized, password });
          }
          onAuth(await markAccountShared(account));
        } else {
          onAuth(account);
        }
        return;
      }
      await api.authenticate(mode === 'register' ? 'register' : 'login', credentials);
      onAuth(await cacheSharedAccount(method, normalized, password));
    });
  }

  return (
    <KeyboardAvoidingView style={layout.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={layout.scroll}>
        <Brand />
        <Image source={roomImages.warm} style={styles.banner} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={layout.title}>{action}</Text>
          <Text style={layout.body}>{account && !account.serverLinked ? text.localAccount : text.sharedAccount}</Text>
        </View>
        <View style={layout.panel}>
          {modeOptions.length > 1 && <Switcher options={modeOptions} value={mode} onChange={(next) => {
            if (busy || next === mode) return;
            setMode(next);
            resetCode();
          }} />}
          {!account && <Switcher options={[{ id: 'email', name: text.email }, { id: 'phone', name: text.phone }]}
            value={method} onChange={(next) => {
              if (busy || next === method) return;
              setMethod(next);
              setIdentifier('');
              resetCode();
            }} />}
          <Field label={text[method]} placeholder={method === 'phone' ? '+7 700 000 00 00' : 'name@example.com'}
            autoCapitalize="none" autoCorrect={false}
            autoComplete={method === 'phone' ? 'tel' : 'email'}
            keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
            editable={!busy} value={identifier} maxLength={254} onChangeText={(value) => {
              setIdentifier(value);
              resetCode();
            }} />
          <Field label={text.password} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            editable={!busy} value={password} maxLength={maxPasswordLength * 2} onChangeText={setPassword}
            right={<Pressable accessibilityRole="button" hitSlop={10} onPress={() => setShowPassword(!showPassword)}>
              <Text style={layout.link}>{showPassword ? text.hidePassword : text.showPassword}</Text>
            </Pressable>} />
          {mode === 'register' && <Field label={text.confirmPassword} secureTextEntry={!showPassword}
            autoCapitalize="none" autoCorrect={false} editable={!busy}
            value={confirmation} maxLength={maxPasswordLength * 2} onChangeText={setConfirmation} />}
          {phoneVerification && <>
            <Button label={text.sendCode} secondary disabled={busy} onPress={() => void requestPhoneCode()} />
            <Field label={text.smsCode} autoComplete="one-time-code" keyboardType="number-pad"
              editable={!busy} value={code} maxLength={10} onChangeText={setCode} />
            {codeSent && <Status>{text.codeSent}</Status>}
          </>}
          {error && <Status error>{text[error]}</Status>}
          <Button label={busy ? text.checkingAccount : action} disabled={busy} onPress={() => void submit()} />
        </View>
        <LanguagePicker language={language} onChange={onLanguage} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%', height: 150, borderRadius: 23, backgroundColor: colors.accentSoft },
  heading: { gap: 7 },
});
