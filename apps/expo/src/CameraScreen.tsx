import { CameraView, useCameraPermissions } from 'expo-camera';
import { DeviceMotion, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { copy, type Language } from './copy';
import { estimateRoom, floorPoint, subtract, type Dimensions, type Point, type Vector } from './room';
import { Button, Status, colors, layout } from './ui';

type Reading = { point: Point; time: number };
const directions = ['first', 'second', 'third'] as const;

export function CameraScreen({ language, phoneHeight, height, onRoom, onManual }: {
  language: Language; phoneHeight: number; height: number;
  onRoom: (dimensions: Dimensions) => void; onManual: () => void;
}) {
  const text = copy[language];
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [points, setPoints] = useState<Point[]>([]);
  const [status, setStatus] = useState<'motionUnavailable' | 'badAim' | 'badRoom' | null>(null);
  const [sensorReady, setSensorReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const latest = useRef<Reading | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state === 'active') void getPermission().catch(() => {});
      else setCameraReady(false);
    });
    return () => subscription.remove();
  }, [getPermission]);

  useEffect(() => {
    if (!active || !permission?.granted) return;
    let disposed = false;
    let motion: { remove: () => void } | undefined;
    let magnetometer: { remove: () => void } | undefined;
    let magnetic: { vector: Vector; time: number } | undefined;
    let waiting: ReturnType<typeof setTimeout> | undefined;
    latest.current = null;
    setSensorReady(false);

    async function start() {
      const supported = await Promise.all([DeviceMotion.isAvailableAsync(), Magnetometer.isAvailableAsync()]);
      if (disposed) return;
      if (!supported.every(Boolean)) {
        setStatus('motionUnavailable');
        return;
      }
      // Only these two listeners consume sensor readings on this screen.
      DeviceMotion.setUpdateInterval(65);
      Magnetometer.setUpdateInterval(65);
      magnetometer = Magnetometer.addListener((vector) => { magnetic = { vector, time: Date.now() }; });
      motion = DeviceMotion.addListener((value) => {
        if (waiting) clearTimeout(waiting);
        setSensorReady(true);
        const now = Date.now();
        const rate = value.rotationRate;
        const acceleration = value.acceleration;
        const total = value.accelerationIncludingGravity;
        const steady = rate && Math.hypot(rate.alpha, rate.beta, rate.gamma) < 12
          && acceleration && Math.hypot(acceleration.x, acceleration.y, acceleration.z) < 0.55;
        const point = steady && total && magnetic && now - magnetic.time < 220
          ? floorPoint(subtract(total, acceleration), magnetic.vector, phoneHeight) : null;
        latest.current = point ? { point, time: now } : null;
      });
      waiting = setTimeout(() => { if (!disposed) setStatus('motionUnavailable'); }, 1800);
    }
    void start().catch(() => { if (!disposed) setStatus('motionUnavailable'); });
    return () => {
      disposed = true;
      latest.current = null;
      motion?.remove();
      magnetometer?.remove();
      if (waiting) clearTimeout(waiting);
    };
  }, [active, permission?.granted, phoneHeight]);

  function mark() {
    if (status === 'motionUnavailable') return;
    const reading = latest.current;
    if (!reading || Date.now() - reading.time > 300) {
      setStatus('badAim');
      return;
    }
    const next = [...points, reading.point];
    setStatus(null);
    if (next.length < 3) {
      setPoints(next);
      return;
    }
    const result = estimateRoom(next[0], next[1], next[2]);
    if (result) onRoom({ ...result, height });
    else {
      setPoints([]);
      setStatus('badRoom');
    }
  }

  if (!permission?.granted) {
    const blocked = permission?.canAskAgain === false;
    return (
      <View style={styles.permission}>
        <Text accessibilityRole="header" style={layout.title}>{text.measureCamera}</Text>
        <Text style={layout.body}>{text.cameraAccess}</Text>
        <Button label={blocked ? text.settings : text.cameraPermission}
          onPress={() => { if (blocked) void Linking.openSettings(); else void requestPermission(); }} />
        <Button label={text.manual} secondary onPress={onManual} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {active && <CameraView facing="back" style={StyleSheet.absoluteFill} pointerEvents="none"
        onCameraReady={() => setCameraReady(true)} />}
      <View style={styles.hud}>
        <Text style={styles.step}>{points.length + 1} / 3</Text>
        <Text accessibilityRole="header" style={styles.title}>{text[directions[points.length]]}</Text>
        <Text style={styles.white}>{text.position}</Text>
      </View>
      <View pointerEvents="none" style={styles.target}><View style={styles.dot} /></View>
      <View style={styles.hud}>
        {status && <Status error>{text[status]}</Status>}
        <Button label={sensorReady || status === 'motionUnavailable' ? text.mark : text.scanBusy}
          disabled={!cameraReady || !sensorReady || status === 'motionUnavailable'} onPress={mark} />
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" hitSlop={9} onPress={onManual}>
            <Text style={layout.link}>{text.manual}</Text>
          </Pressable>
          {points.length > 0 && <Pressable accessibilityRole="button" hitSlop={9}
            onPress={() => { setPoints([]); setStatus(null); }}>
            <Text style={layout.link}>{text.restart}</Text>
          </Pressable>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permission: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  screen: { flex: 1, backgroundColor: colors.dark, justifyContent: 'space-between' },
  hud: { margin: 12, padding: 15, gap: 7, borderRadius: 16, backgroundColor: colors.paper },
  step: { color: '#473522', fontWeight: '800', fontSize: 15 },
  title: { color: colors.ink, fontWeight: '700', fontSize: 19 },
  white: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  target: { position: 'absolute', top: '50%', left: '50%', marginLeft: -23, marginTop: -23, width: 46, height: 46, borderWidth: 2, borderColor: '#ffffff', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
});
