import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth';
import { config } from '@/lib/config';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== config.dashboardPassword()) {
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return res;
}
