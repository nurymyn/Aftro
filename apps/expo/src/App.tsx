import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { CameraScreen } from './CameraScreen';
import { PreviewScreen } from './PreviewScreen';
import { copy, isLanguage, languages, type Language } from './copy';
import { isFinishPreference, parseOrigin, type GuestPreferences } from './preview';

const languageKey = 'aftro.language';
const originKey = 'aftro.server-origin';
const finishKeys = ['aftro.demo.finish', 'aftro.vr.finish'];
const tabs = ['apartment', 'camera', 'tour', 'settings'] as const;
type Tab = (typeof tabs)[number];
type Notice = 'invalidAddress' | 'unreachable';

function Aftro() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('apartment');
  const [language, setLanguage] = useState<Language>('kk');
  const [origin, setOrigin] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const guest = useRef<GuestPreferences>({});
  const messages = copy[language];

  useEffect(() => {
    let mounted = true;
    AsyncStorage.multiGet([languageKey, originKey, ...finishKeys]).then((values) => {
      if (!mounted) return;
      const stored = new Map(values);
      const savedLanguage = stored.get(languageKey);
      const savedAddress = stored.get(originKey);
      if (isLanguage(savedLanguage)) setLanguage(savedLanguage);
      if (savedAddress) {
        setOrigin(parseOrigin(savedAddress));
        setAddress(savedAddress);
      }
      for (const key of finishKeys) {
        const value = stored.get(key);
        if (typeof value === 'string' && isFinishPreference(key, value)) guest.current[key] = value;
      }
    }).catch(() => {
      // Demo mode works without local preferences.
    }).finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  function updateLanguage(value: Language) {
    setLanguage(value);
    void AsyncStorage.setItem(languageKey, value).catch(() => {});
  }

  function disconnect() {
    setOrigin(null);
    setNotice(null);
    void AsyncStorage.removeItem(originKey).catch(() => {});
  }

  function updatePreference(key: string, value: string) {
    guest.current[key] = value;
    void AsyncStorage.setItem(key, value).catch(() => {});
  }

  async function connect() {
    const candidate = parseOrigin(address);
    if (!candidate) {
      setNotice('invalidAddress');
      return;
    }

    setConnecting(true);
    setNotice(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(candidate + '/api/v1/apartments/demo-apartment', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Aftro API unavailable');
      const apartment = await response.json();
      if (!Number.isFinite(apartment?.width_m) || !Array.isArray(apartment?.finishes)) {
        throw new Error('Unexpected Aftro API response');
      }
      setAddress(candidate);
      setOrigin(candidate);
      setTab('apartment');
      void AsyncStorage.setItem(originKey, candidate).catch(() => {});
    } catch {
      setNotice('unreachable');
    } finally {
      clearTimeout(timeout);
      setConnecting(false);
    }
  }

  function handleServerError() {
    disconnect();
    setNotice('unreachable');
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      {!ready ? (
        <View style={styles.loading}><ActivityIndicator color="#e96536" /></View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.content, tab !== 'apartment' && styles.hidden]}>
            <PreviewScreen
              key={origin ?? 'offline'}
              page="apartment"
              origin={origin}
              language={language}
              preferences={guest.current}
              onPage={setTab}
              onLanguage={updateLanguage}
              onPreference={updatePreference}
              onDisconnect={handleServerError}
            />
          </View>
          {tab === 'camera' && <CameraScreen language={language} onApartment={() => setTab('apartment')} />}
          {tab === 'tour' && (
            <PreviewScreen
              key={'tour-' + (origin ?? 'offline')}
              page="tour"
              origin={origin}
              language={language}
              preferences={guest.current}
              onPage={setTab}
              onLanguage={updateLanguage}
              onPreference={updatePreference}
              onDisconnect={handleServerError}
            />
          )}
          {tab === 'settings' && (
            <ScrollView contentContainerStyle={styles.settings} keyboardShouldPersistTaps="handled">
              <Text style={styles.heading}>{messages.settings}</Text>
              <Text style={styles.fieldLabel}>{messages.language}</Text>
              <View style={styles.languages}>
                {languages.map(({ id, name }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: id === language }}
                    onPress={() => updateLanguage(id)}
                    key={id}
                    style={[styles.languageChoice, id === language && styles.active]}
                  >
                    <Text style={styles.controlText}>{name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>{messages.server}</Text>
              <Text style={styles.help}>{messages.serverHelp}</Text>
              <Text style={styles.connection}>{origin ? messages.connected : messages.offline}</Text>
              <TextInput
                accessibilityLabel={messages.address}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!connecting}
                placeholder="http://192.168.1.42:8000"
                placeholderTextColor="#666f67"
                value={address}
                onChangeText={(value) => { setAddress(value); setNotice(null); }}
                onSubmitEditing={() => { if (!connecting) void connect(); }}
                style={styles.input}
              />
              {notice && <Text accessibilityLiveRegion="polite" style={styles.error}>{messages[notice]}</Text>}
              <Pressable accessibilityRole="button" disabled={connecting} onPress={() => void connect()} style={styles.primary}>
                <Text style={styles.controlText}>{connecting ? messages.connecting : messages.connect}</Text>
              </Pressable>
              {origin && (
                <Pressable accessibilityRole="button" disabled={connecting} onPress={disconnect} style={styles.languageChoice}>
                  <Text style={styles.controlText}>{messages.disconnect}</Text>
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>
      )}
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: item === tab }}
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, item === tab && styles.active]}
          >
            <Text style={styles.tabText}>{messages[item]}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Aftro />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#f7f4ed' },
  content: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center' },
  hidden: { display: 'none' },
  tabs: { flexDirection: 'row', gap: 4, padding: 8, borderTopWidth: 1, borderColor: '#e0ded3' },
  tab: { flex: 1, minHeight: 44, padding: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabText: { color: '#1f2a23', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  active: { backgroundColor: '#ffe1cf' },
  settings: { padding: 24, gap: 12 },
  heading: { fontSize: 28, fontWeight: '700', color: '#17241e', marginBottom: 6 },
  fieldLabel: { fontSize: 16, fontWeight: '700', color: '#17241e', marginTop: 8 },
  languages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageChoice: { padding: 12, minHeight: 44, justifyContent: 'center', borderWidth: 1, borderRadius: 12, borderColor: '#dfded3' },
  controlText: { color: '#17241e', fontSize: 15, fontWeight: '700' },
  help: { color: '#556359', lineHeight: 22, fontSize: 15 },
  connection: { color: '#446547', fontWeight: '600' },
  input: { borderColor: '#dfded3', borderWidth: 1, borderRadius: 12, minHeight: 50, padding: 12, color: '#17241e', backgroundColor: '#fffffa' },
  error: { fontSize: 14, color: '#963d27' },
  primary: { minHeight: 49, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fa7946' },
});
