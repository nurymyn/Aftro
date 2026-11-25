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
