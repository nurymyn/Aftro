import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppCopy, Language } from './copy';
import { RoomPreview } from './PreviewScreen';
import { roomQuantities, type Finish, type Room } from './room';
import { Button, Status, Switcher, colors, layout, roomImages } from './ui';

export function RoomScreen({ room, sample, text, language, full, saving, saved, error, onFinish, onFull, onEdit, onSave }: {
  room: Room; sample: boolean; text: AppCopy; language: Language; full: boolean;
  saving: boolean; saved: boolean; error: boolean;
  onFinish: (finish: Finish) => void; onFull: () => void; onEdit: () => void; onSave: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  const measures = roomQuantities(room);
  const finishOptions: { id: Finish; name: string }[] =
    (['before', 'warm', 'light'] as const).map((id) => ({ id, name: text[id] }));
  const selector = <Switcher options={finishOptions} value={room.finish} onChange={onFinish} />;
  const preview = failed
    ? <View style={styles.fallback}>
      <Image source={roomImages[room.finish]} style={styles.image} />
      <Status error>{text.no3d}</Status>
    </View>
    : <RoomPreview dimensions={room} finish={room.finish} text={text} full={full} onUnavailable={() => setFailed(true)} />;

  if (full) return <View style={layout.screen}>
    <View style={styles.fullTop}><Text style={layout.body}>{text.viewFirst}</Text>{selector}</View>
    {preview}
  </View>;

  return (
    <ScrollView contentContainerStyle={layout.scroll}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={layout.title}>{text.result}</Text>
        <Text style={layout.body}>{sample ? text.sample : room.source === 'camera' ? text.estimate : text.entered}</Text>
      </View>
      {preview}
      {selector}
      <Button label={text.preview} onPress={onFull} disabled={failed} />
      <Text style={layout.body}>{text.resultHelp}</Text>
      <View style={layout.panel}>
        <Text style={layout.label}>{text.review}</Text>
        <Text style={layout.body}>
          {format.format(room.width)} × {format.format(room.length)} × {format.format(room.height)} {text.meters}
        </Text>
        {([{ label: text.floor, value: measures.floor }, { label: text.walls, value: measures.wall },
          { label: text.materials, value: measures.order }]).map(({ label, value }) => (
          <View key={label} style={styles.measure}>
            <Text style={styles.measureLabel}>{label}</Text>
            <Text style={styles.value}>{format.format(value)} {text.squares}</Text>
          </View>
        ))}
        <Text style={layout.body}>{text.wallsNote}</Text>
      </View>
      {!sample && <>
        <Button label={text.edit} onPress={onEdit} secondary disabled={saving} />
        <Button label={saving ? text.saving : text.save} onPress={onSave} disabled={saving} />
        {error && <Status error>{text.saveError}</Status>}
        {saved && <Status>{text.saved}</Status>}
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 5 },
  measure: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 11, borderTopWidth: 1, borderColor: colors.line },
  measureLabel: { color: colors.ink, fontSize: 14, flexShrink: 1 },
  value: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  fullTop: { paddingHorizontal: 16, paddingVertical: 9, gap: 9 },
  fallback: { gap: 12 },
  image: { width: '100%', height: 245, borderRadius: 20 },
});
