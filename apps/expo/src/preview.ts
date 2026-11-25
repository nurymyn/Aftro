export type PreviewPage = 'apartment' | 'tour';
export type GuestPreferences = Record<string, string>;

export function isFinishPreference(key: unknown, value: unknown): key is string {
  return (key === 'aftro.demo.finish' || key === 'aftro.vr.finish')
    && (value === 'warm' || value === 'light' || (key === 'aftro.vr.finish' && value === 'before'));
}

export function bundleGuestPage(html: string, preferences: GuestPreferences) {
  return html.replace('<!-- aftro-guest-storage -->', () => `<script>
  (() => {
    const values = ${JSON.stringify(preferences)};
    Object.defineProperty(window, 'localStorage', { value: {
      getItem(key) { return Object.hasOwn(values, key) ? values[key] : null; },
      setItem(key, value) {
        values[key] = String(value);
        window.ReactNativeWebView?.postMessage(JSON.stringify({ preference: key, value: values[key] }));
      },
    } });
  })();
  </script>`);
}

export const bridge = `
(() => {
  if (window.aftroMobileSetLanguage) return;
  const post = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
  const language = document.querySelector('select');
  window.aftroMobileSetLanguage = (value) => {
    if (language && language.value !== value) {
      language.value = value;
      language.dispatchEvent(new Event('change'));
    }
  };
  language?.addEventListener('change', () => post({ language: language.value }));
  document.addEventListener('click', (event) => {
    const href = event.target.closest?.('a')?.getAttribute('href');
    if (href === './vr.html' || href === './index.html') {
      event.preventDefault();
      post({ page: href === './vr.html' ? 'tour' : 'apartment' });
    }
  });
})();
true;
`;

export function setPreviewLanguage(language: string) {
  return `window.aftroMobileSetLanguage?.(${JSON.stringify(language)}); true;`;
}

export function parseOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (url.protocol === 'https:') return url.origin;
    if (url.protocol !== 'http:') return null;
    const ip = url.hostname.split('.');
    if (ip.length !== 4 || !ip.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) return null;
    const [first, second] = ip.map(Number);
    const privateIP = first === 10 || (first === 192 && second === 168) || (first === 172 && second >= 16 && second <= 31);
    return privateIP ? url.origin : null;
  } catch {
    return null;
  }
}
