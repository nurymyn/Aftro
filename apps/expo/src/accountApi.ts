export type AccountApiIssue = 'apiAddressMissing' | 'apiUnavailable' | 'invalidLogin' | 'passwordLength'
  | 'incorrectLogin' | 'accountExists' | 'smsUnavailable' | 'invalidCode' | 'tooManyAttempts';

export class AccountApiError extends Error {
  readonly issue: AccountApiIssue;

  constructor(issue: AccountApiIssue) {
    super(issue);
    this.issue = issue;
  }
}

function isLocalHost(host: string) {
  if (host === 'localhost') return true;
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const [first, second] = host.split('.').map(Number);
  return first === 10 || first === 127 || (first === 192 && second === 168)
    || (first === 172 && second >= 16 && second <= 31);
}

export function accountApiOrigin(configured: string | undefined, development: boolean, metroHost?: string) {
  try {
    if (configured?.trim()) {
      const url = new URL(configured.trim());
      if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
      if (url.protocol === 'https:' || (development && url.protocol === 'http:' && isLocalHost(url.hostname))) {
        return url.origin;
      }
    } else if (development && metroHost) {
      const { hostname } = new URL(`http://${metroHost}`);
      if (isLocalHost(hostname)) return `http://${hostname}:8000`;
    }
  } catch {
    return null;
  }
  return null;
}

const responseIssues: Partial<Record<string, AccountApiIssue>> = {
  invalid_identifier: 'invalidLogin',
  short_password: 'passwordLength',
  incorrect_credentials: 'incorrectLogin',
  account_exists: 'accountExists',
  sms_unavailable: 'smsUnavailable',
  sms_failed: 'smsUnavailable',
  missing_code: 'invalidCode',
  invalid_code: 'invalidCode',
  too_many_attempts: 'tooManyAttempts',
};

type AccountCredentials = { identifier: string; password: string; code?: string };

export function createAccountApi(origin: string | null) {
  async function post(path: string, body: Record<string, string | undefined>) {
    if (!origin) throw new AccountApiError('apiAddressMissing');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${origin}/api/v1/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Aftro-Client': 'mobile' },
        body: JSON.stringify(body),
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error',
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail = typeof payload?.detail === 'string' ? payload.detail : '';
        const issue = Object.prototype.hasOwnProperty.call(responseIssues, detail) ? responseIssues[detail] : undefined;
        throw new AccountApiError(issue ?? 'apiUnavailable');
      }
      return payload;
    } catch (error) {
      if (error instanceof AccountApiError) throw error;
      throw new AccountApiError('apiUnavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  async function authenticate(mode: 'register' | 'login', credentials: AccountCredentials) {
    const account = await post(mode, credentials);
    const kind = credentials.identifier.includes('@') ? 'email' : 'phone';
    if (account?.identifier !== credentials.identifier || account.kind !== kind) {
      throw new AccountApiError('apiUnavailable');
    }
  }

  return {
    authenticate,
    async requestPhoneCode(phone: string) {
      const result = await post('phone-code', { phone });
      if (result?.sent !== true) throw new AccountApiError('apiUnavailable');
    },
  };
}
