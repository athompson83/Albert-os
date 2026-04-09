'use client';
import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { mockApps } from '@/lib/mock-data';

export default function AppsPage() {
  const [apps, setApps] = useState(mockApps);

  const toggle = (id: string) => {
    setApps(a => a.map(app => app.id === id ? { ...app, connected: !app.connected, lastSync: !app.connected ? 'just now' : null } : app));
  };

  return (
    <div>
      <TopBar title="Connected Apps" />
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>
          {apps.filter(a => a.connected).length} of {apps.length} apps connected
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {apps.map(app => (
            <div key={app.id} style={{ background: 'var(--surface)', border: `1px solid ${app.connected ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{app.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{app.description}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500, background: app.connected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: app.connected ? '#10b981' : 'var(--text-muted)' }}>
                  {app.connected ? '● Connected' : '○ Not connected'}
                </span>
              </div>
              {app.lastSync && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Last sync: {app.lastSync}</div>}
              <button
                onClick={() => toggle(app.id)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: app.connected ? 'rgba(239,68,68,0.1)' : 'var(--primary)', color: app.connected ? '#ef4444' : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                {app.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
