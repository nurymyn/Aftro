export type Account = { identifier: string; kind: 'email' | 'phone' };
export type Session = { token: string; origin: string };
export type AuthResult = Account & { access_token: string };
export type ApiProblem = 'accounts_unavailable' | 'invalid_identifier' | 'missing_code'
  | 'invalid_code' | 'short_password' | 'incorrect_credentials' | 'account_exists'
  | 'sms_unavailable' | 'sms_failed' | 'too_many_attempts' | 'sign_in_required' | 'invalid_form';

const knownProblems = new Set<ApiProblem>([
  'invalid_identifier', 'missing_code', 'invalid_code', 'short_password', 'incorrect_credentials',
  'account_exists', 'sms_unavailable', 'sms_failed', 'too_many_attempts', 'sign_in_required',
]);

export class ApiError extends Error {
  constructor(readonly code: ApiProblem) {
    super(code);
  }
}

export const problem = (error: unknown): ApiProblem =>
  error instanceof ApiError ? error.code : 'accounts_unavailable';

export async function aftroRequest<T>(
  origin: string,
  path: string,
  options: { method?: 'POST' | 'PUT'; body?: object; token?: string } = {},
): Promise<T> {
  const { method, body, token } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(origin + '/api/v1/auth' + path, {
      method: method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'X-Aftro-Client': 'mobile',
        ...(method ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: method ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
    });
    if (response.status === 204) return undefined as T;
    const result = await response.json();
    if (response.ok) return result as T;
    if (knownProblems.has(result?.detail)) throw new ApiError(result.detail);
    throw new ApiError(response.status === 404 || response.status >= 500 ? 'accounts_unavailable' : 'invalid_form');
  } catch (error) {
    throw new ApiError(problem(error));
  } finally {
    clearTimeout(timeout);
  }
}
