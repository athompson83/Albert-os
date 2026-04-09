import TopBar from '@/components/TopBar';
import { mockLogs } from '@/lib/mock-data';

export default function LogsPage() {
  return (
    <div>
      <TopBar title="Autonomous Action Logs" />
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Everything Albert has done autonomously on your behalf.</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Timestamp', 'Action', 'Outcome', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < mockLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#e5e5e5' }}>{log.action}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 500, background: log.outcome === 'success' ? 'rgba(16,185,129,0.15)' : log.outcome === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: log.outcome === 'success' ? '#10b981' : log.outcome === 'warning' ? '#f59e0b' : '#ef4444' }}>
                      {log.outcome}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
