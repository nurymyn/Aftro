import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import preview from '../.generated/preview.json';
import type { AppCopy } from './copy';
import type { Dimensions, Finish } from './room';
import { Button, colors } from './ui';

function roomPage(room: Dimensions, finish: Finish) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
html,body,canvas { margin:0; width:100%; height:100%; display:block; overflow:hidden; background:#2c2b29; touch-action:none; }
</style></head><body><canvas id="room"></canvas><script>
${preview.scene.replace(/<\/script/gi, '<\\/script')}
const room = ${JSON.stringify(room)};
const canvas = document.getElementById('room');
const scene = createAftroScene(canvas, room);
const position = { x: 0, y: Math.min(1.52, room.height * 0.73), z: room.length * 0.37, pitch: -0.12, yaw: 0 };
function draw() {
  if (!scene) return;
  const density = Math.min(1.65, devicePixelRatio || 1);
  const w = Math.max(1, Math.round(canvas.clientWidth * density));
  const h = Math.max(1, Math.round(canvas.clientHeight * density));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  scene.gl.viewport(0, 0, w, h);
  scene.clear();
  scene.draw(aftroProjection(w / h), aftroView(position));
}
function setFinish(value) {
  if (Object.hasOwn(aftroPresets, value)) { scene?.setFinish(value); draw(); }
}
function step(direction) {
  const x = room.width / 2 - 0.15, z = room.length / 2 - 0.15;
  position.x = Math.max(-x, Math.min(x, position.x + Math.sin(position.yaw) * direction * 0.34));
  position.z = Math.max(-z, Math.min(z, position.z - Math.cos(position.yaw) * direction * 0.34));
  draw();
}
let tracking = null;
canvas.addEventListener('pointerdown', (e) => {
  tracking = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!tracking || tracking.id !== e.pointerId) return;
  position.yaw -= (e.clientX - tracking.x) * 0.007;
  position.pitch = Math.max(-1.32, Math.min(1.32, position.pitch + (e.clientY - tracking.y) * 0.007));
  tracking.x = e.clientX; tracking.y = e.clientY;
  draw();
});
canvas.addEventListener('lostpointercapture', () => { tracking = null; });
window.AftroRoom = { setFinish, step };
window.addEventListener('resize', draw);
if (scene) setFinish(${JSON.stringify(finish)});
else window.ReactNativeWebView?.postMessage('no3d');
</script></body></html>`;
}

export function RoomPreview({ dimensions, finish, text, full, onUnavailable }: {
  dimensions: Dimensions; finish: Finish; text: AppCopy; full?: boolean; onUnavailable: () => void;
}) {
  const browser = useRef<WebView<unknown>>(null);
  const initialFinish = useRef(finish);
  const { width, length, height } = dimensions;
  const source = useMemo(() => ({ html: roomPage({ width, length, height }, initialFinish.current) }),
    [width, length, height]);

  function setFinish() {
    browser.current?.injectJavaScript(`window.AftroRoom?.setFinish(${JSON.stringify(finish)}); true;`);
  }
  useEffect(setFinish, [finish]);

  return (
    <View style={[styles.frame, full && styles.full]}>
      <WebView<unknown> ref={browser} source={source} originWhitelist={['*']}
        onShouldStartLoadWithRequest={({ url }) => url === 'about:blank' || url.startsWith('data:text/html')}
        onLoad={setFinish} onError={onUnavailable}
        onMessage={({ nativeEvent }) => { if (nativeEvent.data === 'no3d') onUnavailable(); }}
        scrollEnabled={false} bounces={false} setSupportMultipleWindows={false}
        mixedContentMode="never" allowFileAccess={false}
        style={styles.browser} />
      {full && <View style={styles.steps}>
        <Button secondary label={text.stepBack} onPress={() => browser.current?.injectJavaScript('window.AftroRoom?.step(-1); true;')} />
        <Button secondary label={text.stepForward} onPress={() => browser.current?.injectJavaScript('window.AftroRoom?.step(1); true;')} />
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 245, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.dark },
  full: { flex: 1, height: 'auto', borderRadius: 0 },
  browser: { backgroundColor: colors.dark },
  steps: { gap: 8, flexDirection: 'row', justifyContent: 'center', padding: 9, backgroundColor: colors.paper },
});
