import { auth, isAuthConfigured } from '@/auth';
import { NextResponse } from 'next/server';

const DEFAULT_PROTECTED_HOSTS = [
  'albert-os.vercel.app',
  'assemblexy.com',
  'localhost:3001',
  'localhost:3000',
  '127.0.0.1:3001',
  '127.0.0.1:3000',
];

function protectedHosts() {
  return (process.env.ALBERT_AUTH_HOSTS || DEFAULT_PROTECTED_HOSTS.join(','))
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get('host') || req.nextUrl.host || '').toLowerCase();

  if (!protectedHosts().includes(host)) {
    return NextResponse.next();
  }

  // Allow public paths
  const publicPaths = [
    '/login',
    '/api/auth',
    '/agent',
    '/hermes',
    '/api/hermes',
    '/api/slack',
  ];
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and PWA assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-touch') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/avatars')
  ) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!isAuthConfigured) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
