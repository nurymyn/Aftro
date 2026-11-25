import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { copy, type Language } from './copy';

export function CameraScreen({ language, onApartment }: { language: Language; onApartment: () => void }) {
  const text = copy[language];
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'live' | 'scan'>('live');
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [invalidCode, setInvalidCode] = useState(false);
  const scanned = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  function resetScan() {
    scanned.current = false;
    setInvalidCode(false);
  }

  function scan(value: string) {
    if (scanned.current) return;
    scanned.current = true;
    const code = value.trim().toLowerCase();
    if (code === 'demo-apartment' || code === 'aftro://apartment/demo-apartment') {
      onApartment();
    } else {
      setInvalidCode(true);
    }
  }

  function enableCamera() {
    if (permission?.canAskAgain === false) void Linking.openSettings();
    else void requestPermission();
  }

  if (!permission?.granted) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>{text.camera}</Text>
        <Text style={styles.note}>{text.cameraAccess}</Text>
        <Pressable accessibilityRole="button" onPress={enableCamera} style={styles.primary}>
          <Text style={styles.primaryText}>
            {permission?.canAskAgain === false ? text.openSettings : text.allowCamera}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {active && (
        <CameraView
          facing="back"
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={mode === 'scan' && !invalidCode ? ({ data }) => scan(data) : undefined}
          pointerEvents="none"
        />
      )}
      <View style={styles.selector}>
        {(['live', 'scan'] as const).map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item === mode }}
            key={item}
            onPress={() => { resetScan(); setMode(item); }}
            style={[styles.mode, item === mode && styles.selectedMode]}
          >
            <Text style={[styles.modeText, item === mode && styles.selectedText]}>{text[item]}</Text>
          </Pressable>
        ))}
      </View>
      {mode === 'scan' && <View pointerEvents="none" style={styles.target} />}
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          {mode === 'live' ? text.liveNote : invalidCode ? text.scanError : text.aim}
        </Text>
        {invalidCode && mode === 'scan' && (
          <Pressable accessibilityRole="button" onPress={resetScan} style={styles.primary}>
            <Text style={styles.primaryText}>{text.scanAgain}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1d2523', justifyContent: 'space-between' },
  empty: { flex: 1, padding: 28, justifyContent: 'center', alignItems: 'flex-start', gap: 14 },
  title: { color: '#18231f', fontSize: 28, fontWeight: '700' },
  note: { color: '#53605a', fontSize: 16, lineHeight: 24 },
  selector: { margin: 16, alignSelf: 'center', flexDirection: 'row', borderRadius: 30, padding: 4, backgroundColor: '#17211eee' },
  mode: { paddingHorizontal: 15, paddingVertical: 12, borderRadius: 26 },
  selectedMode: { backgroundColor: '#f2f0e9' },
  modeText: { color: '#ffffff', fontWeight: '600' },
  selectedText: { color: '#18231f' },
  target: { alignSelf: 'center', width: '60%', maxWidth: 280, aspectRatio: 1, borderColor: '#fa7946', borderWidth: 2, borderRadius: 25 },
  caption: { backgroundColor: '#17211eee', margin: 16, padding: 16, borderRadius: 16, gap: 12 },
  captionText: { fontSize: 15, lineHeight: 21, color: '#ffffff' },
  primary: { backgroundColor: '#fa7946', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  primaryText: { fontWeight: '700', color: '#18231f' },
});
