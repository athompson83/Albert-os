import TopBar from '@/components/TopBar';
import { mockStats, mockActivity, mockApps, mockTasks } from '@/lib/mock-data';

export default function Dashboard() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const upcomingTasks = mockTasks.filter(t => t.status !== 'done').slice(0, 3);
  const connectedApps = mockApps.filter(a => a.connected);

  const statCards = [
    { label: 'Unread Emails', value: mockStats.unreadEmails, color: '#6366f1', emoji: '📧' },
    { label: 'Pending Tasks', value: mockStats.pendingTasks, color: '#8b5cf6', emoji: '✅' },
    { label: 'Active Projects', value: mockStats.activeProjects, color: '#06b6d4', emoji: '📁' },
    { label: 'Connected Apps', value: mockStats.connectedApps, color: '#10b981', emoji: '🔌' },
  ];

  return (
    <div>
      <TopBar title="Dashboard" />
      <div style={{ padding: 24 }}>
        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Good morning, Adam 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{dateStr} · {timeStr}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Activity Feed */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Recent Activity</h3>
            {mockActivity.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Tasks */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Upcoming Tasks</h3>
            {upcomingTasks.map(t => (
              <div key={t.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 7, marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#e5e5e5', fontWeight: 500 }}>{t.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.project}</span>
                  <span style={{ fontSize: 11, color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#888' }}>● {t.priority}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>Due {t.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Apps */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#fff' }}>Connected Apps</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {connectedApps.map(app => (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
                <span style={{ fontSize: 18 }}>{app.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e5e5e5' }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: '#10b981' }}>● Connected · {app.lastSync}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '+ New Task', href: '/tasks' },
            { label: '+ New Project', href: '/projects' },
            { label: '💬 Ask Albert', href: '/chat' },
            { label: '🔌 Connect App', href: '/apps' },
          ].map(a => (
            <a key={a.label} href={a.href} style={{ padding: '9px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'border-color 0.15s' }}>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
