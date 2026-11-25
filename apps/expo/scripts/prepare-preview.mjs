import { mkdir, readFile, writeFile } from 'node:fs/promises';

const preview = new URL('../../web-preview/', import.meta.url);
const output = new URL('../.generated/', import.meta.url);
const imageNames = ['room-before.jpg', 'room-warm.jpg', 'room-light.jpg'];
const images = Object.fromEntries(await Promise.all(imageNames.map(async (name) => {
  const bytes = await readFile(new URL(`assets/${name}`, preview));
  return [name.replace('.jpg', ''), `data:image/jpeg;base64,${bytes.toString('base64')}`];
})));

const loadImages = `<script>
(() => {
  const images = ${JSON.stringify(images)};
  for (const [name, src] of Object.entries(images)) {
    document.documentElement.style.setProperty('--aftro-' + name, 'url("' + src + '")');
  }
  for (const image of document.querySelectorAll('[data-aftro-image]')) {
    image.src = images[image.dataset.aftroImage];
  }
})();
</script>`;

async function bundle(page, styles, scripts) {
  let html = await readFile(new URL(page, preview), 'utf8');
  for (const style of styles) {
    const css = (await readFile(new URL(style, preview), 'utf8'))
      .replace(/url\("assets\/(room-(?:before|warm|light))\.jpg"\)/g, 'var(--aftro-$1)');
    html = html.replace(`<link rel="stylesheet" href="${style}">`, () => `<style>${css}</style>`);
  }
  const inlineScripts = [];
  for (const script of scripts) {
    const js = await readFile(new URL(script, preview), 'utf8');
    html = html.replace(`<script src="${script}" defer></script>`, '');
    inlineScripts.push(`<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);
  }
  html = html.replace('</head>', '<!-- aftro-guest-storage -->\n</head>');
  html = html.replace(/src="assets\/(room-(?:before|warm|light))\.jpg"/g, 'data-aftro-image="$1"');
  html = html.replace('</body>', () => [loadImages, ...inlineScripts, '</body>'].join('\n'));
  return html;
}

const [apartment, tour] = await Promise.all([
  bundle('index.html', ['styles.css', 'auth.css'], ['app.js', 'auth.js']),
  bundle('vr.html', ['vr.css'], ['vr-scene.js', 'vr.js']),
]);

await mkdir(output, { recursive: true });
await writeFile(new URL('preview.json', output), JSON.stringify({ apartment, tour }) + '\n');
