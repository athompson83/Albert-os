'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const errorParam = params.get('error');
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(errorParam ? 'Sign-in failed. Please try again.' : '');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid username or password.');
      return;
    }

    router.push(result?.url || callbackUrl);
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, rgba(99,102,241,0.16), transparent 34%), #07111b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 390,
          background: 'linear-gradient(180deg, rgba(20,34,48,0.96), rgba(13,25,36,0.96))',
          border: '1px solid rgba(93,121,148,0.34)',
          borderRadius: 14,
          padding: '34px 30px',
          boxShadow: '0 18px 50px rgba(0,0,0,0.34)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{
            width: 82,
            height: 82,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #6366f1',
            boxShadow: '0 0 24px rgba(99,102,241,0.35)',
          }}>
            <Image src="/avatars/albert.png" alt="Albert" width={82} height={82} style={{ objectFit: 'cover' }} />
          </div>
        </div>

        <h1 style={{ fontSize: 23, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>Albert OS</h1>
        <p style={{ fontSize: 13, color: '#9aa7b7', margin: '0 0 26px', textAlign: 'center' }}>
          Sign in to your command center
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.34)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 16,
            color: '#fca5a5',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <label style={labelStyle}>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            autoFocus
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 6,
            background: '#6366f1',
            border: '1px solid #7477ff',
            borderRadius: 9,
            color: '#fff',
            padding: '12px 16px',
            fontSize: 15,
            fontWeight: 750,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.72 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ fontSize: 11, color: '#7f8b9b', margin: '22px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
          Hermes API routes remain available for connected services.
        </p>
      </form>
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

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 7,
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 14,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(7,17,27,0.82)',
  border: '1px solid rgba(93,121,148,0.45)',
  borderRadius: 9,
  color: '#fff',
  padding: '11px 12px',
  fontSize: 15,
  outline: 'none',
};
