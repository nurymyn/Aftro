import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { CameraScreen } from './CameraScreen';
import { copy, isLanguage, type Language } from './copy';
import { restoreRoom, saveLocalRoom, shareRoomFile, type SavedRoom } from './localRoom';
import { MeasureScreen } from './MeasureScreen';
import { sampleRoom, type Room } from './room';
import { RoomScreen } from './RoomScreen';
import { Brand, Button, LanguagePicker, Status, colors, layout, roomImages } from './ui';

type Page = 'home' | 'scan' | 'camera' | 'result' | 'tour' | 'profile';
const homeTabs = ['home', 'scan', 'profile'] as const;
const languageKey = 'aftro.language';

function Workspace({ language, onLanguage }: {
  language: Language; onLanguage: (locale: Language) => void;
}) {
  const text = copy[language];
  const [page, setPage] = useState<Page>('home');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [draft, setDraft] = useState<Room | null>(null);
  const [lastRoom, setLastRoom] = useState<SavedRoom | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [sample, setSample] = useState(false);
  const [calibration, setCalibration] = useState({ phoneHeight: 1.4, height: 2.8 });
  const [saving, setSaving] = useState(false);
  const [savedRoom, setSavedRoom] = useState<Room | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    void restoreRoom().then((result) => {
      if (active && result) setLastRoom((previous) => previous ?? result);
    });
    return () => { active = false; };
  }, []);

  function openRoom(result: Room, isSample = false, id: string | null = null) {
    setRoom(result);
    setRoomId(id);
    setSavedRoom(result === lastRoom ? result : null);
    setSaveError(false);
    setSample(isSample);
    setPage('result');
  }

  function beginMeasure(next: 'camera' | 'manual' = 'camera', initial: Room | null = null) {
    setDraft(initial);
    if (!initial) setRoomId(null);
    setMode(next);
    setPage('scan');
  }

  async function save() {
    if (!room || sample || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const stored = await saveLocalRoom(room, roomId);
      setLastRoom(stored);
      setRoomId(stored.id);
      setSavedRoom(room);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function exportRoom() {
    if (!lastRoom || sharing) return;
    setSharing(true);
    setShareError(false);
    try {
      await shareRoomFile(lastRoom);
    } catch {
      setShareError(true);
    } finally {
      setSharing(false);
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
          <Button label={text.open} secondary onPress={() => openRoom(lastRoom, false, lastRoom.id)} />
        </View>}
        <Button label={text.sample} secondary onPress={() => openRoom({ ...sampleRoom, source: 'manual', finish: 'warm' }, true)} />
      </ScrollView>}
      {page === 'scan' && <MeasureScreen
        language={language} initial={draft} mode={mode} onMode={setMode}
        onCamera={(phoneHeight, height) => { setCalibration({ phoneHeight, height }); setPage('camera'); }}
        onResult={(result) => openRoom(result, false, draft ? roomId : null)} />}
      {page === 'camera' && <CameraScreen language={language} {...calibration}
        onRoom={(dimensions) => openRoom({ ...dimensions, source: 'camera', finish: 'warm' })}
        onManual={() => beginMeasure('manual', draft)} />}
      {(page === 'result' || page === 'tour') && room && <RoomScreen
        room={room} text={text} language={language} sample={sample} full={page === 'tour'}
        saving={saving} saved={room === savedRoom} error={saveError}
        onFinish={(finish) => {
          setRoom((current) => current && current.finish !== finish ? { ...current, finish } : current);
          setSaveError(false);
        }}
        onFull={() => setPage('tour')} onEdit={() => beginMeasure('manual', room)} onSave={() => void save()} />}
      {page === 'profile' && <ScrollView contentContainerStyle={layout.scroll}>
        <Text accessibilityRole="header" style={layout.title}>{text.profile}</Text>
        <View style={layout.panel}>
          <Text style={layout.label}>{text.recent}</Text>
          {lastRoom ? <>
            <Text style={layout.body}>{lastRoom.width} × {lastRoom.length} {text.meters}</Text>
            <Button label={text.open} secondary onPress={() => openRoom(lastRoom, false, lastRoom.id)} />
            <Button label={sharing ? text.sharing : text.exportRoom} disabled={sharing}
              onPress={() => void exportRoom()} />
            <Text style={layout.body}>{text.exportHelp}</Text>
            {shareError && <Status error>{text.exportError}</Status>}
          </> : <Text style={layout.body}>{text.emptyRooms}</Text>}
        </View>
        <View style={layout.panel}>
          <Text style={layout.label}>{text.language}</Text>
          <LanguagePicker language={language} onChange={onLanguage} />
        </View>
      </ScrollView>}
      {!focused && <View style={styles.tabs}>
        {homeTabs.map((tab) => {
          const selected = page === tab || (tab === 'home' && page === 'result');
          return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected, disabled: saving }}
            disabled={saving}
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
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<Language>('kk');

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(languageKey).then((locale) => {
      if (active && isLanguage(locale)) setLanguage(locale);
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  function chooseLanguage(locale: Language) {
    setLanguage(locale);
    void AsyncStorage.setItem(languageKey, locale).catch(() => {});
  }

  return (
    <SafeAreaView style={layout.screen}>
      <StatusBar style="dark" />
      {ready ? <Workspace language={language} onLanguage={chooseLanguage} />
        : <View style={styles.loading}><Brand /><ActivityIndicator color={colors.accent} /></View>}
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
