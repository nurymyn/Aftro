import { useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import offlinePreview from '../.generated/preview.json';
import { isLanguage, type Language } from './copy';
import {
  bridge, bundleGuestPage, isFinishPreference, setPreviewLanguage,
  type GuestPreferences, type PreviewPage,
} from './preview';

type Props = {
  page: PreviewPage;
  language: Language;
  origin: string | null;
  preferences: GuestPreferences;
  onPage: (page: PreviewPage) => void;
  onLanguage: (language: Language) => void;
  onPreference: (key: string, value: string) => void;
  onDisconnect: () => void;
};

export function PreviewScreen({ page, language, origin, preferences, onPage, onLanguage, onPreference, onDisconnect }: Props) {
  const browser = useRef<WebView<unknown>>(null);
  const initialLanguage = useRef(language);
  const source = useMemo(() => origin
    ? { uri: origin + (page === 'tour' ? '/preview/vr.html' : '/preview/') }
    : { html: bundleGuestPage(offlinePreview[page], { ...preferences, 'aftro.language': initialLanguage.current }) },
  [origin, page, preferences]);

  useEffect(() => {
    browser.current?.injectJavaScript(setPreviewLanguage(language));
  }, [language]);

  function allowed(url: string) {
    if (!origin) return url === 'about:blank' || url.startsWith('data:text/html');
    return ['/preview/', '/preview/index.html', '/preview/vr.html'].some((path) => {
      const destination = origin + path;
      return url === destination || url.startsWith(destination + '#');
    });
  }

  function onMessage(event: WebViewMessageEvent) {
    if (!allowed(event.nativeEvent.url)) return;
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message?.page === 'tour' || message?.page === 'apartment') onPage(message.page);
      if (isLanguage(message?.language)) onLanguage(message.language);
      if (!origin && isFinishPreference(message?.preference, message?.value)) {
        onPreference(message.preference, message.value);
      }
    } catch {
      // Leave the current screen in place for unrecognized messages.
    }
  }

  return (
    <WebView<unknown>
      ref={browser}
      source={source}
      originWhitelist={['*']}
      onShouldStartLoadWithRequest={({ url }) => allowed(url)}
      onMessage={onMessage}
      onLoad={() => browser.current?.injectJavaScript(bridge + setPreviewLanguage(language))}
      onError={origin ? onDisconnect : undefined}
      onHttpError={({ nativeEvent }) => {
        if (origin && allowed(nativeEvent.url)) onDisconnect();
      }}
      allowFileAccess={false}
      allowsBackForwardNavigationGestures={false}
      setSupportMultipleWindows={false}
      mixedContentMode="never"
      style={{ backgroundColor: '#f7f4ed' }}
    />
  );
}
