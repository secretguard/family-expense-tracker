import { config } from './config';

export const SESSION_COOKIE_NAME = 'fet_session';

async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(config.sessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionCookieValue(): Promise<string> {
  const payload = 'authenticated';
  return `${payload}.${await hmac(payload)}`;
}

export async function isValidSessionCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;
  const expected = await hmac(payload);
  return expected === sig;
}
