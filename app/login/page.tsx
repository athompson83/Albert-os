'use client';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const error = params.get('error');

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 36px', textAlign: 'center',
      }}>
        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            overflow: 'hidden', border: '2px solid #6366f1',
            boxShadow: '0 0 24px rgba(99,102,241,0.35)',
          }}>
            <Image src="/avatars/albert.png" alt="Albert" width={88} height={88} style={{ objectFit: 'cover' }} />
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
          Albert OS
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 32px' }}>
          Your personal AI command center
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#fca5a5',
          }}>
            {error === 'AccessDenied'
              ? 'Access denied. This account is not authorized.'
              : 'Sign-in failed. Please try again.'}
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '13px 20px',
            background: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600, color: '#1f1f1f',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {/* Google G logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 24, lineHeight: 1.5 }}>
          Restricted access. Authorized users only.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
