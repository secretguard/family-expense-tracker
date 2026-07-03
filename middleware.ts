import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (await isValidSessionCookie(cookie)) {
    return NextResponse.next();
  }
  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!login|api/login|api/telegram-webhook|api/setup|api/cron|_next|favicon.ico).*)'],
};
