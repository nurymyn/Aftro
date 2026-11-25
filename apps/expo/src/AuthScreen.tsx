import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { copy, type Language } from './copy';
import { maxPasswordLength, minPasswordLength, normalizeIdentifier, type LocalAccount, type LoginMethod } from './credentials';
import { createLocalAccount, verifyLocalPassword } from './localAccount';
import { Brand, Button, Field, LanguagePicker, Status, Switcher, colors, layout, roomImages } from './ui';

type ErrorKey = 'invalidLogin' | 'passwordLength' | 'passwordMismatch' | 'incorrectLogin' | 'accountUnavailable';

export function AuthScreen({ account, language, onLanguage, onAuth }: {
  account: LocalAccount | null; language: Language; onLanguage: (locale: Language) => void;
  onAuth: (account: LocalAccount) => void;
}) {
  const text = copy[language];
  const [method, setMethod] = useState<LoginMethod>(account?.method ?? 'email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const submitting = useRef(false);
  const action = account ? text.signIn : text.signUp;

  async function submit() {
    if (submitting.current) return;
    const normalized = normalizeIdentifier(method, identifier);
    if (normalized === null) { setError('invalidLogin'); return; }
    const length = Array.from(password).length;
    if (!account && (length < minPasswordLength || length > maxPasswordLength)) {
      setError('passwordLength');
      return;
    }
    if (!account && password !== confirmation) { setError('passwordMismatch'); return; }
    if (account && (normalized !== account.identifier || !length || length > maxPasswordLength)) {
      setError('incorrectLogin');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const activeAccount = account ?? await createLocalAccount(method, normalized, password);
      if (account && !await verifyLocalPassword(account, password)) {
        setError('incorrectLogin');
        return;
      }
      onAuth(activeAccount);
    } catch {
      setError('accountUnavailable');
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <KeyboardAvoidingView style={layout.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={layout.scroll}>
        <Brand />
        <Image source={roomImages.warm} style={styles.banner} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={layout.title}>{action}</Text>
          <Text style={layout.body}>{text.localAccount}</Text>
        </View>
        <View style={layout.panel}>
          {!account && <Switcher options={[{ id: 'email', name: text.email }, { id: 'phone', name: text.phone }]}
            value={method} onChange={(next) => {
              if (busy || next === method) return;
              setMethod(next);
              setIdentifier('');
              setError(null);
            }} />}
          <Field label={text[method]} placeholder={method === 'phone' ? '+7 700 000 00 00' : 'name@example.com'}
            autoCapitalize="none" autoCorrect={false}
            autoComplete={method === 'phone' ? 'tel' : 'email'}
            keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
            editable={!busy} value={identifier} maxLength={254} onChangeText={setIdentifier} />
          <Field label={text.password} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
            autoComplete={account ? 'current-password' : 'new-password'}
            editable={!busy} value={password} maxLength={maxPasswordLength * 2} onChangeText={setPassword}
            right={<Pressable accessibilityRole="button" hitSlop={10} onPress={() => setShowPassword(!showPassword)}>
              <Text style={layout.link}>{showPassword ? text.hidePassword : text.showPassword}</Text>
            </Pressable>} />
          {!account && <Field label={text.confirmPassword} secureTextEntry={!showPassword}
            autoCapitalize="none" autoCorrect={false} editable={!busy}
            value={confirmation} maxLength={maxPasswordLength * 2} onChangeText={setConfirmation} />}
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
