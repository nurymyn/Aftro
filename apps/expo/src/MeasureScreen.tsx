import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { copy, type Language } from './copy';
import { parseMeasurement, type Room } from './room';
import { Button, Field, Status, Switcher, layout } from './ui';

export function MeasureScreen({ language, initial, mode, onMode, onCamera, onResult }: {
  language: Language;
  initial: Room | null;
  mode: 'camera' | 'manual';
  onMode: (mode: 'camera' | 'manual') => void;
  onCamera: (phoneHeight: number, ceilingHeight: number) => void;
  onResult: (room: Room) => void;
}) {
  const text = copy[language];
  const [width, setWidth] = useState(initial ? String(initial.width) : '');
  const [length, setLength] = useState(initial ? String(initial.length) : '');
  const [height, setHeight] = useState(String(initial?.height ?? 2.8));
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);

  function submit() {
    const h = parseMeasurement(height, 1.8, 6);
    if (mode === 'camera') {
      const p = parseMeasurement(phone, 0.35, 2.2);
      if (p !== null && h !== null) onCamera(p, h);
      else setError(true);
      return;
    }
    const w = parseMeasurement(width, 0.8, 20);
    const d = parseMeasurement(length, 0.8, 20);
    if (w === null || d === null || h === null) {
      setError(true);
      return;
    }
    onResult({ width: w, length: d, height: h, source: 'manual', finish: initial?.finish ?? 'warm' });
  }

  return (
    <KeyboardAvoidingView style={layout.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={layout.scroll} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={layout.title}>{text.setup}</Text>
        <Switcher options={[{ id: 'camera', name: text.measureCamera }, { id: 'manual', name: text.manual }]}
          value={mode} onChange={(value) => { onMode(value); setError(false); }} />
        <View style={layout.panel}>
          {mode === 'camera' ? <>
            <Text style={layout.body}>{text.cameraHint}</Text>
            <Field label={text.phoneHeight + ' · ' + text.meters} keyboardType="decimal-pad"
              placeholder="1.40" value={phone} maxLength={6} onChangeText={setPhone} />
            <Text style={layout.body}>{text.heightHelp}</Text>
          </> : <>
            <Field label={text.width + ' · ' + text.meters} keyboardType="decimal-pad"
              value={width} maxLength={6} onChangeText={setWidth} />
            <Field label={text.length + ' · ' + text.meters} keyboardType="decimal-pad"
              value={length} maxLength={6} onChangeText={setLength} />
          </>}
          <Field label={text.height + ' · ' + text.meters} keyboardType="decimal-pad"
            value={height} maxLength={6} onChangeText={setHeight} />
          {mode === 'camera' && <Text style={layout.body}>{text.ceilingHelp}</Text>}
          {error && <Status error>{text.invalidSize}</Status>}
          <Button label={mode === 'camera' ? text.measureCamera : text.preview} onPress={submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
