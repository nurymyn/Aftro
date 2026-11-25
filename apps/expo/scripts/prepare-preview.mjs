import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const scene = await readFile(new URL('../../web-preview/vr-scene.js', import.meta.url), 'utf8');
const output = new URL('../.generated/', import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(new URL('preview.json', output), JSON.stringify({ scene }) + '\n'),
  ...['before', 'warm', 'light'].map((finish) =>
    copyFile(new URL('../../web-preview/assets/room-' + finish + '.jpg', import.meta.url),
      new URL('room-' + finish + '.jpg', output))),
]);
