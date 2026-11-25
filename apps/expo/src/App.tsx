import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { aftroRequest, problem, type Account, type ApiProblem, type Session } from './api';
import { AuthScreen } from './AuthScreen';
import { CameraScreen } from './CameraScreen';
import { copy, type Language } from './copy';
import { MeasureScreen } from './MeasureScreen';
import { sampleRoom, type Room } from './room';
import { RoomScreen } from './RoomScreen';
import { Brand, Button, LanguagePicker, colors, layout, roomImages } from './ui';
import { useAccount } from './useAccount';

type Page = 'home' | 'scan' | 'camera' | 'result' | 'tour' | 'profile';
const homeTabs = ['home', 'scan', 'profile'] as const;

function Workspace({ account, language, onLanguage, onSignOut }: {
  account: Account & Session; language: Language; onLanguage: (locale: Language) => void; onSignOut: (expired?: boolean) => void;
}) {
  const text = copy[language];
  const [page, setPage] = useState<Page>('home');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [draft, setDraft] = useState<Room | null>(null);
  const [lastRoom, setLastRoom] = useState<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [sample, setSample] = useState(false);
  const [calibration, setCalibration] = useState({ phoneHeight: 1.4, height: 2.8 });
  const [saving, setSaving] = useState(false);
  const [savedRoom, setSavedRoom] = useState<Room | null>(null);
  const [saveError, setSaveError] = useState<ApiProblem | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const { origin, token } = account;

  useEffect(() => {
    let active = true;
    aftroRequest<Room | null>(origin, '/room', { token }).then((result) => {
      if (active) setLastRoom((previous) => previous ?? result);
    }).catch((error) => {
      if (active && problem(error) === 'sign_in_required') onSignOut(true);
    });
    return () => { active = false; };
  }, [origin, token]);

  function openRoom(result: Room, isSample = false) {
    setRoom(result);
    setSavedRoom(result === lastRoom ? result : null);
    setSaveError(null);
    setSample(isSample);
    setPage('result');
  }

  function beginMeasure(next: 'camera' | 'manual' = 'camera', initial: Room | null = null) {
    setDraft(initial);
    setMode(next);
    setPage('scan');
  }

  async function save() {
    if (!room || sample || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const stored = await aftroRequest<Room>(origin, '/room', { token, method: 'PUT', body: room });
      setLastRoom(stored);
      setSavedRoom(room);
    } catch (error) {
      const reason = problem(error);
      if (reason === 'sign_in_required') onSignOut(true);
      else setSaveError(reason);
    } finally {
      setSaving(false);
    }
  }

  const focused = page === 'camera' || page === 'tour';
  return (
    <View style={layout.screen}>
      <View style={styles.header}>
        {focused ? <Pressable accessibilityRole="button" hitSlop={10}
          onPress={() => setPage(page === 'camera' ? 'scan' : 'result')}>
          <Text style={layout.link}>‹ {text.return}</Text>
        </Pressable> : <Brand />}
        {focused && <Text style={layout.label}>{page === 'camera' ? text.scan : text.tour}</Text>}
      </View>
      {page === 'home' && <ScrollView contentContainerStyle={layout.scroll}>
        <View style={styles.card}>
          <Image source={roomImages.warm} style={styles.hero} />
          <View style={styles.heroCopy}>
            <Text accessibilityRole="header" style={styles.heroTitle}>{text.hero}</Text>
            <Text style={styles.heroBody}>{text.heroNote}</Text>
            <Button label={text.start} onPress={() => beginMeasure()} />
          </View>
        </View>
        {lastRoom && <View style={layout.panel}>
          <Text style={layout.label}>{text.recent}</Text>
          <Text style={layout.body}>{lastRoom.width} × {lastRoom.length} {text.meters}</Text>
          <Button label={text.open} secondary onPress={() => openRoom(lastRoom)} />
        </View>}
        <Button label={text.sample} secondary onPress={() => openRoom({ ...sampleRoom, source: 'manual', finish: 'warm' }, true)} />
      </ScrollView>}
      {page === 'scan' && <MeasureScreen
        language={language} initial={draft} mode={mode} onMode={setMode}
        onCamera={(phoneHeight, height) => { setCalibration({ phoneHeight, height }); setPage('camera'); }}
        onResult={openRoom} />}
      {page === 'camera' && <CameraScreen language={language} {...calibration}
        onRoom={(dimensions) => openRoom({ ...dimensions, source: 'camera', finish: 'warm' })}
        onManual={() => beginMeasure('manual', draft)} />}
      {(page === 'result' || page === 'tour') && room && <RoomScreen
        room={room} text={text} language={language} sample={sample} full={page === 'tour'}
        saving={saving} saved={room === savedRoom} error={saveError}
        onFinish={(finish) => {
          setRoom((current) => current && current.finish !== finish ? { ...current, finish } : current);
          setSaveError(null);
        }}
        onFull={() => setPage('tour')} onEdit={() => beginMeasure('manual', room)} onSave={() => void save()} />}
      {page === 'profile' && <ScrollView contentContainerStyle={layout.scroll}>
        <Text accessibilityRole="header" style={layout.title}>{text.profile}</Text>
        <View style={layout.panel}>
          <Text style={layout.label}>{text[account.kind]}</Text>
          <Text selectable style={layout.body}>{account.identifier}</Text>
          <Text style={layout.label}>{text.language}</Text>
          <LanguagePicker language={language} onChange={onLanguage} />
          <Button label={text.signOut} secondary disabled={signingOut}
            onPress={() => { setSigningOut(true); onSignOut(); }} />
        </View>
      </ScrollView>}
      {!focused && <View style={styles.tabs}>
        {homeTabs.map((tab) => {
          const selected = page === tab || (tab === 'home' && page === 'result');
          return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected }}
            onPress={() => tab === 'scan' ? beginMeasure() : setPage(tab)}
            style={[styles.tab, selected && styles.selected]}>
            <Text style={styles.tabLabel}>{text[tab]}</Text>
          </Pressable>;
        })}
      </View>}
    </View>
  );
}

function Aftro() {
  const state = useAccount();
  return (
    <SafeAreaView style={layout.screen}>
      <StatusBar style="dark" />
      {state.loading ? <View style={styles.loading}><Brand /><ActivityIndicator color={colors.accent} /></View>
        : state.account ? <Workspace account={state.account} language={state.language} onLanguage={state.chooseLanguage}
          onSignOut={(expired) => void state.signOut(expired)} />
        : <AuthScreen origin={state.origin} language={state.language} onLanguage={state.chooseLanguage}
          onOrigin={state.changeOrigin} onAuth={state.signIn} sessionError={state.error} />}
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider initialMetrics={initialWindowMetrics}><Aftro /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  header: { paddingVertical: 9, paddingHorizontal: 22, minHeight: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { backgroundColor: colors.dark, borderRadius: 25, overflow: 'hidden' },
  hero: { width: '100%', height: 244 },
  heroCopy: { gap: 13, padding: 18 },
  heroTitle: { color: colors.surface, fontWeight: '700', fontSize: 28, letterSpacing: -0.5 },
  heroBody: { color: '#e5dfd4', fontSize: 15, lineHeight: 21 },
  tabs: { flexDirection: 'row', gap: 9, padding: 9, borderTopWidth: 1, borderColor: colors.line },
  tab: { flex: 1, minHeight: 45, padding: 5, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  selected: { backgroundColor: colors.accentSoft },
  tabLabel: { color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
});
