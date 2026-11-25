import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { languages, type Language } from './copy';

export const colors = {
  paper: '#f7f3ec', surface: '#fffdf8', ink: '#22231f', muted: '#605f56',
  line: '#e1d9cc', accent: '#f9854b', accentSoft: '#ffe0cb', dark: '#29322b', error: '#9a3822',
};

export const roomImages = {
  before: require('../.generated/room-before.jpg'),
  warm: require('../.generated/room-warm.jpg'),
  light: require('../.generated/room-light.jpg'),
};

export function Brand() {
  return (
    <View style={styles.brand}>
      <Image source={require('../assets/icon.png')} style={styles.icon} accessibilityIgnoresInvertColors />
      <Text style={styles.wordmark}>AFTRO</Text>
    </View>
  );
}

export function Button({ label, onPress, secondary, disabled }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && styles.faded]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function Switcher<T extends string>({ options, value, onChange }: {
  options: readonly { id: T; name: string }[]; value: T; onChange: (value: T) => void;
}) {
  return (
    <View style={styles.switcher}>
      {options.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === value }}
          onPress={() => onChange(item.id)} style={[styles.option, item.id === value && styles.selected]}>
          <Text style={styles.optionText}>{item.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function LanguagePicker({ language, onChange }: { language: Language; onChange: (value: Language) => void }) {
  return <Switcher options={languages} value={language} onChange={onChange} />;
}

export function Field({ label, right, ...props }: TextInputProps & { label: string; right?: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={styles.input} {...props} />
        {right}
      </View>
    </View>
  );
}

export function Status({ children, error }: { children: ReactNode; error?: boolean }) {
  return <Text accessibilityLiveRegion="polite" style={[styles.status, error && styles.error]}>{children}</Text>;
}

export const layout = StyleSheet.create({
  screen: { backgroundColor: colors.paper, flex: 1 },
  scroll: { gap: 18, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 32, width: '100%', maxWidth: 640, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: 32, fontWeight: '700', letterSpacing: -0.8 },
  label: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  panel: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 22, padding: 17, gap: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  link: { color: colors.ink, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 30, height: 30, borderRadius: 8 },
  wordmark: { color: colors.ink, fontWeight: '800', fontSize: 17, letterSpacing: 2 },
  button: { borderRadius: 14, backgroundColor: colors.accent, minHeight: 50, justifyContent: 'center', alignItems: 'center', padding: 12 },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  faded: { opacity: 0.55 },
  switcher: { flexDirection: 'row', gap: 4, borderRadius: 14, padding: 4, backgroundColor: '#ebe4da' },
  option: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: 11 },
  selected: { backgroundColor: colors.surface },
  optionText: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  field: { gap: 6 },
  label: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.surface, paddingHorizontal: 12 },
  input: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 16, paddingVertical: 9 },
  status: { color: '#365a43', fontSize: 14, lineHeight: 20 },
  error: { color: colors.error },
});
