import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { aftroRequest, problem, type AuthResult, type ApiProblem } from './api';
import { copy, type Language } from './copy';
import { Brand, Button, Field, LanguagePicker, Status, Switcher, colors, layout, roomImages } from './ui';
import { parseOrigin } from './preview';

export function AuthScreen({ language, onLanguage, origin, onOrigin, onAuth, sessionError }: {
  language: Language; onLanguage: (locale: Language) => void; origin: string | null;
  onOrigin: (origin: string) => void; onAuth: (account: AuthResult, origin: string) => Promise<void>;
  sessionError: ApiProblem | null;
}) {
  const text = copy[language];
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiProblem | 'invalidAddress' | 'serverMissing' | null>(sessionError);
  const [serverOpen, setServerOpen] = useState(false);
  const [address, setAddress] = useState(origin ?? '');
  const phoneSignup = mode === 'register' && method === 'phone';

  async function connect() {
    const url = parseOrigin(address);
    if (!url) {
      setError('invalidAddress');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await aftroRequest(url, '/me');
    } catch (failure) {
      const reason = problem(failure);
      if (reason !== 'sign_in_required') {
        setError('accounts_unavailable');
        return;
      }
    } finally {
      setBusy(false);
    }
    onOrigin(url);
    setServerOpen(false);
  }

  async function submit(sendCode = false) {
    if (busy) return;
    setError(null);
    if (!origin) {
      setServerOpen(true);
      setError('serverMissing');
      return;
    }
    const accountId = identifier.trim();
    if (!accountId || (method === 'email' ? !accountId.includes('@') : !accountId.startsWith('+'))) {
      setError('invalid_identifier');
      return;
    }
    if (!sendCode && mode === 'register' && Array.from(password).length < 15) {
      setError('short_password');
      return;
    }
    if (!sendCode && (!password || (phoneSignup && !/^\d{4,10}$/.test(code)))) {
      setError(password ? 'missing_code' : 'invalid_form');
      return;
    }
    setBusy(true);
    try {
      if (sendCode) {
        await aftroRequest(origin, '/phone-code', { method: 'POST', body: { phone: accountId } });
        setSent(true);
      } else {
        const account = await aftroRequest<AuthResult>(origin, '/' + mode, {
          method: 'POST', body: { identifier: accountId, password, ...(phoneSignup ? { code } : {}) },
        });
        await onAuth(account, origin);
      }
    } catch (failure) {
      setError(problem(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={layout.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={layout.scroll}>
        <Brand />
        <Image style={styles.banner} source={roomImages.warm} accessibilityIgnoresInvertColors />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={layout.title}>{text.welcome}</Text>
          <Text style={layout.body}>{text.welcomeDetail}</Text>
        </View>
        <View style={layout.panel}>
          <Switcher options={[{ id: 'login', name: text.signIn }, { id: 'register', name: text.signUp }]}
            value={mode} onChange={(next) => { if (!busy) { setMode(next); setError(null); setCode(''); setSent(false); } }} />
          <Switcher options={[{ id: 'email', name: text.email }, { id: 'phone', name: text.phone }]}
            value={method} onChange={(next) => { if (!busy && next !== method) { setMethod(next); setIdentifier(''); setCode(''); setSent(false); setError(null); } }} />
          <Field label={text[method]} placeholder={method === 'phone' ? '+7 700 000 00 00' : 'name@example.com'}
            autoCapitalize="none" autoCorrect={false} autoComplete={method === 'phone' ? 'tel' : 'email'}
            keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'} editable={!busy}
            value={identifier} maxLength={254} onChangeText={(value) => { setIdentifier(value); setSent(false); setCode(''); }} />
          <Field label={text.password} placeholder={mode === 'register' ? text.passwordHint : undefined}
            autoCapitalize="none" autoCorrect={false} secureTextEntry={!show}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            editable={!busy} maxLength={128} value={password} onChangeText={setPassword}
            right={<Pressable accessibilityRole="button" hitSlop={10} onPress={() => setShow(!show)}>
              <Text style={layout.link}>{show ? text.hide : text.show}</Text>
            </Pressable>} />
          {phoneSignup && <>
            <Button label={text.send} secondary disabled={busy} onPress={() => void submit(true)} />
            {sent && <Status>{text.sent}</Status>}
            <Field label={text.code} keyboardType="number-pad" autoComplete="one-time-code"
              maxLength={10} value={code} editable={!busy} onChangeText={setCode} />
          </>}
          {error && !serverOpen && <Status error>{text[error]}</Status>}
          <Button label={busy ? text.connecting : mode === 'login' ? text.signIn : text.signUp}
            disabled={busy} onPress={() => void submit()} />
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: serverOpen }}
          onPress={() => { if (!busy) setServerOpen(!serverOpen); }}>
          <Text style={layout.link}>{text.server}</Text>
        </Pressable>
        {serverOpen && <View style={layout.panel}>
          <Text style={layout.body}>{text.serverHelp}</Text>
          <Field label={text.address} placeholder="http://192.168.1.42:8000" autoCapitalize="none"
            keyboardType="url" autoCorrect={false} value={address} editable={!busy} onChangeText={setAddress} />
          {error && <Status error>{text[error]}</Status>}
          <Button label={busy ? text.connecting : text.connect} secondary disabled={busy} onPress={() => void connect()} />
        </View>}
        <LanguagePicker language={language} onChange={onLanguage} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  banner: { width: '100%', height: 174, borderRadius: 23, backgroundColor: colors.accentSoft },
  heading: { gap: 7 },
});
